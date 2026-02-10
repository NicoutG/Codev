import csv
import io
import re
from typing import Dict, Any, List

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.dao.metadata_dao import MetadataDao
from app.dao.insertion_dao import InsertionDao
from app.dao.etudiants_dao import EtudiantsDao
from app.dao.mobilite_dao import MobiliteDao


def _normalize_header(h: str) -> str:
    # minuscule + trim + espaces -> underscore
    h = (h or "").strip().lower()
    h = re.sub(r"\s+", "_", h)
    h = re.sub(r"_+", "_", h)
    return h


def _decode_bytes(b: bytes) -> str:
    # Try UTF-8 (with BOM) then fallback
    for enc in ("utf-8-sig", "utf-8", "latin-1"):
        try:
            return b.decode(enc)
        except UnicodeDecodeError:
            continue
    # last resort
    return b.decode("utf-8", errors="replace")


def _detect_delimiter(sample: str) -> str:
    """
    Detect delimiter between ',' and ';' (and fallback to Sniffer).
    """
    first_line = sample.splitlines()[0] if sample else ""
    comma = first_line.count(",")
    semi = first_line.count(";")
    if semi > comma:
        return ";"
    if comma > semi:
        return ","

    # fallback sniffer
    try:
        dialect = csv.Sniffer().sniff(sample[:4096], delimiters=[",", ";", "\t"])
        if dialect.delimiter in [",", ";", "\t"]:
            return dialect.delimiter
    except Exception:
        pass

    # default
    return ";"


class CsvImportService:
    """
    Import CSV générique vers une table cible.
    Workflow unique, table/PK/DAO définis par mapping.
    """

    def __init__(self):
        self.metadata = MetadataDao()

        # mapping table -> (primary_key, dao)
        self._dao_by_table = {
            "insertion": ("code", InsertionDao()),
            "etudiants": ("id_polytech", EtudiantsDao()),
            "mobilite": ("id_polytech_inter", MobiliteDao()),
        }

    def _get_expected_columns(self, table: str) -> List[str]:
        cols = self.metadata.get_columns(table)
        # on suppose que metadata_dao expose déjà les noms normalisés
        return cols

    def _get_pk_and_dao(self, table: str):
        if table not in self._dao_by_table:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Table '{table}' non supportée pour l'import.",
            )
        return self._dao_by_table[table]  # (pk, dao)

    async def import_csv(self, db: Session, table: str, file: UploadFile) -> Dict[str, Any]:
        # 1) verify table exists in metadata list
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

        # 2) read file
        raw = await file.read()
        if not raw:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fichier CSV vide.",
            )

        text = _decode_bytes(raw)
        delimiter = _detect_delimiter(text)

        # 3) parse CSV
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

        # ignorer les headers vides (ex: ";;" dans la ligne d'en-têtes)
        ignored_columns: List[Dict[str, Any]] = []
        filtered_pairs = []
        for idx, col in enumerate(header_norm):
            if col == "":
                ignored_columns.append(
                    {
                        "index": idx,
                        "raw": header_raw[idx] if idx < len(header_raw) else "",
                    }
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

        # 4) validate headers (sur les colonnes filtrées)
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

        # index mapping (col -> index original dans la row)
        col_index = {col: original_idx for original_idx, col in filtered_pairs}
        max_index_needed = max(indices) if indices else 0

        processed = 0
        upserted = 0
        errors = []
        CHUNK_SIZE = 100  # Traiter par lots de 100 lignes pour optimiser les performances

        # 5) process rows par chunks pour optimiser les performances
        chunk = []
        for row_num, row in enumerate(reader, start=2):  # 2 because header is line 1
            # skip empty lines
            if not row or all((c or "").strip() == "" for c in row):
                continue

            # pad row so we can access the highest index we need
            if len(row) <= max_index_needed:
                row = row + [""] * (max_index_needed + 1 - len(row))

            payload: Dict[str, Any] = {}
            for col in expected_cols:
                idx = col_index[col]
                val = row[idx] if idx < len(row) else ""
                val = (val or "").strip()
                payload[col] = val if val != "" else None

            pk_val = payload.get(pk_field)
            if pk_val is None or (isinstance(pk_val, str) and pk_val.strip() == ""):
                errors.append(f"Ligne {row_num}: clé primaire '{pk_field}' vide.")
                continue

            chunk.append((row_num, payload))

            # Traiter le chunk quand il atteint la taille maximale
            if len(chunk) >= CHUNK_SIZE:
                try:
                    # Utiliser une transaction pour le chunk
                    for chunk_row_num, chunk_payload in chunk:
                        try:
                            dao.upsert(db, chunk_payload)
                            upserted += 1
                            processed += 1
                        except ValueError as ve:
                            errors.append(f"Ligne {chunk_row_num}: {str(ve)}")
                        except Exception as e:
                            errors.append(f"Ligne {chunk_row_num}: erreur lors de l'upsert ({type(e).__name__})")
                    db.commit()  # Commit après chaque chunk
                except Exception as e:
                    db.rollback()
                    errors.append(f"Erreur lors du traitement du chunk (lignes {chunk[0][0]}-{chunk[-1][0]}): {str(e)}")
                chunk = []

        # Traiter le dernier chunk s'il reste des lignes
        if chunk:
            try:
                for chunk_row_num, chunk_payload in chunk:
                    try:
                        dao.upsert(db, chunk_payload)
                        upserted += 1
                        processed += 1
                    except ValueError as ve:
                        errors.append(f"Ligne {chunk_row_num}: {str(ve)}")
                    except Exception as e:
                        errors.append(f"Ligne {chunk_row_num}: erreur lors de l'upsert ({type(e).__name__})")
                db.commit()
            except Exception as e:
                db.rollback()
                errors.append(f"Erreur lors du traitement du dernier chunk: {str(e)}")

        # Si trop d'erreurs, lever une exception
        if len(errors) > processed * 0.1:  # Plus de 10% d'erreurs
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Trop d'erreurs lors de l'import ({len(errors)} erreurs sur {processed} lignes traitées). Premières erreurs: {errors[:5]}",
            )

        return {
            "status": "ok",
            "table": table,
            "delimiter": delimiter,
            "processed_rows": processed,
            "upserted_rows": upserted,
            "ignored_columns": ignored_columns,
            "errors": errors[:10] if errors else [],  # Limiter à 10 erreurs pour la réponse
            "error_count": len(errors),
        }
