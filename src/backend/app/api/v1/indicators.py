from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.indicator import IndicatorCreate, IndicatorUpdate, IndicatorResponse
from app.services.indicator_service import IndicatorService


router = APIRouter()
service = IndicatorService()

# ✅ Tout utilisateur authentifié peut lire
@router.get("/", response_model=List[IndicatorResponse])
def list_indicators(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.list_indicators(db, skip=skip, limit=limit)

@router.get("/{indicator_id}", response_model=IndicatorResponse)
def get_indicator(
    indicator_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_indicator(db, indicator_id)

# ✅ CRUD réservé editeur/admin
EditorOrAdmin = require_role([UserRole.EDITEUR, UserRole.ADMIN])

@router.post("/", response_model=IndicatorResponse, status_code=status.HTTP_201_CREATED)
def create_indicator(
    data: IndicatorCreate,
    current_user: User = Depends(EditorOrAdmin),
    db: Session = Depends(get_db),
):
    return service.create_indicator(db, data, current_user)

@router.put("/{indicator_id}", response_model=IndicatorResponse)
def update_indicator(
    indicator_id: int,
    data: IndicatorUpdate,
    current_user: User = Depends(EditorOrAdmin),
    db: Session = Depends(get_db),
):
    return service.update_indicator(db, indicator_id, data)

@router.delete("/{indicator_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_indicator(
    indicator_id: int,
    current_user: User = Depends(EditorOrAdmin),
    db: Session = Depends(get_db),
):
    service.delete_indicator(db, indicator_id)
    return None
