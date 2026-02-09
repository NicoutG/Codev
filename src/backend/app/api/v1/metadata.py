from fastapi import APIRouter, Depends
from typing import List

from app.api.deps import get_current_user
from app.models.user import User
from app.dao.metadata_dao import MetadataDao

router = APIRouter()
dao = MetadataDao()


@router.get("/tables", response_model=List[str])
def get_tables(current_user: User = Depends(get_current_user)):
    return dao.get_tables()


@router.get("/tables/{table}/columns", response_model=List[str])
def get_columns(table: str, current_user: User = Depends(get_current_user)):
    return dao.get_columns(table)


@router.post("/columns", response_model=List[str])
def get_columns_for_tables(tables: List[str], current_user: User = Depends(get_current_user)):
    return dao.get_columns_for_tables(tables)