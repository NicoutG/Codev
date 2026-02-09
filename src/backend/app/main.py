from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import metadata, auth, users, indicators, imports, exports, data, reports
from app.core.config import settings


app = FastAPI(title="API Polytech Lyon - Suivi Statistique")

# CORS
cors_origins = settings.CORS_ORIGINS
if isinstance(cors_origins, str):
    cors_origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentification"])
app.include_router(users.router, prefix="/api/v1/users", tags=["utilisateurs"])
app.include_router(metadata.router, prefix="/api/v1/metadata", tags=["métadonnées"])
app.include_router(indicators.router, prefix="/api/v1/indicators", tags=["indicateurs"])
app.include_router(imports.router, prefix="/api/v1/imports", tags=["imports"])
app.include_router(exports.router, prefix="/api/v1/exports", tags=["exports"])
app.include_router(data.router, prefix="/api/v1/data", tags=["données"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["rapports"])

@app.get("/")
def read_root():
    return {"message": "API Polytech Lyon - Suivi Statistique"}
