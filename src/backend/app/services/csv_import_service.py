import csv
import io
from typing import Dict, Any, List, Tuple, Optional
import re
import unicodedata

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, DataError, IntegrityError, ProgrammingError
from sqlalchemy import Integer

from app.dao.metadata_dao import MetadataDao
from app.dao.insertion_dao import InsertionDao
from app.dao.etudiants_dao import EtudiantsDao
from app.dao.mobilite_dao import MobiliteDao

from app.models.insertion import Insertion
from app.models.etudiants import Etudiants
from app.models.mobilite import Mobilite


def _normalize_header(h: str) -> str:
    h = (h or "").strip().lower()
    h = re.sub(r"\s+", "_", h)
    h = re.sub(r"_+", "_", h)
    return h


def _decode_bytes(b: bytes) -> str:
    for enc in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return b.decode(enc)
        except UnicodeDecodeError:
            continue
    return b.decode("utf-8", errors="replace")


def _detect_delimiter(sample: str) -> str:
    first_line = sample.splitlines()[0] if sample else ""
    comma = first_line.count(",")
    semi = first_line.count(";")
    if semi > comma:
        return ";"
    if comma > semi:
        return ","

    try:
        dialect = csv.Sniffer().sniff(sample[:4096], delimiters=[",", ";", "\t"])
        if dialect.delimiter in [",", ";", "\t"]:
            return dialect.delimiter
    except Exception:
        pass
    return ";"

def normalize_text_value(value: Optional[str]) -> Optional[str]:
    """
    Normalise un champ texte avant insertion en base:
    - trim
    - unicode normalize
    - remplace \r \n \t par espaces
    - remplace ' et " par espace
    - supprime caractères de contrôle invisibles
    - lower
    - compacte les espaces (max 1 espace consécutif) + trim final
    """
    if value is None:
        return None

    v = str(value)
    v = unicodedata.normalize("NFKC", v)
    v = v.replace("\r\n", " ").replace("\n", " ").replace("\r", " ").replace("\t", " ")
    v = v.replace("'", " ").replace('"', " ")
    v = "".join(ch for ch in v if ch == " " or unicodedata.category(ch)[0] != "C")
    v = v.lower()
    v = re.sub(r"\s+", " ", v).strip()
    return v

def _looks_like_int(s: str) -> bool:
    if s is None:
        return False
    s = s.strip()
    if s == "":
        return False
    return re.fullmatch(r"-?\d+", s) is not None


def _build_sqlalchemy_error_detail(e: Exception) -> str:
    parts = [type(e).__name__]
    orig = getattr(e, "orig", None)
    if orig is not None:
        parts.append(str(orig))
    msg = str(e)
    if msg:
        parts.append(msg)
    stmt = getattr(e, "statement", None)
    if stmt:
        parts.append(f"SQL: {stmt[:250]}")
    return " | ".join(parts)


class CsvImportService:
    """
    Import CSV générique vers une table cible.
    Workflow unique, table/PK/DAO définis par mapping.
    """

    def __init__(self):
        self.metadata = MetadataDao()

        self._dao_by_table = {
            "insertion": ("code", InsertionDao()),
            "etudiants": ("id_polytech", EtudiantsDao()),
            "mobilite": ("id_polytech_inter", MobiliteDao()),
        }

        # modèle -> pour détecter Integer/Text
        self._model_by_table = {
            "insertion": Insertion,
            "etudiants": Etudiants,
            "mobilite": Mobilite,
        }

    def _get_expected_columns(self, table: str) -> List[str]:
        return self.metadata.get_columns(table)

    def _get_pk_and_dao(self, table: str):
        if table not in self._dao_by_table:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Table '{table}' non supportée pour l'import.",
            )
        return self._dao_by_table[table]

    def _get_integer_columns_from_model(self, table: str) -> List[str]:
        model = self._model_by_table.get(table)
        if model is None:
            return []
        int_cols: List[str] = []
        try:
            for col in model.__table__.columns:
                if isinstance(col.type, Integer):
                    int_cols.append(col.name)
        except Exception:
            return []
        return int_cols

    async def import_csv(self, db: Session, table: str, file: UploadFile) -> Dict[str, Any]:
        allowed = self.metadata.get_tables()
        if table not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Table inconnue '{table}'. Tables autorisées: {allowed}",
            )

        pk_field, dao = self._get_pk_and_dao(table)
        expected_cols = self._get_expected_columns(table)

        if pk_field not in expected_cols:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Configuration invalide: la clé primaire '{pk_field}' n'est pas dans les colonnes attendues.",
            )

        raw = await file.read()
        if not raw:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fichier CSV vide.",
            )

        text = _decode_bytes(raw)
        delimiter = _detect_delimiter(text)

        sio = io.StringIO(text)
        reader = csv.reader(sio, delimiter=delimiter)

        try:
            header_raw = next(reader)
        except StopIteration:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV vide (aucune ligne).",
            )

        header_norm = [_normalize_header(h) for h in header_raw]

        ignored_columns: List[Dict[str, Any]] = []
        filtered_pairs: List[Tuple[int, str]] = []
        for idx, col in enumerate(header_norm):
            if col == "":
                ignored_columns.append(
                    {"index": idx, "raw": header_raw[idx] if idx < len(header_raw) else ""}
                )
            else:
                filtered_pairs.append((idx, col))

        if not filtered_pairs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Première ligne (en-têtes) invalide (toutes les colonnes sont vides).",
            )

        header = [col for _, col in filtered_pairs]
        indices = [i for i, _ in filtered_pairs]

        expected_set = set(expected_cols)
        header_set = set(header)

        missing = sorted(list(expected_set - header_set))
        extra = sorted(list(header_set - expected_set))

        if missing or extra:
            msg_parts = []
            if missing:
                msg_parts.append(f"Colonnes manquantes: {missing}")
            if extra:
                msg_parts.append(f"Colonnes inconnues: {extra}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="; ".join(msg_parts),
            )

        if pk_field not in header_set:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Clé primaire manquante dans le CSV: '{pk_field}'",
            )

        col_index = {col: original_idx for original_idx, col in filtered_pairs}
        max_index_needed = max(indices) if indices else 0

        processed = 0
        upserted = 0
        errors: List[str] = []

        int_columns = set(self._get_integer_columns_from_model(table))

        def _payload_debug(payload: Dict[str, Any]) -> str:
            pk_val = payload.get(pk_field)
            suspects = {}
            for k in sorted(int_columns):
                if k in payload and payload[k] is not None:
                    suspects[k] = payload[k]
            return f"pk={pk_field}={pk_val} | int_fields={suspects}"

        def _push_error(line: int, msg: str, payload: Optional[Dict[str, Any]] = None):
            if payload:
                errors.append(f"Ligne {line}: {msg} ({_payload_debug(payload)})")
            else:
                errors.append(f"Ligne {line}: {msg}")

        def _prepare_payload(row: List[str]) -> Dict[str, Any]:
            payload: Dict[str, Any] = {}
            for col in expected_cols:
                idx = col_index[col]
                raw_val = row[idx] if idx < len(row) else ""
                norm_val = normalize_text_value(raw_val or "")

                if norm_val == "":
                    payload[col] = None
                    continue

                # ⚠️ on garde tout en string ici, et on valide avant DB
                payload[col] = norm_val
            return payload

        def _validate_types(payload: Dict[str, Any]) -> Optional[str]:
            """
            Retourne un message d'erreur si une valeur ne match pas le type attendu,
            sinon None.
            """
            for col in int_columns:
                v = payload.get(col)
                if v is None:
                    continue
                # v est string (normalisé)
                if isinstance(v, str) and not _looks_like_int(v):
                    return f"Colonne '{col}' attend un entier mais reçu: {v!r}"
            return None

        # Parcours ligne par ligne avec SAVEPOINT pour éviter l'abort global
        for row_num, row in enumerate(reader, start=2):
            if not row or all((c or "").strip() == "" for c in row):
                continue

            if len(row) <= max_index_needed:
                row = row + [""] * (max_index_needed + 1 - len(row))

            payload = _prepare_payload(row)

            pk_val = payload.get(pk_field)
            if pk_val is None or (isinstance(pk_val, str) and pk_val.strip() == ""):
                _push_error(row_num, f"clé primaire '{pk_field}' vide.", payload)
                continue

            # validation types AVANT DB
            type_err = _validate_types(payload)
            if type_err:
                _push_error(row_num, type_err, payload)
                continue

            # SAVEPOINT: une ligne en erreur ne casse pas tout
            try:
                with db.begin_nested():
                    dao.upsert(db, payload)
                upserted += 1
                processed += 1
            except ValueError as ve:
                _push_error(row_num, str(ve), payload)
            except (DataError, IntegrityError, ProgrammingError, SQLAlchemyError) as se:
                _push_error(row_num, _build_sqlalchemy_error_detail(se), payload)
                # rollback du nested est automatique, mais on sécurise
                db.rollback()
            except Exception as e:
                _push_error(row_num, _build_sqlalchemy_error_detail(e), payload)
                db.rollback()

        # commit global
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur commit final: {_build_sqlalchemy_error_detail(e)}",
            )

        # si trop d’erreurs
        if processed > 0 and len(errors) > processed * 0.1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Trop d'erreurs lors de l'import ({len(errors)} erreurs sur {processed} lignes traitées). "
                    f"Premières erreurs: {errors[:5]}"
                ),
            )

        return {
            "status": "ok",
            "table": table,
            "delimiter": delimiter,
            "processed_rows": processed,
            "upserted_rows": upserted,
            "ignored_columns": ignored_columns,
            "errors": errors[:10] if errors else [],
            "error_count": len(errors),
        }
