from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Base de données
    # Format: postgresql://[user]:[password]@[host]:[port]/[database]
    # Exemple sans mot de passe: postgresql://postgres@localhost:5432/polytech_indicateurs
    # Exemple avec mot de passe: postgresql://postgres:password@localhost:5432/polytech_indicateurs
    DATABASE_URL: str = "postgresql://postgres@localhost:5432/polytech_indicateurs"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production-minimum-32-characters"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS (peut être une liste ou une chaîne séparée par des virgules)
    CORS_ORIGINS: str | list[str] = "http://localhost:5173,http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
