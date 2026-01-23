"""
9 indicateurs CTI pré-définis
Ces indicateurs seront créés automatiquement lors de l'initialisation de la base de données
"""

PREDEFINED_INDICATORS = [
    {
        "title": "Nombre de diplômés employés (y compris thèses et VIE)",
        "description": "Nombre total de diplômés ayant un emploi, y compris ceux en thèse et en VIE",
        "spec_json": {
            "sujet": {
                "tables": ["insertion_diplomes"],
                "conditions": [
                    {"or": [
                        {"=": [{"col": "statut_emploi"}, "employe"]},
                        {"=": [{"col": "statut_emploi"}, "these"]},
                        {"=": [{"col": "statut_emploi"}, "vie"]}
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
    },
    {
        "title": "Insertion de diplômés en moins de 2 mois",
        "description": "Pourcentage de diplômés ayant trouvé un emploi en moins de 2 mois",
        "spec_json": {
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
                                        "condition": {"<=": [{"col": "duree_recherche"}, 2]}
                                    },
                                    {"agg": "count"}
                                ]
                            }
                        ]
                    }
                }
            ]
        }
    },
    {
        "title": "Recherche d'emploi depuis 6 mois",
        "description": "Nombre de diplômés toujours en recherche d'emploi 6 mois après l'obtention du diplôme",
        "spec_json": {
            "sujet": {
                "tables": ["insertion_diplomes"],
                "conditions": [
                    {"=": [{"col": "statut_emploi"}, "recherche"]},
                    {">=": [{"col": "duree_recherche"}, 6]}
                ]
            },
            "colonnes": [
                {
                    "type": "aggregation",
                    "titre": "En recherche depuis 6 mois",
                    "expr": {"agg": "count"}
                }
            ]
        }
    },
    {
        "title": "Insertion en CDI",
        "description": "Nombre de diplômés en CDI, avec détail H/F",
        "spec_json": {
            "sujet": {
                "tables": ["insertion_diplomes"],
                "conditions": [
                    {"=": [{"col": "type_contrat"}, "CDI"]}
                ]
            },
            "colonnes": [
                {
                    "type": "group_by",
                    "titre": "Sexe",
                    "expr": {"col": "sexe"}
                },
                {
                    "type": "aggregation",
                    "titre": "Nombre en CDI",
                    "expr": {"agg": "count"}
                }
            ]
        }
    },
    {
        "title": "Insertion en statut de cadre",
        "description": "Nombre de diplômés embauchés avec un statut de cadre, avec détail H/F",
        "spec_json": {
            "sujet": {
                "tables": ["insertion_diplomes"],
                "conditions": [
                    {"=": [{"col": "statut_professionnel"}, "cadre"]}
                ]
            },
            "colonnes": [
                {
                    "type": "group_by",
                    "titre": "Sexe",
                    "expr": {"col": "sexe"}
                },
                {
                    "type": "aggregation",
                    "titre": "Nombre cadres",
                    "expr": {"agg": "count"}
                }
            ]
        }
    },
    {
        "title": "Nombre de diplômés ayant un emploi basé en France",
        "description": "Nombre de diplômés travaillant en France",
        "spec_json": {
            "sujet": {
                "tables": ["insertion_diplomes"],
                "conditions": [
                    {"=": [{"col": "pays_emploi"}, "France"]}
                ]
            },
            "colonnes": [
                {
                    "type": "aggregation",
                    "titre": "Emploi en France",
                    "expr": {"agg": "count"}
                }
            ]
        }
    },
    {
        "title": "Insertion poste basé à l'étranger",
        "description": "Nombre de diplômés ayant un emploi basé à l'étranger",
        "spec_json": {
            "sujet": {
                "tables": ["insertion_diplomes"],
                "conditions": [
                    {"!=": [{"col": "pays_emploi"}, "France"]}
                ]
            },
            "colonnes": [
                {
                    "type": "aggregation",
                    "titre": "Emploi à l'étranger",
                    "expr": {"agg": "count"}
                }
            ]
        }
    },
    {
        "title": "Nombre de diplômés qui font une thèse",
        "description": "Nombre de diplômés actuellement en thèse",
        "spec_json": {
            "sujet": {
                "tables": ["insertion_diplomes"],
                "conditions": [
                    {"=": [{"col": "statut_emploi"}, "these"]}
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
    },
    {
        "title": "Diplômés en poursuite d'études",
        "description": "Nombre de diplômés en poursuite d'études",
        "spec_json": {
            "sujet": {
                "tables": ["insertion_diplomes"],
                "conditions": [
                    {"=": [{"col": "statut_emploi"}, "poursuite_etudes"]}
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
    }
]
