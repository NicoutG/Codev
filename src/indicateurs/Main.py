from JsonToSqlTranslator import JsonToSqlTranslator
from pathlib import Path
import json

# Chemin relatif
file_path = Path("src/indicateurs/data/exemple.json")

# Ouvrir et lire le JSON
with open(file_path, "r", encoding="utf-8") as f:
    spec = json.load(f)


translator = JsonToSqlTranslator(spec)

sql_query = translator.to_sql()

print(sql_query)
