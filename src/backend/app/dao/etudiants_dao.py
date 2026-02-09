# app/dao/etudiants_dao.py

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.models.etudiants import Etudiants
from typing import Any, Dict, List

class EtudiantsDao:
    def upsert(self, db: Session, payload: dict) -> Etudiants:
        """
        UPSERT PostgreSQL sur la PK: id_polytech
        payload doit contenir au minimum {"id_polytech": "..."}
        """
        if not payload.get("id_polytech"):
            raise ValueError("Missing required primary key field: id_polytech")

        stmt = insert(Etudiants).values(**payload)

        update_cols = {c.name: stmt.excluded[c.name] for c in Etudiants.__table__.columns if c.name != "id_polytech"}

        stmt = stmt.on_conflict_do_update(
            index_elements=["id_polytech"],
            set_=update_cols
        ).returning(Etudiants)

        row = db.execute(stmt).scalar_one()
        db.commit()
        return row

    def delete(self, db: Session, id_polytech: str) -> bool:
        q = db.query(Etudiants).filter(Etudiants.id_polytech == id_polytech)
        deleted = q.delete(synchronize_session=False)
        db.commit()
        return deleted > 0

    def export_all(self, db: Session) -> List[Dict[str, Any]]:
        """
        Récupère toutes les lignes de la table etudiants.
        Utilise une requête SQL brute pour éviter les erreurs de colonnes manquantes.
        """
        from sqlalchemy import text
        
        # Récupérer uniquement les colonnes qui existent réellement dans la table
        result = db.execute(text("SELECT * FROM etudiants"))
        columns = list(result.keys())
        rows = result.fetchall()
        
        # Convertir les Row en dictionnaires
        return [dict(zip(columns, row)) for row in rows]
