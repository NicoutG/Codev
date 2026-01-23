from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from config import DATABASE_URL
from typing import Dict, Any, List, Optional
from JsonToSqlTranslator import JsonToSqlTranslator
import json

class CalculationService:
    def __init__(self, db: Session):
        self.db = db
        from config import DATABASE_URL
        from sqlalchemy import create_engine
        self.engine = create_engine(DATABASE_URL)
    
    def execute_sql(self, sql: str) -> List[Dict[str, Any]]:
        """Execute SQL query and return results as list of dicts"""
        try:
            result = self.db.execute(text(sql))
            columns = result.keys()
            rows = result.fetchall()
            
            # Convert to list of dicts
            results = []
            for row in rows:
                row_dict = {}
                for idx, col in enumerate(columns):
                    value = row[idx]
                    # Convert non-serializable types
                    if hasattr(value, 'isoformat'):  # datetime
                        value = value.isoformat()
                    row_dict[col] = value
                results.append(row_dict)
            
            return results
        except Exception as e:
            raise ValueError(f"Error executing SQL: {str(e)}")
    
    def calculate_indicator(self, spec_json: Dict[str, Any], 
                           periode: Optional[str] = None,
                           filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Calculate indicator from specification"""
        # Create translator
        translator = JsonToSqlTranslator(spec_json)
        
        # Generate base SQL
        sql = translator.to_sql()
        
        # Apply filters
        if filters:
            sql = self._apply_filters(sql, filters)
        
        # Apply period filter
        if periode:
            sql = self._apply_period_filter(sql, periode)
        
        # Execute
        results = self.execute_sql(sql)
        return results
    
    def _apply_filters(self, sql: str, filters: Dict[str, Any]) -> str:
        """Apply custom filters to SQL"""
        # This is a simplified version
        # In production, you'd use a proper SQL parser
        
        where_clauses = []
        
        if "annee" in filters:
            # Find WHERE clause and add year filter
            # This is simplified - in production use proper SQL parsing
            year = filters["annee"]
            if "WHERE" in sql.upper():
                sql = sql.replace("WHERE", f"WHERE annee = {year} AND", 1)
            else:
                # Add WHERE clause
                sql = sql.rstrip(";")
                sql += f" WHERE annee = {year};"
        
        if "semestre" in filters:
            semestre = filters["semestre"]
            if "WHERE" in sql.upper():
                sql = sql.replace("WHERE", f"WHERE semestre = '{semestre}' AND", 1)
            else:
                sql = sql.rstrip(";")
                sql += f" WHERE semestre = '{semestre}';"
        
        return sql
    
    def _apply_period_filter(self, sql: str, periode: str) -> str:
        """Apply period filter (6 months, 18 months)"""
        # This would filter based on date columns
        # Simplified version - in production, parse SQL properly
        
        if periode == "6_mois":
            # Filter for 6 months after graduation
            # This depends on your data structure
            pass
        elif periode == "18_mois":
            # Filter for 18 months after graduation
            pass
        
        return sql
    
    def get_available_tables(self) -> List[str]:
        """Get list of available data tables"""
        inspector = inspect(self.engine) if self.engine else None
        if not inspector:
            # Fallback: query information_schema
            result = self.db.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE 'data_%'
                ORDER BY table_name
            """))
            return [row[0] for row in result]
        
        tables = inspector.get_table_names()
        # Filter to only data tables
        return [t for t in tables if t.startswith('data_')]
    
    def get_table_columns(self, table_name: str) -> List[str]:
        """Get columns for a table"""
        inspector = inspect(self.engine) if self.engine else None
        if not inspector:
            # Fallback: query information_schema
            result = self.db.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = '{table_name}'
                ORDER BY ordinal_position
            """))
            return [row[0] for row in result]
        
        columns = inspector.get_columns(table_name)
        return [col['name'] for col in columns]
