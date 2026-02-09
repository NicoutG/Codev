"""
Script d'initialisation de la base de données
- Crée les tables
- Seed users de test
- Seed predefined indicators (si table vide)
"""

from dotenv import load_dotenv

load_dotenv()

from sqlalchemy.exc import OperationalError

from app.core.database import SessionLocal, engine, Base

# ✅ Importer les modèles pour les enregistrer dans Base.metadata
from app.models.user import User  # noqa: F401
from app.models.indicator import Indicator  # noqa: F401
from app.models.report import Report  # noqa: F401
from app.models.insertion import Insertion  # noqa: F401
from app.models.etudiants import Etudiants  # noqa: F401
from app.models.mobilite import Mobilite  # noqa: F401

from app.seed import seed_users, seed_predefined_indicators


def init_db():
    import time

    max_retries = 30
    retry_count = 0

    while retry_count < max_retries:
        try:
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError:
            retry_count += 1
            if retry_count >= max_retries:
                raise
            print(f"Attente de la base de données... ({retry_count}/{max_retries})")
            time.sleep(2)

    db = SessionLocal()
    try:
        seed_users(db)
        seed_predefined_indicators(db)

        print("✅ Database initialization complete!")

    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de l'initialisation: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
