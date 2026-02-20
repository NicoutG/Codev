# app/seed.py

from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User, UserRole
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
            "username": "rapport",
            "email": "rapport@polytech-lyon.fr",
            "password": "rapport123",
            "role": UserRole.CONSULTANT_RAPPORT,
        },
        {
            "username": "consultant",
            "email": "consultant@polytech-lyon.fr",
            "password": "consultant123",
            "role": UserRole.CONSULTANT,
        },
        {
            "username": "editeur",
            "email": "editeur@polytech-lyon.fr",
            "password": "editeur123",
            "role": UserRole.EDITEUR,
        },
        {
            "username": "admin",
            "email": "admin@polytech-lyon.fr",
            "password": "admin123",
            "role": UserRole.ADMIN,
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
                            {"=": [{"col": "type_etude"}, "%thèse%"]},
                            {"=": [{"col": "type_etude"}, "%VIE%"]},
                            {"=": [{"col": "situation_mars"}, "%thèse%"]}
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
                            {"=": [{"col": "type_etude"}, "%thèse%"]},
                            {"=": [{"col": "type_etude"}, "%these%"]},
                            {"=": [{"col": "type_etude"}, "%Thèse%"]},
                            {"=": [{"col": "situation_mars"}, "%thèse%"]}
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
        },
        {
            "title": "FI001",
            "description": "Nombre de diplômés employés - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "insertion"
                    ],
                    "conditions": None
                },
                "colonnes": [
                    {
                    "expr": {
                        "agg": "count",
                        "subject": {
                        "tables": [],
                        "conditions": {
                            "or": [
                            {
                                "=": [
                                {
                                    "col": "situation_mars"
                                },
                                "en activité professionnelle"
                                ]
                            },
                            {
                                "=": [
                                {
                                    "col": "situation_mars"
                                },
                                "en volontariat"
                                ]
                            },
                            {
                                "and": [
                                {
                                    "=": [
                                    {
                                        "col": "situation_mars"
                                    },
                                    "en poursuite d études"
                                    ]
                                },
                                {
                                    "or": [
                                    {
                                        "=": [
                                        {
                                            "col": "type_etude"
                                        },
                                        "Thèse académique"
                                        ]
                                    },
                                    {
                                        "=": [
                                        {
                                            "col": "type_etude"
                                        },
                                        "Thèse CIFRE, sur CDD"
                                        ]
                                    }
                                    ]
                                }
                                ]
                            }
                            ]
                        }
                        }
                    },
                    "type": "aggregation",
                    "titre": "Nombre"
                    }
                ]
            }
        },
        {
            "title": "FI003",
            "description": "Nombre de diplômés ayant trouvé un emploi en moins de deux mois - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "insertion"
                    ],
                    "conditions": None
                },
                "colonnes": [
                    {
                    "expr": {
                        "agg": "count",
                        "subject": {
                        "tables": [],
                        "conditions": {
                            "and": [
                            {
                                "<": [
                                {
                                    "col": "temps_pour_premier_emploi"
                                },
                                2
                                ]
                            },
                            {
                                "or": [
                                {
                                    "=": [
                                    {
                                        "col": "situation_mars"
                                    },
                                    "en activité professionnelle"
                                    ]
                                },
                                {
                                    "=": [
                                    {
                                        "col": "situation_mars"
                                    },
                                    "en volontariat"
                                    ]
                                },
                                {
                                    "and": [
                                    {
                                        "=": [
                                        {
                                            "col": "situation_mars"
                                        },
                                        "en poursuite d études"
                                        ]
                                    },
                                    {
                                        "or": [
                                        {
                                            "=": [
                                            {
                                                "col": "type_etude"
                                            },
                                            "Thèse académique"
                                            ]
                                        },
                                        {
                                            "=": [
                                            {
                                                "col": "type_etude"
                                            },
                                            "Thèse CIFRE, sur CDD"
                                            ]
                                        }
                                        ]
                                    }
                                    ]
                                }
                                ]
                            }
                            ]
                        }
                        }
                    },
                    "type": "aggregation",
                    "titre": "Nombre"
                    }
                ]
            }
        },
        {
            "title": "FI005",
            "description": "Nombre de diplômés en recherche d’emploi six mois après l’obtention du diplôme - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "insertion"
                    ],
                    "conditions": None
                },
                "colonnes": [
                    {
                    "type": "aggregation",
                    "titre": "Nombre",
                    "expr": {
                        "agg": "count",
                        "subject": {
                        "tables": [],
                        "conditions": {
                            "=": [
                            {
                                "col": "situation_mars"
                            },
                            "En recherche d'emploi"
                            ]
                        }
                        }
                    }
                    }
                ]
            }
        },
        {
            "title": "FI006",
            "description": "Nombre de diplômés embauchés avec un statut de cadre (en France ou sous contrat français, hors thèses) - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "insertion"
                    ],
                    "conditions": None
                },
                "colonnes": [
                    {
                    "type": "group_by",
                    "titre": "Genre",
                    "expr": {
                        "col": "genre"
                    }
                    },
                    {
                    "type": "aggregation",
                    "titre": "Nombre",
                    "expr": {
                        "agg": "count",
                        "subject": {
                        "tables": [],
                        "conditions": {
                            "and": [
                            {
                                "=": [
                                {
                                    "col": "situation_mars"
                                },
                                "En activité professionnelle"
                                ]
                            },
                            {
                                "=": [
                                {
                                    "col": "statut_emploi"
                                },
                                "cadre"
                                ]
                            }
                            ]
                        }
                        }
                    }
                    }
                ]
            }
        },
        {
            "title": "FI007",
            "description": "Nombre de diplômés embauchés pour une durée indéterminée (en France ou sous contrat français) - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "insertion"
                    ],
                    "conditions": None
                },
                "colonnes": [
                    {
                    "type": "group_by",
                    "titre": "Genre",
                    "expr": {
                        "col": "genre"
                    }
                    },
                    {
                    "type": "aggregation",
                    "titre": "Nombre",
                    "expr": {
                        "agg": "count",
                        "subject": {
                        "tables": [],
                        "conditions": {
                            "and": [
                            {
                                "=": [
                                {
                                    "col": "situation_mars"
                                },
                                "En activité professionnelle"
                                ]
                            },
                            {
                                "=": [
                                {
                                    "col": "type_emploi"
                                },
                                "CDI"
                                ]
                            }
                            ]
                        }
                        }
                    }
                    }
                ]
            }
        },
        {
            "title": "FI009",
            "description": "Nombre de diplômés ayant un emploi basé à l'étranger (y compris les thèses et les VIE) - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "insertion"
                    ],
                    "conditions": {
                    "!=": [
                        {
                        "col": "pays"
                        },
                        None
                    ]
                    }
                },
                "colonnes": [
                    {
                    "type": "group_by",
                    "titre": "Pays",
                    "expr": {
                        "col": "pays"
                    }
                    },
                    {
                    "expr": {
                        "agg": "count",
                        "subject": {
                        "tables": [],
                        "conditions": {
                            "or": [
                            {
                                "=": [
                                {
                                    "col": "situation_mars"
                                },
                                "en activité professionnelle"
                                ]
                            },
                            {
                                "=": [
                                {
                                    "col": "situation_mars"
                                },
                                "en volontariat"
                                ]
                            },
                            {
                                "and": [
                                {
                                    "=": [
                                    {
                                        "col": "situation_mars"
                                    },
                                    "en poursuite d études"
                                    ]
                                },
                                {
                                    "or": [
                                    {
                                        "=": [
                                        {
                                            "col": "type_etude"
                                        },
                                        "Thèse académique"
                                        ]
                                    },
                                    {
                                        "=": [
                                        {
                                            "col": "type_etude"
                                        },
                                        "Thèse CIFRE, sur CDD"
                                        ]
                                    }
                                    ]
                                }
                                ]
                            }
                            ]
                        }
                        }
                    },
                    "type": "aggregation",
                    "titre": "Nombre"
                    }
                ]
            }
        },
        {
            "title": "FI010",
            "description": "Nombre de diplômés ayant un emploi basé à l'étranger (dont les VIE) - 12 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "insertion"
                    ],
                    "conditions": {
                    "!=": [
                        {
                        "col": "pays"
                        },
                        None
                    ]
                    }
                },
                "colonnes": [
                    {
                    "type": "group_by",
                    "titre": "Pays",
                    "expr": {
                        "col": "pays"
                    }
                    },
                    {
                    "expr": {
                        "agg": "count",
                        "subject": {
                        "tables": [],
                        "conditions": {
                            "or": [
                            {
                                "=": [
                                {
                                    "col": "situation_mars"
                                },
                                "en activité professionnelle"
                                ]
                            },
                            {
                                "=": [
                                {
                                    "col": "situation_mars"
                                },
                                "en volontariat"
                                ]
                            }
                            ]
                        }
                        }
                    },
                    "type": "aggregation",
                    "titre": "Nombre"
                    }
                ]
            }
        },
        {
            "title": "FI011",
            "description": "Nombre de diplômés ayant un emploi basé en France - 12 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "insertion"
                    ],
                    "conditions": {
                    "!=": [
                        {
                        "col": "ville"
                        },
                        None
                    ]
                    }
                },
                "colonnes": [
                    {
                    "type": "group_by",
                    "titre": "Ville",
                    "expr": {
                        "col": "ville"
                    }
                    },
                    {
                    "expr": {
                        "agg": "count",
                        "subject": {
                        "tables": [],
                        "conditions": {
                            "=": [
                            {
                                "col": "situation_mars"
                            },
                            "en activité professionnelle"
                            ]
                        }
                        }
                    },
                    "type": "aggregation",
                    "titre": "Nombre"
                    }
                ]
            }
        },
        {
            "title": "FI012",
            "description": "Nombre de diplômés qui font une thèse - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "insertion"
                    ],
                    "conditions": None
                },
                "colonnes": [
                    {
                    "expr": {
                        "agg": "count",
                        "subject": {
                        "tables": [],
                        "conditions": {
                            "and": [
                            {
                                "=": [
                                {
                                    "col": "situation_mars"
                                },
                                "en poursuite d études"
                                ]
                            },
                            {
                                "or": [
                                {
                                    "=": [
                                    {
                                        "col": "type_etude"
                                    },
                                    "Thèse académique"
                                    ]
                                },
                                {
                                    "=": [
                                    {
                                        "col": "type_etude"
                                    },
                                    "Thèse CIFRE, sur CDD"
                                    ]
                                }
                                ]
                            }
                            ]
                        }
                        }
                    },
                    "type": "aggregation",
                    "titre": "Nombre"
                    }
                ]
            }
        },
        {
            "title": "FI014",
            "description": "Nombre de diplômés qui font une poursuite d'études - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "insertion"
                    ],
                    "conditions": None
                },
                "colonnes": [
                    {
                    "expr": {
                        "agg": "count",
                        "subject": {
                        "tables": [],
                        "conditions": {
                            "=": [
                            {
                                "col": "situation_mars"
                            },
                            "en poursuite d études"
                            ]
                        }
                        }
                    },
                    "type": "aggregation",
                    "titre": "Nombre"
                    }
                ]
            }
        },
        {
            "title": "FI016",
            "description": "Nombre de diplômés de la dernière promotion ayant effectué une ou plusieurs mobilités académiques au cours de leur scolarité - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "mobilite"
                    ],
                    "conditions": {
                    "=": [
                        {
                        "col": "diplome"
                        },
                        "oui"
                    ]
                    }
                },
                "colonnes": [
                    {
                    "type": "group_by",
                    "titre": "Spécialité",
                    "expr": {
                        "col": "filiere"
                    }
                    },
                    {
                    "type": "case",
                    "titre": "Durée mobilité étude",
                    "cases": [
                        {
                        "label": "Moins d'un semestre",
                        "when": {
                            "<": [
                            {
                                "col": "nb_mois_etude"
                            },
                            4
                            ]
                        }
                        },
                        {
                        "label": "Un semestre",
                        "when": {
                            "and": [
                            {
                                ">=": [
                                {
                                    "col": "nb_mois_etude"
                                },
                                4
                                ]
                            },
                            {
                                "<=": [
                                {
                                    "col": "nb_mois_etude"
                                },
                                5
                                ]
                            }
                            ]
                        }
                        },
                        {
                        "label": "Plus d'un semestre",
                        "when": {
                            ">": [
                            {
                                "col": "nb_mois_etude"
                            },
                            5
                            ]
                        }
                        }
                    ]
                    },
                    {
                    "type": "group_by",
                    "titre": "Genre",
                    "expr": {
                        "col": "sexe"
                    }
                    },
                    {
                    "type": "aggregation",
                    "titre": "Nombre",
                    "expr": {
                        "agg": "count"
                    }
                    }
                ]
            }
        },
        {
            "title": "FI017",
            "description": "Nombre de diplômés de la dernière promotion ayant effectué un ou plusieurs stages à l'étranger - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "mobilite"
                    ],
                    "conditions": {
                    "=": [
                        {
                        "col": "diplome"
                        },
                        "oui"
                    ]
                    }
                },
                "colonnes": [
                    {
                    "type": "group_by",
                    "titre": "Spécialité",
                    "expr": {
                        "col": "filiere"
                    }
                    },
                    {
                    "type": "case",
                    "titre": "Durée mobilité professionnelle",
                    "cases": [
                        {
                        "label": "Moins d'un semestre",
                        "when": {
                            "<": [
                            {
                                "col": "nb_mois_stage"
                            },
                            3
                            ]
                        }
                        },
                        {
                        "label": "Un semestre",
                        "when": {
                            "and": [
                            {
                                ">=": [
                                {
                                    "col": "nb_mois_stage"
                                },
                                3
                                ]
                            },
                            {
                                "<=": [
                                {
                                    "col": "nb_mois_stage"
                                },
                                6
                                ]
                            }
                            ]
                        }
                        },
                        {
                        "label": "Plus d'un semestre",
                        "when": {
                            ">": [
                            {
                                "col": "nb_mois_stage"
                            },
                            6
                            ]
                        }
                        }
                    ]
                    },
                    {
                    "type": "group_by",
                    "titre": "Genre",
                    "expr": {
                        "col": "sexe"
                    }
                    },
                    {
                    "type": "aggregation",
                    "titre": "Nombre",
                    "expr": {
                        "agg": "count"
                    }
                    }
                ]
            }
        },
        {
            "title": "FI018",
            "description": "Durée de mobilité des doubles diplômés ingénieurs sortants de la dernière promotion - 6 mois après diplomation",
            "indicator": {
                "sujet": {
                    "tables": [
                    "mobilite"
                    ],
                    "conditions": {
                    "=": [
                        {
                        "col": "double_diplome"
                        },
                        None
                    ]
                    }
                },
                "colonnes": [
                    {
                    "type": "group_by",
                    "titre": "Spécialité",
                    "expr": {
                        "col": "filiere"
                    }
                    },
                    {
                    "type": "case",
                    "titre": "Durée mobilité",
                    "cases": [
                        {
                        "label": "Moins de 2 semestres",
                        "when": {
                            "<": [
                            {
                                "op": "+",
                                "args": [
                                {
                                    "col": "nb_mois_stage"
                                },
                                {
                                    "col": "nb_mois_etude"
                                }
                                ]
                            },
                            9
                            ]
                        }
                        },
                        {
                        "label": "Moins de 4 semestres",
                        "when": {
                            "<": [
                            {
                                "op": "+",
                                "args": [
                                {
                                    "col": "nb_mois_stage"
                                },
                                {
                                    "col": "nb_mois_etude"
                                }
                                ]
                            },
                            18
                            ]
                        }
                        },
                        {
                        "label": "4 semestres ou plus",
                        "when": {
                            ">=": [
                            {
                                "op": "+",
                                "args": [
                                {
                                    "col": "nb_mois_stage"
                                },
                                {
                                    "col": "nb_mois_etude"
                                }
                                ]
                            },
                            18
                            ]
                        }
                        }
                    ]
                    },
                    {
                    "type": "group_by",
                    "titre": "Genre",
                    "expr": {
                        "col": "sexe"
                    }
                    },
                    {
                    "type": "aggregation",
                    "titre": "Nombre",
                    "expr": {
                        "agg": "count"
                    }
                    }
                ]
            }
        },
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
