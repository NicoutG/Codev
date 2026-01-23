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
        # Extract year from filters if present
        year = filters.get("annee") if filters else None
        
        # Create translator
        translator = JsonToSqlTranslator(spec_json)
        
        # Generate base SQL
        sql = translator.to_sql()
        
        # Resolve logical table names to actual table names (with period and year filters)
        sql = self._resolve_table_names(sql, spec_json, periode, year)
        
        # Extract the actual table name from SQL
        import re
        table_match = re.search(r'FROM\s+"([^"]+)"', sql, re.IGNORECASE)
        actual_table = table_match.group(1) if table_match else None
        
        # Replace logical column names with actual column names from the table
        if actual_table:
            sql = self._resolve_column_names(sql, actual_table)
        
        # Apply filters (year, etc.) - but skip year if we already filtered by table selection
        if filters:
            # Don't apply year filter if we already selected table by year
            filters_to_apply = {k: v for k, v in filters.items() if k != "annee" or not year}
            if filters_to_apply:
                sql = self._apply_filters(sql, filters_to_apply, actual_table)
        
        # Execute
        results = self.execute_sql(sql)
        return results
    
    def _resolve_table_names(self, sql: str, spec_json: Dict[str, Any], periode: Optional[str] = None, year: Optional[int] = None) -> str:
        """Resolve logical table names (e.g., 'insertion_diplomes') to actual table names (e.g., 'data_insertion_*')"""
        # Get logical table names from spec
        logical_tables = spec_json.get("sujet", {}).get("tables", [])
        
        if not logical_tables:
            return sql
        
        # Mapping of logical names to data types
        table_type_mapping = {
            "insertion_diplomes": ["insertion", "insertion_2020_6m", "insertion_2020_18m", "insertion_2021_6m", "insertion_2021_18m", "insertion_2022_6m"],
            "mobilite_diplomes": "mobilite",
            "reussite_etudiants": "reussite"
        }
        
        # Get actual tables from database
        from models import Import
        imports = self.db.query(Import).filter(Import.statut == "success").all()
        
        # Build mapping: logical_name -> actual_table_name
        table_mapping = {}
        missing_tables = []
        
        for logical_name in logical_tables:
            data_types = table_type_mapping.get(logical_name)
            if not data_types:
                # If no mapping, try to find by name pattern
                data_types = logical_name.split("_")[0] if "_" in logical_name else logical_name
            
            # Handle both single string and list of strings
            if isinstance(data_types, str):
                data_types = [data_types]
            
            # Find the most recent table of any of these types
            # Handle both exact matches and prefix matches (e.g., "insertion" matches "insertion_2020_6m")
            matching_imports = []
            for imp in imports:
                # Check exact match
                if imp.type_donnee in data_types:
                    matching_imports.append(imp)
                else:
                    # Check if any data_type is a prefix of the import type
                    for dt in data_types:
                        if imp.type_donnee.startswith(dt + "_") or imp.type_donnee == dt:
                            matching_imports.append(imp)
                            break
            
            # Filter by period if specified
            if periode and matching_imports:
                period_suffix = "_6m" if periode == "6_mois" else "_18m" if periode == "18_mois" else None
                if period_suffix:
                    # Filter imports to only those matching the period
                    matching_imports = [imp for imp in matching_imports if period_suffix in imp.type_donnee]
            
            # Filter by year if specified
            if year and matching_imports:
                # Filter imports to only those matching the year (e.g., insertion_2022_6m)
                year_str = str(year)
                matching_imports = [imp for imp in matching_imports if year_str in imp.type_donnee]
            
            if matching_imports:
                # Sort by date, get most recent
                most_recent = max(matching_imports, key=lambda x: x.date_import)
                actual_table = most_recent.metadata_json.get("table_name")
                if actual_table:
                    table_mapping[logical_name] = actual_table
            else:
                missing_tables.append((logical_name, str(data_types)))
        
        # If tables are missing, raise a helpful error
        if missing_tables:
            available_types = set(imp.type_donnee for imp in imports)
            missing_info = ", ".join([f"{logical} (type: {data_type})" for logical, data_type in missing_tables])
            available_info = ", ".join(available_types) if available_types else "aucune"
            raise ValueError(
                f"Tables manquantes pour les indicateurs: {missing_info}. "
                f"Types de données disponibles: {available_info}. "
                f"Veuillez importer les données nécessaires via la page d'import."
            )
        
        # Replace logical names with actual names in SQL
        for logical_name, actual_name in table_mapping.items():
            # Replace table name in SQL (handle quoted and unquoted)
            sql = sql.replace(f"FROM {logical_name}", f"FROM \"{actual_name}\"")
            sql = sql.replace(f"FROM \"{logical_name}\"", f"FROM \"{actual_name}\"")
            sql = sql.replace(f"JOIN {logical_name}", f"JOIN \"{actual_name}\"")
            sql = sql.replace(f"JOIN \"{logical_name}\"", f"JOIN \"{actual_name}\"")
            # Also replace in subqueries
            sql = sql.replace(f"FROM {logical_name} ", f"FROM \"{actual_name}\" ")
            sql = sql.replace(f"FROM \"{logical_name}\" ", f"FROM \"{actual_name}\" ")
        
        return sql
    
    def _resolve_column_names(self, sql: str, table_name: str) -> str:
        """Resolve logical column names to actual column names in the table"""
        import re
        
        # Get actual columns from the table
        inspector = inspect(self.engine)
        try:
            columns = [col['name'] for col in inspector.get_columns(table_name)]
        except Exception:
            # If table doesn't exist or error, return sql as-is
            return sql
        
        # Define column patterns that need to be resolved
        # Each entry: (regex_pattern, search_prefix, priority_keywords)
        # priority_keywords helps choose the right column if multiple matches
        column_patterns = [
            (r"quelle_est_votre_situation_au_1er_mars_\d{4}___", "quelle_est_votre_situation_au_1er_mars_", []),
            (r"quel_type_d_études_poursuivez_vous___", "quel_type_d_études_poursuivez_vous_", []),
            (r"combien_de_temps_avez_vous_mis_pour_trouver_\w+", "combien_de_temps_avez_vous_mis_pour_trouver_", ["1er", "votre"]),
        ]
        
        # For each pattern, find and replace
        for pattern_regex, search_prefix, priority_keywords in column_patterns:
            # Find all occurrences of this pattern in SQL
            matches = re.findall(pattern_regex, sql)
            if matches:
                # Find actual columns that match the prefix
                matching_cols = [c for c in columns if c.startswith(search_prefix)]
                
                if matching_cols:
                    # If priority keywords, prefer columns with those
                    if priority_keywords:
                        priority_cols = [c for c in matching_cols if any(kw in c for kw in priority_keywords)]
                        actual_col = priority_cols[0] if priority_cols else matching_cols[0]
                    else:
                        actual_col = matching_cols[0]
                    
                    # Replace all variations with the actual column
                    for match in set(matches):  # Use set to avoid duplicates
                        sql = sql.replace(match, actual_col)
        
        return sql
    
    def _apply_filters(self, sql: str, filters: Dict[str, Any], table_name: Optional[str] = None) -> str:
        """Apply custom filters to SQL"""
        import re
        
        if "annee" in filters and table_name:
            year = filters["annee"]
            
            # Check which column exists: 'annee' or 'promotion'
            columns = self.get_table_columns(table_name)
            year_col = None
            
            if "annee" in columns:
                year_col = "annee"
            elif "promotion" in columns:
                year_col = "promotion"
            
            if year_col:
                # Build WHERE clause
                where_clause = f"{year_col} = {year}"
                
                if "WHERE" in sql.upper():
                    # Add to existing WHERE clause
                    sql = re.sub(r"WHERE\s+", f"WHERE {where_clause} AND ", sql, flags=re.IGNORECASE)
                else:
                    # Add new WHERE clause
                    sql = sql.rstrip(";")
                    sql += f" WHERE {where_clause};"
        
        if "semestre" in filters and table_name:
            semestre = filters["semestre"]
            columns = self.get_table_columns(table_name)
            
            if "semestre" in columns:
                where_clause = f"semestre = '{semestre}'"
                
                if "WHERE" in sql.upper():
                    sql = re.sub(r"WHERE\s+", f"WHERE {where_clause} AND ", sql, flags=re.IGNORECASE)
                else:
                    sql = sql.rstrip(";")
                    sql += f" WHERE {where_clause};"
        
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
