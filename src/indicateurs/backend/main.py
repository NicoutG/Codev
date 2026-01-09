from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from services.metadata_service import MetadataService

app = FastAPI()
service = MetadataService()

class TablesRequest(BaseModel):
    tables: List[str]

@app.get("/api/metadata/tables", response_model=List[str])
def get_tables():
    return service.list_tables()

@app.get("/api/metadata/tables/{table}/columns", response_model=List[str])
def get_columns(table: str):
    return service.list_columns(table)

@app.post("/api/metadata/columns", response_model=List[str])
def get_columns_for_tables(request: TablesRequest):
    return service.list_columns_for_tables(request.tables)
