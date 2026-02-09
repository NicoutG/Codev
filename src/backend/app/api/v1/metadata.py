from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.metadata_service import MetadataService

router = APIRouter()
service = MetadataService()

class TablesRequest(BaseModel):
    tables: List[str]

@router.get("/tables", response_model=List[str])
def get_tables():
    return service.list_tables()

@router.get("/tables/{table}/columns", response_model=List[str])
def get_columns(table: str):
    return service.list_columns(table)

@router.post("/columns", response_model=List[str])
def get_columns_for_tables(request: TablesRequest):
    return service.list_columns_for_tables(request.tables)
