from fastapi import HTTPException, status
from sqlalchemy.orm import Session
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
        Récupère les données d'une table avec pagination, recherche et tri.
        
        Args:
            db: Session SQLAlchemy
            table: Nom de la table
            skip: Nombre de lignes à sauter (pagination)
            limit: Nombre maximum de lignes à retourner
            search: Terme de recherche (optionnel)
            sort_by: Colonne pour le tri (optionnel)
            sort_order: Ordre de tri ('asc' ou 'desc')
        
        Returns:
            Dict avec:
            - rows: Liste des lignes (dict)
            - total: Nombre total de lignes
            - columns: Liste des colonnes
            - page: Page actuelle
            - limit: Limite par page
        """
        dao = self._get_dao(table)
        columns = self.metadata.get_columns(table)
        
        # Récupérer toutes les données (pour le moment, on utilise export_all)
        # TODO: Optimiser avec pagination au niveau SQL si nécessaire
        all_rows = dao.export_all(db)
        total = len(all_rows)
        
        # Recherche (si fournie)
        if search:
            search_lower = search.lower()
            filtered_rows = []
            for row in all_rows:
                # Chercher dans toutes les valeurs de la ligne
                for value in row.values():
                    if value and search_lower in str(value).lower():
                        filtered_rows.append(row)
                        break
            all_rows = filtered_rows
            total = len(all_rows)
        
        # Tri (si fourni)
        if sort_by and sort_by in columns:
            reverse = sort_order.lower() == "desc"
            try:
                all_rows.sort(
                    key=lambda x: (
                        x.get(sort_by) is not None,
                        x.get(sort_by) if x.get(sort_by) is not None else ""
                    ),
                    reverse=reverse
                )
            except Exception:
                # En cas d'erreur de tri, on continue sans tri
                pass
        
        # Pagination
        paginated_rows = all_rows[skip:skip + limit]
        
        return {
            "rows": paginated_rows,
            "total": total,
            "columns": columns,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "limit": limit,
            "skip": skip
        }
