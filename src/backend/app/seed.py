# app/seed.py

from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.indicator import Indicator


def seed_users(db: Session) -> None:
    """
    Crée (ou recrée) les utilisateurs de test.
    Stratégie: si des users existent -> delete pour repartir clean (comme tu faisais).
    """
    existing_users = db.query(User).count()
    if existing_users > 0:
        print("Les utilisateurs existent déjà. Suppression des anciens utilisateurs...")
        db.query(User).delete()
        db.commit()

    users_data: List[Dict[str, Any]] = [
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

    for u in users_data:
        db.add(
            User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"],
                is_active=True,
            )
        )

    db.commit()
    print("✓ Default users created (consultant/editeur/admin)")


def seed_predefined_indicators(db: Session) -> None:
    """
    Crée les predefined indicators si la table est vide.
    Stratégie: idempotente -> si des indicateurs existent déjà, on ne touche pas.
    """
    existing = db.query(Indicator).count()
    if existing > 0:
        print("✓ Predefined indicators already exist (skip)")
        return

    admin_user = db.query(User).filter(User.username == "admin").first()

    predefined = [
        {
            "title": "Taux de réussite",
            "description": "Pourcentage d'étudiants validant l'année.",
            "indicator": {
                "type": "ratio",
                "numerator": "validated_students",
                "denominator": "total_students",
                "format": "percent",
            },
        },
        {
            "title": "Moyenne générale",
            "description": "Moyenne des notes sur l'ensemble des UE.",
            "indicator": {"type": "aggregate", "field": "grade", "op": "avg"},
        },
        {
            "title": "Effectif total",
            "description": "Nombre total d'étudiants.",
            "indicator": {"type": "count", "field": "id_polytech"},
        },
        {
            "title": "Répartition par sexe",
            "description": "Nombre d'étudiants par sexe.",
            "indicator": {"type": "group_count", "group_by": "sexe"},
        },
        {
            "title": "Répartition par âge",
            "description": "Nombre d'étudiants par âge.",
            "indicator": {"type": "group_count", "group_by": "age"},
        },
        {
            "title": "Boursiers",
            "description": "Nombre d'étudiants boursiers.",
            "indicator": {"type": "filter_count", "field": "boursier", "equals": "Oui"},
        },
        {
            "title": "Mobilité totale",
            "description": "Nombre d'étudiants ayant eu une mobilité (total).",
            "indicator": {"type": "aggregate", "field": "total", "op": "sum"},
        },
        {
            "title": "Stages cumulés",
            "description": "Somme des mois de stage.",
            "indicator": {"type": "aggregate", "field": "nb_mois_stage", "op": "sum"},
        },
        {
            "title": "Études cumulées",
            "description": "Somme des mois d'étude.",
            "indicator": {"type": "aggregate", "field": "nb_mois_etude", "op": "sum"},
        },
    ]

    for item in predefined:
        db.add(
            Indicator(
                title=item["title"],
                description=item["description"],
                indicator=item["indicator"],
                created_by=admin_user.id if admin_user else None,
            )
        )

    db.commit()
    print(f"✓ Created {len(predefined)} predefined indicators")
