# app/seed.py

from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User, UserRole, UserCategory
from app.models.indicator import Indicator


def seed_users(db: Session) -> None:
    """
    Crée (ou recrée) les utilisateurs de test.
    Stratégie: si des users existent -> delete pour repartir clean (comme tu faisais).
    """
    existing_users = db.query(User).count()
    if existing_users > 0:
        print("Les utilisateurs existent déjà. Suppression des anciens utilisateurs...")
        # Supprimer d'abord les références dans les autres tables
        from app.models.report import Report
        db.query(Indicator).update({"created_by": None})
        db.query(Report).update({"created_by": None})
        db.commit()
        # Maintenant on peut supprimer les users
        db.query(User).delete()
        db.commit()

    users_data: List[Dict[str, Any]] = [
        {
            "username": "consultant",
            "email": "consultant@polytech-lyon.fr",
            "password": "consultant123",
            "role": UserRole.CONSULTANT,
            "category": UserCategory.POLYTECH,
        },
        {
            "username": "editeur",
            "email": "editeur@polytech-lyon.fr",
            "password": "editeur123",
            "role": UserRole.EDITEUR,
            "category": UserCategory.POLYTECH,
        },
        {
            "username": "admin",
            "email": "admin@polytech-lyon.fr",
            "password": "admin123",
            "role": UserRole.ADMIN,
            "category": UserCategory.POLYTECH,
        },
    ]

    for u in users_data:
        db.add(
            User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"],
                is_active=True,
            )
        )

    db.commit()
    print("✓ Default users created (consultant/editeur/admin)")


def seed_predefined_indicators(db: Session) -> None:
    """
    Crée les indicateurs CTI prédéfinis au format JSON correct.
    Utilise les indicateurs CTI demandés dans le sujet.
    Stratégie: idempotente -> si des indicateurs existent déjà, on ne touche pas.
    """
    existing = db.query(Indicator).count()
    if existing > 0:
        print("✓ Predefined indicators already exist (skip)")
        return

    admin_user = db.query(User).filter(User.username == "admin").first()

    # Indicateurs CTI au format JSON correct (sujet/colonnes)
    predefined = [
        {
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
            "title": "En recherche d'emploi 6 mois après l'obtention du diplôme",
            "description": "Nombre de diplômés toujours en recherche d'emploi 6 mois après l'obtention du diplôme.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "and": [
                            {"=": [{"col": "situation_mars"}, "En recherche d'emploi"]},
                            {"=": [{"col": "recherche_emploi_depuis"}, "Votre sortie de l'école"]}
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
            "title": "Insertion en CDI (détail H/F)",
            "description": "Nombre de diplômés en CDI, répartis par genre.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "and": [
                            {"=": [{"col": "situation_mars"}, "En activité professionnelle"]},
                            {"=": [{"col": "type_emploi"}, "CDI"]}
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
            "title": "Nombre de diplômés ayant un emploi basé en France",
            "description": "Nombre de diplômés ayant un emploi basé en France (pays NULL ou vide = France).",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "and": [
                            {"=": [{"col": "situation_mars"}, "En activité professionnelle"]},
                            {
                                "or": [
                                    {"=": [{"col": "pays"}, None]},
                                    {"=": [{"col": "pays"}, ""]}
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
            "title": "Insertion poste basé à l'étranger",
            "description": "Nombre de diplômés ayant un emploi basé à l'étranger.",
            "indicator": {
                "sujet": {
                    "tables": ["insertion"],
                    "conditions": {
                        "and": [
                            {"=": [{"col": "situation_mars"}, "En activité professionnelle"]},
                            {"!=": [{"col": "pays"}, None]},
                            {"!=": [{"col": "pays"}, "France"]}
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

    for item in predefined:
        db.add(
            Indicator(
                title=item["title"],
                description=item["description"],
                indicator=item["indicator"],
                created_by=admin_user.id if admin_user else None,
            )
        )

    db.commit()
    print(f"✓ Created {len(predefined)} predefined CTI indicators")
