from fastapi import FastAPI
from services.metadata_service import MetadataService

app = FastAPI()
service = MetadataService()

@app.get("/api/metadata/tables", response_model=list[str])
def get_tables():
    return service.list_tables()

@app.get("/api/metadata/tables/{table}/columns", response_model=list[str])
def get_columns(table: str):
    return service.list_columns(table)

@app.post("/api/metadata/columns", response_model=list[str])
def get_columns_for_tables(tables: list[str]):
    return service.list_columns_for_tables(tables)
