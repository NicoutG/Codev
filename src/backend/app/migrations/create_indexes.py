"""
Script pour créer les index sur les colonnes fréquemment utilisées.
À exécuter après la création des tables.
"""

from sqlalchemy import text
from app.core.database import engine


def create_indexes():
    """Crée les index pour optimiser les performances."""
    indexes_sql = [
        # Table insertion
        "CREATE INDEX IF NOT EXISTS idx_insertion_situation_mars ON insertion(situation_mars)",
        "CREATE INDEX IF NOT EXISTS idx_insertion_statut_emploi ON insertion(statut_emploi)",
        "CREATE INDEX IF NOT EXISTS idx_insertion_genre ON insertion(genre)",
        "CREATE INDEX IF NOT EXISTS idx_insertion_pays ON insertion(pays)",
        "CREATE INDEX IF NOT EXISTS idx_insertion_type_etude ON insertion(type_etude)",
        "CREATE INDEX IF NOT EXISTS idx_insertion_recherche_emploi_depuis ON insertion(recherche_emploi_depuis)",
        "CREATE INDEX IF NOT EXISTS idx_insertion_temps_pour_premier_emploi ON insertion(temps_pour_premier_emploi)",
        "CREATE INDEX IF NOT EXISTS idx_insertion_code ON insertion(code)",
        
        # Table etudiants
        "CREATE INDEX IF NOT EXISTS idx_etudiants_id_polytech ON etudiants(id_polytech)",
        "CREATE INDEX IF NOT EXISTS idx_etudiants_genre ON etudiants(genre)",
        "CREATE INDEX IF NOT EXISTS idx_etudiants_validation_annee ON etudiants(validation_annee)",
        
        # Table mobilite
        "CREATE INDEX IF NOT EXISTS idx_mobilite_id_polytech ON mobilite(id_polytech)",
        "CREATE INDEX IF NOT EXISTS idx_mobilite_type ON mobilite(type)",
        
        # Index composites
        "CREATE INDEX IF NOT EXISTS idx_insertion_situation_genre ON insertion(situation_mars, genre)",
        "CREATE INDEX IF NOT EXISTS idx_insertion_situation_statut ON insertion(situation_mars, statut_emploi)",
    ]
    
    # Utiliser des transactions séparées pour chaque index
    created = 0
    skipped = 0
    
    for sql in indexes_sql:
        # Transaction séparée pour chaque index
        with engine.begin() as conn:
            try:
                conn.execute(text(sql))
                created += 1
            except Exception as e:
                error_msg = str(e)
                if "does not exist" in error_msg or "UndefinedColumn" in error_msg:
                    print(f"⏭️  Colonne inexistante, index ignoré: {sql[:60]}...")
                else:
                    print(f"⚠️  Erreur: {sql[:50]}... - {error_msg[:100]}")
                skipped += 1
    
    print(f"✅ {created}/{len(indexes_sql)} index créés avec succès")
    if skipped > 0:
        print(f"⏭️  {skipped} index ignorés (colonnes inexistantes ou erreurs)")


if __name__ == "__main__":
    create_indexes()
