from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.table_data_service import TableDataService

router = APIRouter()
service = TableDataService()


@router.get("/{table}")
def get_table_data(
    table: str,
    skip: int = Query(0, ge=0, description="Nombre de lignes à sauter (pagination)"),
    limit: int = Query(50, ge=1, le=1000, description="Nombre maximum de lignes à retourner"),
    search: Optional[str] = Query(None, description="Terme de recherche"),
    sort_by: Optional[str] = Query(None, description="Colonne pour le tri"),
    sort_order: str = Query("asc", regex="^(asc|desc)$", description="Ordre de tri (asc ou desc)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Récupère les données d'une table avec pagination, recherche et tri.
    
    Tables disponibles : insertion, etudiants, mobilite
    """
    return service.get_table_data(
        db=db,
        table=table,
        skip=skip,
        limit=limit,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
