import csv
import io
from typing import Dict, Any, List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.dao.metadata_dao import MetadataDao
from app.dao.insertion_dao import InsertionDao
from app.dao.etudiants_dao import EtudiantsDao
from app.dao.mobilite_dao import MobiliteDao


class CsvExportService:
    """
    Export CSV générique d'une table cible.
    - Table autorisée = MetadataDao.get_tables()
    - Colonnes = MetadataDao.get_columns(table)
    - Les données viennent des DAO (méthode export_all)
    """

    def __init__(self):
        self.metadata = MetadataDao()

        # mapping table -> dao
        self._dao_by_table = {
            "insertion": InsertionDao(),
            "etudiants": EtudiantsDao(),
            "mobilite": MobiliteDao(),
        }

    def _get_dao(self, table: str):
        dao = self._dao_by_table.get(table)
        if not dao:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Table '{table}' non supportée pour l'export.",
            )
        return dao

    def export_csv(
        self,
        db: Session,
        table: str,
        delimiter: str = ";",
        include_bom: bool = True,
    ) -> Dict[str, Any]:
        allowed = self.metadata.get_tables()
        if table not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Table inconnue '{table}'. Tables autorisées: {allowed}",
            )

        if delimiter not in [",", ";", "\t"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delimiter invalide. Utilise ',', ';' ou '\\t'.",
            )

        columns: List[str] = self.metadata.get_columns(table)
        dao = self._get_dao(table)

        # ✅ Le DAO doit renvoyer une liste de dict (clé=colonne)
        rows: List[Dict[str, Any]] = dao.export_all(db)

        sio = io.StringIO()
        writer = csv.writer(sio, delimiter=delimiter, lineterminator="\n")

        # header
        writer.writerow(columns)

        # rows
        for r in rows:
            writer.writerow([(r.get(col) if r.get(col) is not None else "") for col in columns])

        csv_text = sio.getvalue()

        # BOM UTF-8 pour Excel (optionnel)
        if include_bom:
            csv_text = "\ufeff" + csv_text

        return {
            "table": table,
            "columns": columns,
            "row_count": len(rows),
            "csv": csv_text,
        }
