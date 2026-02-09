from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, List, Any
from app.dao.indicator_dao import IndicatorDao
from app.utils.sql_translator import JsonToSqlTranslator


class IndicatorExecutionService:
    def __init__(self):
        self.dao = IndicatorDao()

    def execute_indicator(self, db: Session, indicator_id: int) -> Dict[str, Any]:
        """
        Exécute un indicateur et retourne les résultats.
        
        Args:
            db: Session SQLAlchemy
            indicator_id: ID de l'indicateur à exécuter
        
        Returns:
            Dict avec:
            - sql: La requête SQL générée
            - columns: Liste des noms de colonnes
            - rows: Liste des lignes de résultats
            - row_count: Nombre de lignes retournées
        """
        # Récupérer l'indicateur
        indicator = self.dao.get_by_id(db, indicator_id)
        if not indicator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Indicateur introuvable"
            )

        # Vérifier que l'indicateur a une structure valide
        if not indicator.indicator or not isinstance(indicator.indicator, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Structure d'indicateur invalide"
            )

        # Convertir l'indicator JSON en SQL
        try:
            translator = JsonToSqlTranslator(indicator.indicator)
            sql_query = translator.to_sql()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erreur lors de la génération SQL: {str(e)}"
            )

        # Exécuter la requête SQL
        try:
            result = db.execute(text(sql_query))
            columns = list(result.keys())
            rows = result.fetchall()
            
            # Convertir les Row en dictionnaires
            rows_data = [dict(zip(columns, row)) for row in rows]
            
            return {
                "sql": sql_query,
                "columns": columns,
                "rows": rows_data,
                "row_count": len(rows_data),
                "indicator_id": indicator_id,
                "indicator_title": indicator.title
            }
        except Exception as e:
            # Rollback en cas d'erreur pour éviter les transactions abortées
            db.rollback()
            error_msg = str(e)
            # Extraire le message d'erreur PostgreSQL si disponible
            if hasattr(e, 'orig') and hasattr(e.orig, 'pgcode'):
                error_msg = f"Erreur SQL: {error_msg}"
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erreur lors de l'exécution SQL: {error_msg}"
            )
