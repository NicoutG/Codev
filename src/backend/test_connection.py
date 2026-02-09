"""
Script pour tester la connexion à PostgreSQL
"""
import os
from dotenv import load_dotenv

load_dotenv()

def test_connection():
    from app.core.database import engine
    
    try:
        with engine.connect() as conn:
            print("✅ Connexion réussie à PostgreSQL!")
            print(f"Base de données: {engine.url.database}")
            print(f"Utilisateur: {engine.url.username}")
            return True
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        print("\nSolutions possibles:")
        print("1. Vérifiez que PostgreSQL est démarré: brew services start postgresql@15")
        print("2. Créez la base de données: createdb polytech_indicateurs")
        print("3. Modifiez DATABASE_URL dans .env avec votre nom d'utilisateur macOS")
        print("   Exemple: DATABASE_URL=postgresql://jules@localhost:5432/polytech_indicateurs")
        return False

if __name__ == "__main__":
    test_connection()
