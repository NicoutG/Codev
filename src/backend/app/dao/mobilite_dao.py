# app/dao/mobilite_dao.py

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.models.mobilite import Mobilite
from typing import Any, Dict, List

class MobiliteDao:
    def upsert(self, db: Session, payload: dict) -> Mobilite:
        """
        UPSERT PostgreSQL sur la PK: id_polytech_inter
        payload doit contenir au minimum {"id_polytech_inter": "..."}
        """
        if not payload.get("id_polytech_inter"):
            raise ValueError("Missing required primary key field: id_polytech_inter")

        stmt = insert(Mobilite).values(**payload)

        update_cols = {c.name: stmt.excluded[c.name] for c in Mobilite.__table__.columns if c.name != "id_polytech_inter"}

        stmt = stmt.on_conflict_do_update(
            index_elements=["id_polytech_inter"],
            set_=update_cols
        ).returning(Mobilite)

        row = db.execute(stmt).scalar_one()
        db.commit()
        return row

    def delete(self, db: Session, id_polytech_inter: str) -> bool:
        q = db.query(Mobilite).filter(Mobilite.id_polytech_inter == id_polytech_inter)
        deleted = q.delete(synchronize_session=False)
        db.commit()
        return deleted > 0
    
    def export_all(self, db: Session) -> List[Dict[str, Any]]:
        """
        Récupère toutes les lignes de la table mobilite.
        Utilise une requête SQL brute pour éviter les erreurs de colonnes manquantes.
        """
        from sqlalchemy import text
        
        # Récupérer uniquement les colonnes qui existent réellement dans la table
        result = db.execute(text("SELECT * FROM mobilite"))
        columns = list(result.keys())
        rows = result.fetchall()
        
        # Convertir les Row en dictionnaires
        return [dict(zip(columns, row)) for row in rows]

