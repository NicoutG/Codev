import re
import unicodedata
from typing import Any, Optional

_WHITESPACE_RE = re.compile(r"\s+")

def normalize_text_value(value: Optional[Any]) -> Optional[str]:
    """
    Normalise un champ texte avant insertion / génération SQL:
    - cast string
    - unicode normalize (NFKC)
    - remplace \r \n \t par espaces
    - remplace ' et " par espaces (évite soucis de guillemets)
    - supprime caractères de contrôle invisibles
    - lower
    - compacte les espaces (max 1) + trim
    """
    if value is None:
        return None

    v = str(value)
    v = unicodedata.normalize("NFKC", v)
    v = v.replace("\r\n", " ").replace("\n", " ").replace("\r", " ").replace("\t", " ")
    v = v.replace("'", " ").replace('"', " ")

    # supprime contrôles (catégorie Unicode "C*") sauf l'espace
    v = "".join(ch for ch in v if ch == " " or unicodedata.category(ch)[0] != "C")

    v = v.lower()
    v = _WHITESPACE_RE.sub(" ", v).strip()
    return v


def sql_string_literal(value: Optional[Any]) -> str:
    """
    Génère un littéral SQL SAFE pour PostgreSQL à partir d'une valeur texte:
    - normalise
    - échappe les quotes (si jamais il en reste)
    - entoure de quotes SQL
    """
    v = normalize_text_value(value)
    if v is None or v == "":
        return "NULL"
    # si jamais il reste une quote (au cas où) -> escape SQL standard
    v = v.replace("'", "''")
    return f"'{v}'"
