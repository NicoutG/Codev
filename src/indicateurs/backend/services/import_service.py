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
            if sheet_name:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
            else:
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
                          user_id: int, table_name: Optional[str] = None, sheet_name: Optional[str] = None) -> Dict[str, Any]:
        """Import Excel data to database"""
        try:
            # Read Excel
            if sheet_name:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
            else:
                df = pd.read_excel(file_path, sheet_name=0)
            
            # Remove duplicate columns from DataFrame (pandas can have duplicate column names)
            # Keep first occurrence of each column name
            df = df.loc[:, ~df.columns.duplicated(keep='first')]
            
            # Determine table name
            if not table_name:
                table_name = f"data_{type_donnee}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Clean column names and ensure uniqueness BEFORE creating table
            original_columns = df.columns.tolist()
            cleaned_columns = self._clean_column_names_unique(original_columns)
            df.columns = cleaned_columns
            
            # Final check: remove any remaining duplicates after cleaning
            df = df.loc[:, ~df.columns.duplicated(keep='first')]
            
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
            
            # Create table if it doesn't exist (columns are already cleaned)
            self._create_table_from_dataframe(df, table_name)
            
            # Insert data (columns are already cleaned)
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
        # Ensure it starts with a letter or underscore
        if not cleaned or (cleaned[0].isdigit() if cleaned else True):
            cleaned = "_" + cleaned
        # Truncate to 55 chars to leave room for suffix (e.g., "_123")
        return cleaned.lower()[:55]  # Leave room for index suffix
    
    def _clean_column_names_unique(self, columns: List[str]) -> List[str]:
        """Clean column names and ensure uniqueness"""
        cleaned = []
        seen = {}  # Track base names and their indices
        
        # First pass: clean all names and track duplicates
        base_names = []
        for idx, col in enumerate(columns):
            base_name = self._clean_column_name(col)  # Already truncated to 55
            base_names.append((idx, base_name))
            if base_name not in seen:
                seen[base_name] = []
            seen[base_name].append(idx)
        
        # Second pass: assign unique names
        for idx, base_name in base_names:
            # If this base name appears multiple times, always use index suffix
            if len(seen[base_name]) > 1:
                # Always use index for duplicates to ensure uniqueness
                # base_name is max 55 chars, suffix "_123" is max 4 chars = 59 total < 63
                suffix = f"_{idx}"
                final_name = base_name + suffix
            else:
                # Single occurrence - use base name (max 55 chars, safe)
                final_name = base_name
            
            # Final safety check: ensure absolute uniqueness (shouldn't happen but safety)
            original_final = final_name
            counter = 0
            while final_name in cleaned:
                counter += 1
                # Use index as ultimate guarantee
                suffix = f"_{idx}"
                final_name = base_name + suffix
                if len(final_name) > 63:
                    # If still too long, truncate base more
                    max_base = 63 - len(suffix)
                    final_name = base_name[:max_base] + suffix
            
            cleaned.append(final_name)
        
        return cleaned
    
    def _create_table_from_dataframe(self, df: pd.DataFrame, table_name: str):
        """Create table from dataframe structure"""
        # Check if table exists
        inspector = inspect(self.engine)
        if table_name in inspector.get_table_names():
            return  # Table already exists
        
        # Verify column names are unique (final safety check)
        col_names = list(df.columns)
        if len(col_names) != len(set(col_names)):
            # Find duplicates and fix them
            from collections import Counter
            counts = Counter(col_names)
            duplicates = {name: count for name, count in counts.items() if count > 1}
            
            # Rename duplicates
            new_col_names = []
            seen = {}
            for idx, col_name in enumerate(col_names):
                if col_name in duplicates and col_name in seen:
                    # This is a duplicate, rename it
                    counter = seen[col_name]
                    seen[col_name] += 1
                    # Create unique name with index
                    new_name = f"{col_name[:55]}_col{idx}"
                    new_col_names.append(new_name)
                else:
                    if col_name not in seen:
                        seen[col_name] = 1
                    new_col_names.append(col_name)
            
            # Update DataFrame column names
            df.columns = new_col_names
        
        # Create table with appropriate types
        # PostgreSQL truncates identifiers to 63 characters, so we must ensure
        # uniqueness even after truncation
        with self.engine.connect() as conn:
            columns = []
            seen_truncated = {}  # Track truncated names (PostgreSQL limit is 63)
            final_col_names = []  # Store final column names
            
            for idx, (col, dtype) in enumerate(df.dtypes.items()):
                # PostgreSQL truncates identifiers to 63 characters
                truncated_name = col[:63] if len(col) > 63 else col
                
                # Check if truncated name would be unique
                if truncated_name in seen_truncated:
                    # This will be truncated to the same name, use index-based name
                    final_name = f"col_{idx}"
                    # Ensure truncated version is also unique
                    while final_name[:63] in seen_truncated:
                        idx += 1
                        final_name = f"col_{idx}"
                else:
                    # Use original name if it fits, otherwise truncate
                    final_name = col if len(col) <= 63 else col[:63]
                
                # Track truncated name
                final_truncated = final_name[:63]
                if final_truncated in seen_truncated:
                    # Still a conflict, use index
                    final_name = f"col_{idx}"
                    final_truncated = final_name[:63]
                    while final_truncated in seen_truncated:
                        idx += 1
                        final_name = f"col_{idx}"
                        final_truncated = final_name[:63]
                
                seen_truncated[final_truncated] = True
                final_col_names.append(final_name)
                sql_type = self._pandas_to_sql_type(dtype)
                columns.append(f'"{final_name}" {sql_type}')
            
            # Update DataFrame column names to match final names
            df.columns = final_col_names
            
            # Add metadata columns
            columns.append('imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
            
            if not columns:
                raise ValueError("No valid columns to create table")
            
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
