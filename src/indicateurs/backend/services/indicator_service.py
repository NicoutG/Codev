from sqlalchemy.orm import Session
from dao.indicator_dao import IndicatorDao
from JsonToSqlTranslator import JsonToSqlTranslator
from typing import Dict, Any, Optional, List
import json

class IndicatorService:
    def __init__(self, db: Session):
        self.dao = IndicatorDao(db)
        self.db = db
    
    def list_indicators(self):
        """List all indicators"""
        return self.dao.get_all()
    
    def get_indicator(self, indicator_id: int):
        """Get indicator by ID"""
        return self.dao.get_by_id(indicator_id)
    
    def create_indicator(self, title: str, description: str, spec_json: Dict[str, Any], 
                        created_by_id: int, is_predefined: bool = False):
        """Create a new indicator"""
        return self.dao.create(title, description, spec_json, created_by_id, is_predefined)
    
    def update_indicator(self, indicator_id: int, **kwargs):
        """Update an indicator"""
        return self.dao.update(indicator_id, **kwargs)
    
    def delete_indicator(self, indicator_id: int):
        """Delete an indicator"""
        return self.dao.delete(indicator_id)
    
    def generate_sql(self, indicator_id: int) -> str:
        """Generate SQL from indicator specification"""
        indicator = self.dao.get_by_id(indicator_id)
        if not indicator:
            raise ValueError("Indicator not found")
        
        translator = JsonToSqlTranslator(indicator.spec_json)
        return translator.to_sql()
    
    def calculate_indicator(self, indicator_id: int, periode: Optional[str] = None,
                           filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Calculate indicator and return results"""
        indicator = self.dao.get_by_id(indicator_id)
        if not indicator:
            raise ValueError("Indicator not found")
        
        # Generate SQL
        translator = JsonToSqlTranslator(indicator.spec_json)
        sql = translator.to_sql()
        
        # Apply temporal filters if needed
        if periode or filters:
            sql = self._apply_filters(sql, periode, filters)
        
        # Execute SQL (we'll need to implement this with the database connection)
        # For now, return the SQL - we'll execute it in the API endpoint
        return {
            "sql": sql,
            "indicator_id": indicator_id,
            "periode": periode,
            "filters": filters
        }
    
    def _apply_filters(self, sql: str, periode: Optional[str], filters: Optional[Dict[str, Any]]) -> str:
        """Apply temporal and other filters to SQL"""
        # This is a simplified version - in production, you'd parse and modify the SQL properly
        if filters:
            # Add WHERE conditions for year, semester, etc.
            if "annee" in filters:
                # Modify SQL to add year filter
                pass
            if "semestre" in filters:
                # Modify SQL to add semester filter
                pass
        
        if periode:
            # Apply period-specific logic (6 months, 18 months)
            # This would modify the WHERE clause based on the period
            pass
        
        return sql
    
    def get_predefined_indicators(self):
        """Get all predefined indicators"""
        return self.dao.get_predefined()
    
    def get_results(self, indicator_id: int):
        """Get calculation results for an indicator"""
        return self.dao.get_results(indicator_id)
