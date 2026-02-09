from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.csv_import_service import CsvImportService

router = APIRouter()
service = CsvImportService()


@router.post(
    "/csv",
    status_code=status.HTTP_200_OK,
)
async def upload_csv(
    table: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),  # ✅ login required (no grade required)
    db: Session = Depends(get_db),
):
    """
    Upload d'un CSV + import générique vers la table cible.

    Query param:
      - table=insertion|etudiants|mobilite

    Multipart:
      - file=<csv>
    """
    return await service.import_csv(db=db, table=table, file=file)
