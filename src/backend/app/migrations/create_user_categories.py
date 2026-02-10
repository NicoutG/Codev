"""
Script pour ajouter la colonne "category" à la table "users"
"""

from sqlalchemy import text
from app.core.database import engine

def create_user_categories():
    """Ajoute la colonne 'category' à la table 'users'."""
    sql_statements = [
        # Création de l'ENUM pour la catégorie utilisateur
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usercategory') THEN
                CREATE TYPE usercategory AS ENUM ('polytech', 'cti');
            END IF;
        END $$;
        """,
        # Ajout de la colonne "category" avec une valeur par défaut
        """
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS category usercategory NOT NULL DEFAULT 'polytech';
        """
    ]

    # Exécuter chaque instruction SQL
    executed = 0
    for sql in sql_statements:
        with engine.begin() as conn:
            try:
                conn.execute(text(sql))
                executed += 1
            except Exception as e:
                print(f"Erreur lors de l'exécution : {sql[:50]}... - {str(e)[:100]}")
    
    print(f"{executed}/{len(sql_statements)} instructions exécutées avec succès")

if __name__ == "__main__":
    create_user_categories()