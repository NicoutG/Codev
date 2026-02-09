"""
Script d'initialisation de la base de données
Crée les 3 comptes de test : consultant, éditeur, admin
+ Crée la table indicators (et optionnellement seed d'indicateurs)
"""
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

from app.core.database import SessionLocal, engine
from app.models.user import Base, User, UserRole
from app.core.security import get_password_hash
from app.models.indicator import Indicator  # noqa: F401

def init_db():
    import time
    from sqlalchemy.exc import OperationalError

    # Attendre que la base de données soit prête (pour Docker)
    max_retries = 30
    retry_count = 0
    while retry_count < max_retries:
        try:
            # Créer les tables
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
        # Vérifier si les utilisateurs existent déjà
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("Les utilisateurs existent déjà. Suppression des anciens utilisateurs...")
            db.query(User).delete()
            db.commit()

        # (Optionnel mais pratique) on remet aussi à zéro les indicateurs
        existing_indicators = db.query(Indicator).count()
        if existing_indicators > 0:
            print("Des indicateurs existent déjà. Suppression des anciens indicateurs...")
            db.query(Indicator).delete()
            db.commit()

        # Créer les 3 utilisateurs de test
        users_data = [
            {
                "username": "consultant",
                "email": "consultant@polytech-lyon.fr",
                "password": "consultant123",
                "role": UserRole.CONSULTANT,
            },
            {
                "username": "editeur",
                "email": "editeur@polytech-lyon.fr",
                "password": "editeur123",
                "role": UserRole.EDITEUR,
            },
            {
                "username": "admin",
                "email": "admin@polytech-lyon.fr",
                "password": "admin123",
                "role": UserRole.ADMIN,
            },
        ]

        created_users: list[User] = []
        for user_data in users_data:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_active=True,
            )
            db.add(user)
            created_users.append(user)

        db.commit()

        # Récupérer l'admin pour created_by (après commit)
        admin_user = db.query(User).filter(User.username == "admin").first()

        # Seed indicateurs (optionnel)
        predefined_indicators = [
            {
                "title": "Taux de réussite",
                "description": "Pourcentage d'étudiants validant l'année.",
                "indicator": {
                    "type": "ratio",
                    "numerator": "validated_students",
                    "denominator": "total_students",
                    "format": "percent"
                },
            },
            {
                "title": "Moyenne générale",
                "description": "Moyenne des notes sur l'ensemble des UE.",
                "indicator": {
                    "type": "aggregate",
                    "field": "grade",
                    "op": "avg"
                },
            },
        ]

        for item in predefined_indicators:
            db.add(
                Indicator(
                    title=item["title"],
                    description=item["description"],
                    indicator=item["indicator"],
                    created_by=admin_user.id if admin_user else None,
                )
            )

        db.commit()

        print("✅ Base de données initialisée avec succès!")
        print("\nComptes créés:")
        print("  - consultant / consultant123 (Consultant)")
        print("  - editeur / editeur123 (Éditeur)")
        print("  - admin / admin123 (Admin)")
        print("\nIndicateurs:")
        print(f"  - {len(predefined_indicators)} indicateurs créés")

    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de l'initialisation: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
