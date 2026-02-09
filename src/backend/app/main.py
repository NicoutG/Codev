from fastapi import FastAPI
from app.api.v1 import metadata

app = FastAPI()

# Inclure les routers
app.include_router(metadata.router, prefix="/api/v1/metadata", tags=["metadata"])

@app.get("/")
def read_root():
    return {"message": "API Polytech Lyon - Suivi Statistique"}
