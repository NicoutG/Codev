from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, List, Any, Optional
from app.dao.metadata_dao import MetadataDao
from app.dao.insertion_dao import InsertionDao
from app.dao.etudiants_dao import EtudiantsDao
from app.dao.mobilite_dao import MobiliteDao


class TableDataService:
    def __init__(self):
        self.metadata = MetadataDao()
        self.daos = {
            "insertion": InsertionDao(),
            "etudiants": EtudiantsDao(),
            "mobilite": MobiliteDao(),
        }

    def _get_dao(self, table: str):
        allowed = self.metadata.get_tables()
        if table not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Table inconnue '{table}'. Tables autorisées: {allowed}",
            )
        dao = self.daos.get(table)
        if not dao:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"DAO non disponible pour la table '{table}'",
            )
        return dao

    def get_table_data(
        self,
        db: Session,
        table: str,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> Dict[str, Any]:
        """
        Récupère les données d'une table avec pagination, recherche et tri au niveau SQL.
        Optimisé pour les gros volumes de données.
        """
        dao = self._get_dao(table)
        columns = self.metadata.get_columns(table)
        
        # Construire la requête SQL avec pagination, recherche et tri
        base_query = f'SELECT * FROM {table}'
        where_clauses = []
        params = {}
        
        # Recherche (si fournie) - recherche dans toutes les colonnes textuelles
        # Mais seulement dans les colonnes qui existent réellement dans la table
        if search:
            search_conditions = []
            # Vérifier quelles colonnes existent réellement dans la table
            existing_cols_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = :table_name
            """)
            existing_cols_result = db.execute(existing_cols_query, {"table_name": table})
            existing_column_names = {row[0] for row in existing_cols_result}
            
            # Ne rechercher que dans les colonnes qui existent
            for col in columns:
                if col in existing_column_names:
                    # Utiliser ILIKE pour recherche insensible à la casse
                    search_conditions.append(f"{col}::text ILIKE :search_pattern")
            
            if search_conditions:
                where_clauses.append(f"({' OR '.join(search_conditions)})")
                params['search_pattern'] = f'%{search}%'
        
        # Construire WHERE
        where_clause = ''
        if where_clauses:
            where_clause = ' WHERE ' + ' AND '.join(where_clauses)
        
        # Tri (si fourni)
        order_clause = ''
        if sort_by and sort_by in columns:
            order_clause = f' ORDER BY {sort_by} {sort_order.upper()}'
        else:
            # Par défaut, trier par la première colonne (généralement la clé primaire)
            if columns:
                order_clause = f' ORDER BY {columns[0]} ASC'
        
        # Compter le total (avec filtres)
        count_query = f'SELECT COUNT(*) FROM {table}{where_clause}'
        total_result = db.execute(text(count_query), params)
        total = total_result.scalar()
        
        # Requête paginée
        paginated_query = f'{base_query}{where_clause}{order_clause} LIMIT :limit OFFSET :offset'
        params['limit'] = limit
        params['offset'] = skip
        
        # Exécuter la requête
        result = db.execute(text(paginated_query), params)
        rows_data = []
        for row in result:
            rows_data.append(dict(row._mapping))
        
        return {
            "rows": rows_data,
            "total": total,
            "columns": columns,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "limit": limit,
            "skip": skip
        }
