class MetadataDao:
    def get_tables(self) -> list[str]:
        return [
            "etudiant",
            "diplome",
            "age",
            "obtenu"
        ]

    def get_columns(self, table: str) -> list[str]:
        columns = {
            "etudiant": ["id", "age", "sexe"],
            "diplome": ["id", "obtenu", "annee"],
            "age": ["value"],
            "obtenu": ["value"]
        }
        return columns.get(table, [])

    def get_columns_for_tables(self, tables: list[str]) -> list[str]:
        result = set()
        for t in tables:
            result.update(self.get_columns(t))
        return list(result)
