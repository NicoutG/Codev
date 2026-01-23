"""
Script pour nettoyer les données existantes et importer les feuilles du fichier d'insertion
"""
import os
from database import SessionLocal, init_db
from sqlalchemy import text, inspect, create_engine
from config import DATABASE_URL
from models import User, Import, Indicator, IndicatorResult, Formulaire
from services.import_service import ImportService

def clean_database(db: SessionLocal):
    """Supprime toutes les données importées et les tables associées"""
    print("\n🗑️  Nettoyage de la base de données...")
    
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    # Get all data tables
    data_tables = [t for t in inspector.get_table_names() if t.startswith('data_')]
    
    # Delete all data tables
    print(f"   Suppression de {len(data_tables)} tables de données...")
    with engine.connect() as conn:
        for table in data_tables:
            try:
                conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
                conn.commit()
                print(f"   ✅ Table {table} supprimée")
            except Exception as e:
                print(f"   ⚠️  Erreur lors de la suppression de {table}: {e}")
    
    # Delete all import records
    imports = db.query(Import).all()
    print(f"   Suppression de {len(imports)} enregistrements d'import...")
    for imp in imports:
        db.delete(imp)
    
    # Delete all indicator results
    results = db.query(IndicatorResult).all()
    print(f"   Suppression de {len(results)} résultats d'indicateurs...")
    for result in results:
        db.delete(result)
    
    db.commit()
    print("✅ Base de données nettoyée")

def import_insertion_sheets(db: SessionLocal, admin_user: User):
    """Importe chaque feuille du fichier d'insertion séparément"""
    print("\n📥 Import des feuilles du fichier d'insertion...")
    
    file_path = "/app/examples/Base_insertion_promos_2020_a_2022.xlsx"
    import_service = ImportService(db)
    
    # Mapping des feuilles vers les types de données
    sheets_mapping = {
        "Promo 2020 à 6 mois": "insertion_2020_6m",
        "Promo 2020 à 18 mois": "insertion_2020_18m",
        "Promo 2021 à 6 mois": "insertion_2021_6m",
        "Promo 2021 à 18 mois": "insertion_2021_18m",
        "Promo 2022 à 6 mois": "insertion_2022_6m"
    }
    
    imported_count = 0
    for sheet_name, data_type in sheets_mapping.items():
        print(f"\n  📄 Import de la feuille: {sheet_name}")
        print(f"     Type de données: {data_type}")
        try:
            result = import_service.import_to_database(
                file_path,
                data_type,
                admin_user.id,
                sheet_name=sheet_name
            )
            print(f"  ✅ Importé {result['rows_imported']} lignes dans {result['table_name']}")
            imported_count += 1
        except Exception as e:
            print(f"  ❌ Erreur lors de l'import de {sheet_name}: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n✅ {imported_count}/{len(sheets_mapping)} feuilles importées avec succès")

if __name__ == "__main__":
    print("============================================================")
    print("🧹 Nettoyage et import des données d'insertion")
    print("============================================================")
    
    db = SessionLocal()
    try:
        # Get admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("❌ Utilisateur admin non trouvé. Exécutez init_db.py d'abord.")
            exit(1)
        
        # Clean database
        clean_database(db)
        
        # Import sheets
        import_insertion_sheets(db, admin_user)
        
        print("\n============================================================")
        print("✅ Nettoyage et import terminés avec succès!")
        print("============================================================")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
