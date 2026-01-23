import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import inspect, create_engine, text
from models import Import
from config import DATABASE_URL
from typing import Dict, Any, List, Optional
from datetime import datetime
import os

class ImportService:
    def __init__(self, db: Session):
        self.db = db
        self.engine = create_engine(DATABASE_URL)
    
    def parse_excel(self, file_path: str) -> Dict[str, Any]:
        """Parse Excel file and return metadata"""
        try:
            # Read Excel file
            df = pd.read_excel(file_path, sheet_name=0)
            
            # Get metadata
            metadata = {
                "columns": df.columns.tolist(),
                "row_count": len(df),
                "column_count": len(df.columns),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "sample_data": df.head(5).to_dict(orient="records")
            }
            
            return metadata
        except Exception as e:
            raise ValueError(f"Error parsing Excel file: {str(e)}")
    
    def detect_data_type(self, filename: str, columns: List[str]) -> str:
        """Detect data type from filename and columns"""
        filename_lower = filename.lower()
        
        if "insertion" in filename_lower or "emploi" in filename_lower:
            return "insertion"
        elif "mobilite" in filename_lower or "international" in filename_lower:
            return "mobilite"
        elif "reussite" in filename_lower or "suivi" in filename_lower:
            return "reussite"
        
        # Try to detect from columns
        cols_lower = [c.lower() for c in columns]
        if any("diplome" in c or "emploi" in c for c in cols_lower):
            return "insertion"
        elif any("mobilite" in c or "pays" in c for c in cols_lower):
            return "mobilite"
        elif any("reussite" in c or "note" in c for c in cols_lower):
            return "reussite"
        
        return "insertion"  # Default
    
    def import_to_database(self, file_path: str, type_donnee: str, 
                          user_id: int, table_name: Optional[str] = None) -> Dict[str, Any]:
        """Import Excel data to database"""
        try:
            # Read Excel
            df = pd.read_excel(file_path, sheet_name=0)
            
            # Determine table name
            if not table_name:
                table_name = f"data_{type_donnee}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Clean column names for SQL
            df.columns = [self._clean_column_name(col) for col in df.columns]
            
            # Note: imported_at and import_id will be added by the database table structure
            
            # Create import record
            import_record = Import(
                user_id=user_id,
                fichier_nom=os.path.basename(file_path),
                type_donnee=type_donnee,
                statut="processing",
                metadata_json={
                    "columns": df.columns.tolist(),
                    "row_count": len(df),
                    "table_name": table_name
                }
            )
            self.db.add(import_record)
            self.db.commit()
            self.db.refresh(import_record)
            
            # Create table if it doesn't exist
            self._create_table_from_dataframe(df, table_name)
            
            # Insert data
            df.to_sql(table_name, self.engine, if_exists='append', index=False)
            
            # Update import record
            import_record.statut = "success"
            import_record.metadata_json["imported_rows"] = len(df)
            self.db.commit()
            
            return {
                "success": True,
                "import_id": import_record.id,
                "table_name": table_name,
                "rows_imported": len(df),
                "columns": df.columns.tolist()
            }
        except Exception as e:
            # Update import record with error
            if 'import_record' in locals():
                import_record.statut = "error"
                import_record.error_message = str(e)
                self.db.commit()
            raise ValueError(f"Error importing data: {str(e)}")
    
    def _clean_column_name(self, name: str) -> str:
        """Clean column name for SQL compatibility"""
        # Remove special characters, replace spaces with underscores
        cleaned = "".join(c if c.isalnum() or c == "_" else "_" for c in str(name))
        # Remove leading numbers
        while cleaned and cleaned[0].isdigit():
            cleaned = "_" + cleaned[1:]
        return cleaned.lower()[:63]  # PostgreSQL limit
    
    def _create_table_from_dataframe(self, df: pd.DataFrame, table_name: str):
        """Create table from dataframe structure"""
        # Check if table exists
        inspector = inspect(self.engine)
        if table_name in inspector.get_table_names():
            return  # Table already exists
        
        # Create table with appropriate types
        with self.engine.connect() as conn:
            columns = []
            for col, dtype in df.dtypes.items():
                sql_type = self._pandas_to_sql_type(dtype)
                col_clean = self._clean_column_name(col)
                columns.append(f'"{col_clean}" {sql_type}')
            
            # Add metadata columns
            columns.append('imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
            
            create_sql = f'''
            CREATE TABLE "{table_name}" (
                id SERIAL PRIMARY KEY,
                {", ".join(columns)}
            )
            '''
            conn.execute(text(create_sql))
            conn.commit()
    
    def _pandas_to_sql_type(self, dtype) -> str:
        """Convert pandas dtype to SQL type"""
        if pd.api.types.is_integer_dtype(dtype):
            return "INTEGER"
        elif pd.api.types.is_float_dtype(dtype):
            return "REAL"
        elif pd.api.types.is_bool_dtype(dtype):
            return "BOOLEAN"
        elif pd.api.types.is_datetime64_any_dtype(dtype):
            return "TIMESTAMP"
        else:
            return "TEXT"
    
    def get_import_history(self, user_id: Optional[int] = None):
        """Get import history"""
        query = self.db.query(Import)
        if user_id:
            query = query.filter(Import.user_id == user_id)
        return query.order_by(Import.date_import.desc()).all()
    
    def get_import_by_id(self, import_id: int):
        """Get import by ID"""
        return self.db.query(Import).filter(Import.id == import_id).first()
