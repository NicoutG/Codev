from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from typing import List
from services.calculation_service import CalculationService

class MetadataDao:
    def __init__(self, db: Session):
        self.db = db
        self.calc_service = CalculationService(db)
    
    def get_tables(self) -> List[str]:
        """Get all data tables dynamically from database"""
        try:
            return self.calc_service.get_available_tables()
        except Exception:
            # Fallback to hardcoded if database not available
            return [
                "etudiant",
                "diplome",
                "age",
                "obtenu"
            ]
    
    def get_columns(self, table: str) -> List[str]:
        """Get columns for a table dynamically"""
        try:
            return self.calc_service.get_table_columns(table)
        except Exception:
            # Fallback to hardcoded
            columns = {
                "etudiant": ["id", "age", "sexe"],
                "diplome": ["id", "obtenu", "annee"],
                "age": ["value"],
                "obtenu": ["value"]
            }
            return columns.get(table, [])
    
    def get_columns_for_tables(self, tables: List[str]) -> List[str]:
        """Get all columns for multiple tables"""
        result = set()
        for table in tables:
            result.update(self.get_columns(table))
        return list(result)
