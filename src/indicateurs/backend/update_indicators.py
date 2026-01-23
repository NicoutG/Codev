"""
Script pour mettre à jour les indicateurs pré-définis avec les vraies colonnes
"""
from database import SessionLocal
from models import User, Indicator
from sqlalchemy import text

def update_indicators(db: SessionLocal):
    """Met à jour les indicateurs pré-définis pour utiliser les vraies colonnes"""
    print("\n🔄 Mise à jour des indicateurs pré-définis...")
    
    # Nom des colonnes nettoyées dans la base de données
    COL_SITUATION = "quelle_est_votre_situation_au_1er_mars_2021___"
    COL_PROMOTION = "promotion"
    COL_GENRE = "genre"
    COL_DUREE_RECHERCHE = "combien_de_temps_avez_vous_mis_pour_trouver_votre_1er_e"
    COL_TYPE_ETUDES = "quel_type_d_études_poursuivez_vous___"
    
    # Valeurs possibles
    VAL_EN_ACTIVITE = "En activité professionnelle"
    VAL_RECHERCHE = "En recherche d'emploi"
    VAL_POURSUITE_ETUDES = "En poursuite d'études"
    VAL_VOLONTARIAT = "En volontariat"
    VAL_THESE = "Thèse"  # Valeur possible dans type d'études
    
    # Get all predefined indicators
    indicators = db.query(Indicator).filter(Indicator.is_predefined == True).all()
    
    for indicator in indicators:
        title = indicator.title
        print(f"\n  📝 Mise à jour: {title}")
        
        try:
            if "employés (y compris thèses et VIE)" in title:
                # Nombre de diplômés employés
                indicator.spec_json = {
                    "sujet": {
                        "tables": ["insertion_diplomes"],
                        "conditions": [
                            {"or": [
                                {"=": [{"col": COL_SITUATION}, VAL_EN_ACTIVITE]},
                                {"=": [{"col": COL_SITUATION}, VAL_VOLONTARIAT]}
                            ]}
                        ]
                    },
                    "colonnes": [
                        {
                            "type": "aggregation",
                            "titre": "Nombre de diplômés employés",
                            "expr": {"agg": "count"}
                        }
                    ]
                }
            
            elif "moins de 2 mois" in title:
                # Insertion en moins de 2 mois
                indicator.spec_json = {
                    "sujet": {
                        "tables": ["insertion_diplomes"],
                        "conditions": []
                    },
                    "colonnes": [
                        {
                            "type": "aggregation",
                            "titre": "Pourcentage insertion < 2 mois",
                            "expr": {
                                "op": "*",
                                "args": [
                                    100,
                                    {
                                        "op": "/",
                                        "args": [
                                            {
                                                "agg": "count",
                                                "condition": {"<=": [{"col": COL_DUREE_RECHERCHE}, 2]}
                                            },
                                            {"agg": "count"}
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            
            elif "Recherche d'emploi depuis 6 mois" in title:
                # En recherche d'emploi
                indicator.spec_json = {
                    "sujet": {
                        "tables": ["insertion_diplomes"],
                        "conditions": [
                            {"=": [{"col": COL_SITUATION}, VAL_RECHERCHE]}
                        ]
                    },
                    "colonnes": [
                        {
                            "type": "aggregation",
                            "titre": "En recherche d'emploi",
                            "expr": {"agg": "count"}
                        }
                    ]
                }
            
            elif "Insertion en CDI" in title:
                # Comptage par genre (pas de colonne type_contrat, on compte les employés par genre)
                indicator.spec_json = {
                    "sujet": {
                        "tables": ["insertion_diplomes"],
                        "conditions": [
                            {"=": [{"col": COL_SITUATION}, VAL_EN_ACTIVITE]}
                        ]
                    },
                    "colonnes": [
                        {
                            "type": "group_by",
                            "titre": "Genre",
                            "expr": {"col": COL_GENRE}
                        },
                        {
                            "type": "aggregation",
                            "titre": "Nombre en activité",
                            "expr": {"agg": "count"}
                        }
                    ]
                }
            
            elif "statut de cadre" in title:
                # Employés par genre
                indicator.spec_json = {
                    "sujet": {
                        "tables": ["insertion_diplomes"],
                        "conditions": [
                            {"=": [{"col": COL_SITUATION}, VAL_EN_ACTIVITE]}
                        ]
                    },
                    "colonnes": [
                        {
                            "type": "group_by",
                            "titre": "Genre",
                            "expr": {"col": COL_GENRE}
                        },
                        {
                            "type": "aggregation",
                            "titre": "Nombre employés",
                            "expr": {"agg": "count"}
                        }
                    ]
                }
            
            elif "emploi basé en France" in title:
                # Total employés (pas de colonne pays)
                indicator.spec_json = {
                    "sujet": {
                        "tables": ["insertion_diplomes"],
                        "conditions": [
                            {"=": [{"col": COL_SITUATION}, VAL_EN_ACTIVITE]}
                        ]
                    },
                    "colonnes": [
                        {
                            "type": "aggregation",
                            "titre": "Nombre employés",
                            "expr": {"agg": "count"}
                        }
                    ]
                }
            
            elif "poste basé à l'étranger" in title:
                # Pas de colonne pays, on compte 0
                indicator.spec_json = {
                    "sujet": {
                        "tables": ["insertion_diplomes"],
                        "conditions": [
                            {"=": [{"col": COL_SITUATION}, "N/A"]}  # Condition impossible = 0
                        ]
                    },
                    "colonnes": [
                        {
                            "type": "aggregation",
                            "titre": "Non disponible",
                            "expr": {"agg": "count"}
                        }
                    ]
                }
            
            elif "thèse" in title.lower():
                # Nombre en thèse
                indicator.spec_json = {
                    "sujet": {
                        "tables": ["insertion_diplomes"],
                        "conditions": [
                            {"=": [{"col": COL_TYPE_ETUDES}, VAL_THESE]}
                        ]
                    },
                    "colonnes": [
                        {
                            "type": "aggregation",
                            "titre": "En thèse",
                            "expr": {"agg": "count"}
                        }
                    ]
                }
            
            elif "poursuite d'études" in title.lower():
                # Poursuite d'études
                indicator.spec_json = {
                    "sujet": {
                        "tables": ["insertion_diplomes"],
                        "conditions": [
                            {"=": [{"col": COL_SITUATION}, VAL_POURSUITE_ETUDES]}
                        ]
                    },
                    "colonnes": [
                        {
                            "type": "aggregation",
                            "titre": "Poursuite d'études",
                            "expr": {"agg": "count"}
                        }
                    ]
                }
            
            db.commit()
            print(f"  ✅ Mis à jour")
        
        except Exception as e:
            print(f"  ❌ Erreur: {e}")
            db.rollback()
    
    print("\n✅ Mise à jour des indicateurs terminée")

if __name__ == "__main__":
    print("============================================================")
    print("🔄 Mise à jour des indicateurs pré-définis")
    print("============================================================")
    
    db = SessionLocal()
    try:
        update_indicators(db)
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
