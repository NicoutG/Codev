"""
Script pour créer les 9 indicateurs CTI spécifiques pour les demandes d'emploi.
Ces indicateurs sont basés sur la table insertion et suivent les fiches indicateurs CTI.
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.indicator import Indicator
from app.models.user import User
from app.models.report import Report, report_indicators


def create_cti_indicators(db: Session):
    """
    Crée les 9 indicateurs CTI avec les bonnes formules.
    """
    admin_user = db.query(User).filter(User.username == "admin").first()
    
    # Supprimer les anciens indicateurs CTI s'ils existent (pour repartir propre)
    # On garde les IDs 1-9 pour les remplacer
    existing = db.query(Indicator).filter(Indicator.id.in_([1, 2, 3, 4, 5, 6, 7, 8, 9])).all()
    for ind in existing:
        db.delete(ind)
    db.commit()
    
    indicators_data = [
        {
            "id": 1,
            "title": "Nombre de diplômés employés (y compris thèses et VIE)",
            "description": "Nombre total de diplômés en emploi, y compris ceux en thèse et en VIE.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "or": [
                            {"=": [{"col": "situation_mars"}, "En activité professionnelle"]},
                            {"like": [{"col": "type_etude"}, "%thèse%"]},
                            {"like": [{"col": "type_etude"}, "%VIE%"]},
                            {"like": [{"col": "situation_mars"}, "%thèse%"]}
                        ]
                    }
                },
                "colonnes": [{
                    "type": "aggregation",
                    "titre": "Nombre de diplômés employés",
                    "expr": {
                        "agg": "count",
                        "col": "1"
                    }
                }]
            }
        },
        {
            "id": 2,
            "title": "Insertion de diplômés en moins de 2 mois",
            "description": "Nombre et pourcentage de diplômés ayant trouvé un emploi en moins de 2 mois.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "and": [
                            {"=": [{"col": "situation_mars"}, "En activité professionnelle"]},
                            {
                                "or": [
                                    {"=": [{"col": "temps_pour_premier_emploi"}, "0"]},
                                    {"=": [{"col": "temps_pour_premier_emploi"}, "1"]},
                                    {"=": [{"col": "temps_pour_premier_emploi"}, "2"]}
                                ]
                            }
                        ]
                    }
                },
                "colonnes": [{
                    "type": "aggregation",
                    "titre": "Insertion < 2 mois",
                    "expr": {
                        "agg": "count",
                        "col": "1"
                    }
                }]
            }
        },
        {
            "id": 3,
            "title": "En recherche d'emploi 6 mois après l'obtention du diplôme",
            "description": "Nombre de diplômés toujours en recherche d'emploi 6 mois après l'obtention du diplôme.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "or": [
                            {">=": [{"col": "recherche_emploi_depuis"}, "6"]},
                            {"like": [{"col": "recherche_emploi_depuis"}, "%6 mois%"]},
                            {"like": [{"col": "recherche_emploi_depuis"}, "%plus de 6%"]}
                        ]
                    }
                },
                "colonnes": [{
                    "type": "aggregation",
                    "titre": "Recherche d'emploi ≥ 6 mois",
                    "expr": {
                        "agg": "count",
                        "col": "1"
                    }
                }]
            }
        },
        {
            "id": 4,
            "title": "Embauche avec un statut de cadre (détail H/F)",
            "description": "Nombre de diplômés embauchés avec un statut de cadre, répartis par genre.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "and": [
                            {"=": [{"col": "situation_mars"}, "En activité professionnelle"]},
                            {"=": [{"col": "statut_emploi"}, "Cadre"]}
                        ]
                    }
                },
                "colonnes": [
                    {
                        "type": "group_by",
                        "titre": "Genre",
                        "expr": {"col": "genre"}
                    },
                    {
                        "type": "aggregation",
                        "titre": "Nombre",
                        "expr": {
                            "agg": "count",
                            "col": "1"
                        }
                    }
                ]
            }
        },
        {
            "id": 5,
            "title": "Insertion en CDI (détail H/F)",
            "description": "Nombre de diplômés en CDI, répartis par genre. Note: Cette information peut être dans type_emploi.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "and": [
                            {"=": [{"col": "situation_mars"}, "En activité professionnelle"]},
                            {
                                "or": [
                                    {"like": [{"col": "type_emploi"}, "%CDI%"]},
                                    {"like": [{"col": "type_emploi"}, "%cdi%"]}
                                ]
                            }
                        ]
                    }
                },
                "colonnes": [
                    {
                        "type": "group_by",
                        "titre": "Genre",
                        "expr": {"col": "genre"}
                    },
                    {
                        "type": "aggregation",
                        "titre": "Nombre",
                        "expr": {
                            "agg": "count",
                            "col": "1"
                        }
                    }
                ]
            }
        },
        {
            "id": 6,
            "title": "Nombre de diplômés ayant un emploi basé en France",
            "description": "Nombre de diplômés ayant un emploi basé en France.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "and": [
                            {"=": [{"col": "situation_mars"}, "En activité professionnelle"]},
                            {
                                "or": [
                                    {"=": [{"col": "pays"}, "France"]},
                                    {"like": [{"col": "pays"}, "%France%"]}
                                ]
                            }
                        ]
                    }
                },
                "colonnes": [{
                    "type": "aggregation",
                    "titre": "Emploi en France",
                    "expr": {
                        "agg": "count",
                        "col": "1"
                    }
                }]
            }
        },
        {
            "id": 7,
            "title": "Insertion poste basé à l'étranger",
            "description": "Nombre de diplômés ayant un emploi basé à l'étranger.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "and": [
                            {"=": [{"col": "situation_mars"}, "En activité professionnelle"]},
                            {"!=": [{"col": "pays"}, None]},
                            {
                                "and": [
                                    {"!=": [{"col": "pays"}, "France"]},
                                    {"not_like": [{"col": "pays"}, "%France%"]}
                                ]
                            }
                        ]
                    }
                },
                "colonnes": [{
                    "type": "aggregation",
                    "titre": "Emploi à l'étranger",
                    "expr": {
                        "agg": "count",
                        "col": "1"
                    }
                }]
            }
        },
        {
            "id": 8,
            "title": "Nombre de diplômés actuellement en thèse",
            "description": "Nombre de diplômés actuellement en thèse.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "or": [
                            {"like": [{"col": "type_etude"}, "%thèse%"]},
                            {"like": [{"col": "type_etude"}, "%these%"]},
                            {"like": [{"col": "type_etude"}, "%Thèse%"]},
                            {"like": [{"col": "situation_mars"}, "%thèse%"]}
                        ]
                    }
                },
                "colonnes": [{
                    "type": "aggregation",
                    "titre": "Diplômés en thèse",
                    "expr": {
                        "agg": "count",
                        "col": "1"
                    }
                }]
            }
        },
        {
            "id": 9,
            "title": "Diplômés en poursuite d'études",
            "description": "Nombre de diplômés en poursuite d'études.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "=": [{"col": "situation_mars"}, "En poursuite d'études"]
                    }
                },
                "colonnes": [{
                    "type": "aggregation",
                    "titre": "Poursuite d'études",
                    "expr": {
                        "agg": "count",
                        "col": "1"
                    }
                }]
            }
        }
    ]
    
    created_indicators = []
    for item in indicators_data:
        indicator = Indicator(
            id=item["id"],
            title=item["title"],
            description=item["description"],
            indicator=item["indicator"],
            created_by=admin_user.id if admin_user else None
        )
        db.add(indicator)
        created_indicators.append(indicator)
    
    db.commit()
    print(f"✅ Créé {len(created_indicators)} indicateurs CTI")
    return created_indicators


def create_cti_report(db: Session, indicators: list):
    """
    Crée le rapport prédéfini "Emploi pour la CTI" avec les 9 indicateurs.
    """
    admin_user = db.query(User).filter(User.username == "admin").first()
    
    # Vérifier si le rapport existe déjà
    existing_report = db.query(Report).filter(Report.title == "Emploi pour la CTI").first()
    if existing_report:
        # Supprimer les associations existantes
        db.execute(
            report_indicators.delete().where(
                report_indicators.c.report_id == existing_report.id
            )
        )
        db.delete(existing_report)
        db.commit()
    
    # Créer le nouveau rapport
    report = Report(
        title="Emploi pour la CTI",
        description="Rapport regroupant les 9 indicateurs d'insertion professionnelle pour les demandes de la CTI.",
        created_by=admin_user.id if admin_user else None
    )
    db.add(report)
    db.flush()  # Pour obtenir l'ID
    
    # Associer les indicateurs avec leurs graphiques
    chart_configs = {
        1: {"chart_type": "bar", "display_order": 0},  # Nombre employés
        2: {"chart_type": "bar", "display_order": 1},  # Insertion < 2 mois
        3: {"chart_type": "bar", "display_order": 2},  # Recherche ≥ 6 mois
        4: {"chart_type": "bar", "display_order": 3},  # Cadre H/F (barres groupées)
        5: {"chart_type": "bar", "display_order": 4},  # CDI H/F (barres groupées)
        6: {"chart_type": "bar", "display_order": 5},  # Emploi France
        7: {"chart_type": "bar", "display_order": 6},  # Emploi étranger
        8: {"chart_type": "bar", "display_order": 7},  # En thèse
        9: {"chart_type": "bar", "display_order": 8}   # Poursuite études
    }
    
    for indicator in indicators:
        config = chart_configs.get(indicator.id, {})
        db.execute(
            report_indicators.insert().values(
                report_id=report.id,
                indicator_id=indicator.id,
                chart_type=config.get("chart_type"),
                chart_config=None,
                display_order=config.get("display_order", indicator.id - 1)
            )
        )
    
    db.commit()
    print(f"✅ Rapport 'Emploi pour la CTI' créé avec {len(indicators)} indicateurs")
    return report


def seed_cti_indicators():
    """
    Fonction principale pour créer les indicateurs CTI et le rapport.
    """
    db = SessionLocal()
    try:
        indicators = create_cti_indicators(db)
        report = create_cti_report(db, indicators)
        print(f"\n✅ Initialisation CTI terminée !")
        print(f"   - {len(indicators)} indicateurs CTI créés")
        print(f"   - Rapport '{report.title}' créé")
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de l'initialisation CTI: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_cti_indicators()
