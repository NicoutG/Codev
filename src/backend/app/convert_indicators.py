"""
Script pour convertir les indicateurs existants au format attendu par JsonToSqlTranslator.
Format attendu:
{
  "sujet": {
    "tables": ["insertion"],  // ou autre table
    "conditions": []
  },
  "colonnes": [
    {
      "type": "aggregation",  // ou "group_by", "case"
      "titre": "...",
      "expr": {...}
    }
  ]
}
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.indicator import Indicator


def convert_indicator(old_format: dict, title: str) -> dict:
    """
    Convertit un indicateur de l'ancien format au nouveau format.
    """
    new_format = {
        "sujet": {
            "tables": [],
            "conditions": []
        },
        "colonnes": []
    }
    
    ind_type = old_format.get("type", "")
    
    # Déterminer la table à utiliser selon le type d'indicateur
    if "mobilite" in title.lower() or "mobilité" in title.lower():
        table = "mobilite"
    elif "etude" in title.lower() or "étud" in title.lower() or "stage" in title.lower():
        table = "etudiants"
    else:
        # Par défaut, utiliser insertion
        table = "insertion"
    
    new_format["sujet"]["tables"] = [table]
    
    # Conversion selon le type
    if ind_type == "aggregate":
        # Format: {"type": "aggregate", "op": "sum", "field": "nb_mois_etude"}
        op = old_format.get("op", "count")
        field = old_format.get("field", "1")
        
        new_format["colonnes"].append({
            "type": "aggregation",
            "titre": title,
            "expr": {
                "agg": op,
                "col": field
            }
        })
    
    elif ind_type == "count":
        # Format: {"type": "count", "field": "id_polytech"}
        field = old_format.get("field", "1")
        
        new_format["colonnes"].append({
            "type": "aggregation",
            "titre": title,
            "expr": {
                "agg": "count",
                "col": field
            }
        })
    
    elif ind_type == "group_count":
        # Format: {"type": "group_count", "group_by": "sexe"}
        group_by_field = old_format.get("group_by", "")
        
        new_format["colonnes"].append({
            "type": "group_by",
            "titre": group_by_field.capitalize(),
            "expr": {"col": group_by_field}
        })
        
        new_format["colonnes"].append({
            "type": "aggregation",
            "titre": "Nombre",
            "expr": {
                "agg": "count",
                "col": "1"
            }
        })
    
    elif ind_type == "filter_count":
        # Format: {"type": "filter_count", "field": "boursier", "equals": "Oui"}
        field = old_format.get("field", "")
        equals_value = old_format.get("equals", "")
        
        new_format["sujet"]["conditions"] = {
            "=": [{"col": field}, equals_value]
        }
        
        new_format["colonnes"].append({
            "type": "aggregation",
            "titre": title,
            "expr": {
                "agg": "count",
                "col": "1"
            }
        })
    
    elif ind_type == "ratio":
        # Format: {"type": "ratio", "numerator": "validated_students", "denominator": "total_students"}
        numerator = old_format.get("numerator", "")
        denominator = old_format.get("denominator", "")
        
        # Pour un ratio, on fait un calcul avec deux COUNT conditionnels
        new_format["colonnes"].append({
            "type": "aggregation",
            "titre": title,
            "expr": {
                "op": "*",
                "args": [
                    100,
                    {
                        "op": "/",
                        "args": [
                            {
                                "agg": "count",
                                "condition": {
                                    "=": [{"col": numerator}, True]
                                }
                            },
                            {
                                "agg": "count",
                                "col": denominator
                            }
                        ]
                    }
                ]
            }
        })
    
    else:
        # Format par défaut: simple count
        new_format["colonnes"].append({
            "type": "aggregation",
            "titre": title,
            "expr": {
                "agg": "count",
                "col": "1"
            }
        })
    
    return new_format


def convert_all_indicators():
    """
    Convertit tous les indicateurs existants.
    """
    db = SessionLocal()
    try:
        indicators = db.query(Indicator).all()
        
        print(f"🔄 Conversion de {len(indicators)} indicateurs...\n")
        
        for indicator in indicators:
            old_format = indicator.indicator
            
            # Vérifier si déjà au bon format
            if isinstance(old_format, dict) and "sujet" in old_format and "colonnes" in old_format:
                print(f"⏭️  {indicator.title} (ID: {indicator.id}) - Déjà au bon format")
                continue
            
            # Convertir
            try:
                new_format = convert_indicator(old_format, indicator.title)
                indicator.indicator = new_format
                db.commit()
                print(f"✅ {indicator.title} (ID: {indicator.id}) - Converti avec succès")
                print(f"   Table: {new_format['sujet']['tables'][0]}")
                print(f"   Colonnes: {len(new_format['colonnes'])}")
            except Exception as e:
                print(f"❌ {indicator.title} (ID: {indicator.id}) - Erreur: {str(e)}")
                db.rollback()
        
        print(f"\n✅ Conversion terminée !")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la conversion: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    convert_all_indicators()
