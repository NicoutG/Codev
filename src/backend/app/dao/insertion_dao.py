# app/dao/insertion_dao.py

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.models.insertion import Insertion
from typing import Any, Dict, List

class InsertionDao:
    def _get_existing_columns(self, db: Session) -> set:
        """Récupère les colonnes qui existent réellement dans la table."""
        from sqlalchemy import text, inspect
        from app.core.database import engine
        
        # Utiliser information_schema pour obtenir les colonnes réelles
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'insertion'
        """))
        return {row[0] for row in result.fetchall()}
    
    def upsert(self, db: Session, payload: dict) -> Insertion:
        """
        UPSERT PostgreSQL sur la PK: code
        payload doit contenir au minimum {"code": "..."}
        Utilise une requête SQL brute pour éviter les erreurs de colonnes manquantes.
        """
        from sqlalchemy import text
        
        if not payload.get("code"):
            raise ValueError("Missing required primary key field: code")

        # Récupérer les colonnes existantes dans la table
        existing_cols = self._get_existing_columns(db)
        
        # Filtrer le payload pour ne garder que les colonnes existantes
        filtered_payload = {k: v for k, v in payload.items() if k in existing_cols}
        
        if not filtered_payload:
            raise ValueError("Aucune colonne valide dans le payload")

        # Construire la requête SQL brute pour UPSERT
        columns = list(filtered_payload.keys())
        placeholders = [f":{col}" for col in columns]
        
        # Valeurs pour INSERT
        values_clause = ", ".join(placeholders)
        columns_clause = ", ".join([f'"{col}"' for col in columns])
        
        # Valeurs pour UPDATE (toutes sauf la PK)
        update_cols = [col for col in columns if col != "code"]
        update_clause = ", ".join([f'"{col}" = EXCLUDED."{col}"' for col in update_cols])
        
        sql = f"""
            INSERT INTO insertion ({columns_clause})
            VALUES ({values_clause})
            ON CONFLICT (code) DO UPDATE SET {update_clause}
            RETURNING *
        """
        
        # Exécuter la requête
        result = db.execute(text(sql), filtered_payload)
        row = result.fetchone()
        db.commit()
        
        # Convertir en dictionnaire pour retourner
        if row:
            return Insertion(**dict(row._mapping))
        raise ValueError("Aucune ligne retournée après l'upsert")

    def delete(self, db: Session, code: str) -> bool:
        q = db.query(Insertion).filter(Insertion.code == code)
        deleted = q.delete(synchronize_session=False)
        db.commit()
        return deleted > 0

    def export_all(self, db: Session) -> List[Dict[str, Any]]:
        """
        Récupère toutes les lignes de la table insertion.
        Utilise une requête SQL brute pour éviter les erreurs de colonnes manquantes.
        """
        from sqlalchemy import text
        
        # Récupérer uniquement les colonnes qui existent réellement dans la table
        result = db.execute(text("SELECT * FROM insertion"))
        columns = list(result.keys())
        rows = result.fetchall()
        
        # Convertir les Row en dictionnaires
        return [dict(zip(columns, row)) for row in rows]

