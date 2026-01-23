from dao.metadata_dao import MetadataDao
from database import get_db

class MetadataService:
    def __init__(self, db):
        self.dao = MetadataDao(db)

    def list_tables(self) -> list[str]:
        return self.dao.get_tables()

    def list_columns(self, table: str) -> list[str]:
        return self.dao.get_columns(table)

    def list_columns_for_tables(self, tables: list[str]) -> list[str]:
        return self.dao.get_columns_for_tables(tables)
