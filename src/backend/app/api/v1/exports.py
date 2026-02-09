from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.csv_export_service import CsvExportService

router = APIRouter()
service = CsvExportService()


@router.get("/csv")
def export_table_csv(
    table: str = Query(..., description="Nom de la table à exporter"),
    delimiter: str = Query(";", description="Délimiteur CSV: ';' ',' ou '\\t'"),
    bom: bool = Query(True, description="Ajouter un BOM UTF-8 (utile pour Excel)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = service.export_csv(db=db, table=table, delimiter=delimiter, include_bom=bom)

    filename = f"{result['table']}.csv"
    return Response(
        content=result["csv"],
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )
