from app.dao.metadata_dao import MetadataDao

class MetadataService:
    def __init__(self):
        self.dao = MetadataDao()

    def list_tables(self) -> list[str]:
        return self.dao.get_tables()

    def list_columns(self, table: str) -> list[str]:
        return self.dao.get_columns(table)

    def list_columns_for_tables(self, tables: list[str]) -> list[str]:
        return self.dao.get_columns_for_tables(tables)
