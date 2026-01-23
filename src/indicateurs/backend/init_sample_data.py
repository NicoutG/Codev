"""
Script to initialize the database with sample data from examples folder
"""
import os
import sys
from pathlib import Path
from database import SessionLocal, init_db
from models import User, Indicator, Formulaire, FormulaireIndicator
from services.import_service import ImportService
from services.indicator_service import IndicatorService
from services.formulaire_service import FormulaireService
from data.predefined_indicators import PREDEFINED_INDICATORS
from auth import get_password_hash
import bcrypt

# Get the examples directory path
# In Docker, it's mounted at /app/examples
# Locally, it's at ../../examples from backend
if Path("/app/examples").exists():
    EXAMPLES_DIR = Path("/app/examples")
else:
    EXAMPLES_DIR = Path(__file__).parent.parent.parent.parent / "examples"

def import_sample_data():
    """Import sample Excel files from examples directory"""
    db = SessionLocal()
    try:
        import_service = ImportService(db)
        
        # Get admin user (ID 1)
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("❌ Admin user not found. Please run init_db.py first.")
            return
        
        print("📥 Importing sample data files...")
        
        # List of files to import with their types
        files_to_import = [
            {
                "filename": "Base_insertion_promos_2020_a_2022.xlsx",
                "type": "insertion"
            },
            {
                "filename": "Base_mobilite_inscrits_promo_2022.xlsx",
                "type": "mobilite"
            },
            {
                "filename": "Base_etudiants_inscrits_promo_2022.xlsx",
                "type": "reussite"
            }
        ]
        
        imported_count = 0
        for file_info in files_to_import:
            file_path = EXAMPLES_DIR / file_info["filename"]
            
            if not file_path.exists():
                print(f"⚠️  File not found: {file_info['filename']}")
                continue
            
            try:
                print(f"  📄 Importing {file_info['filename']}...")
                result = import_service.import_to_database(
                    str(file_path),
                    file_info["type"],
                    admin_user.id
                )
                print(f"  ✅ Imported {result['rows_imported']} rows from {file_info['filename']}")
                imported_count += 1
            except Exception as e:
                print(f"  ❌ Error importing {file_info['filename']}: {str(e)}")
        
        print(f"\n✅ Successfully imported {imported_count} data files")
        return imported_count > 0
        
    except Exception as e:
        print(f"❌ Error during data import: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def create_sample_formulaires():
    """Create sample formulaires"""
    db = SessionLocal()
    try:
        formulaire_service = FormulaireService(db)
        indicator_service = IndicatorService(db)
        
        # Get admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            print("❌ Admin user not found")
            return False
        
        # Get all indicators
        all_indicators = indicator_service.list_indicators()
        if len(all_indicators) == 0:
            print("⚠️  No indicators found. Please create indicators first.")
            return False
        
        # Get predefined indicators (first 9, or all if less than 9)
        predefined_indicators = [ind for ind in all_indicators if ind.is_predefined][:9]
        
        if len(predefined_indicators) == 0:
            print("⚠️  No predefined indicators found. Please run init_db.py first.")
            return False
        
        print("\n📋 Creating sample formulaires...")
        
        # Create CTI formulaire with all available predefined indicators
        chart_types_dict = {}
        for i, ind in enumerate(predefined_indicators):
            # Alternate between bar and pie
            chart_types_dict[ind.id] = "bar" if i % 2 == 0 else "pie"
        
        try:
            # Check if formulaire already exists
            existing_cti = db.query(Formulaire).filter(Formulaire.nom == "Formulaire Emploi CTI").first()
            if not existing_cti:
                formulaire_cti = formulaire_service.create_formulaire(
                    nom="Formulaire Emploi CTI",
                    demandeur="CTI",
                    template_type="CTI",
                    created_by_id=admin_user.id,
                    indicator_ids=[ind.id for ind in predefined_indicators],
                    chart_types=chart_types_dict
                )
                print(f"  ✅ Created formulaire: {formulaire_cti.nom}")
            else:
                print(f"  ℹ️  Formulaire CTI already exists")
        except Exception as e:
            print(f"  ⚠️  Error creating formulaire CTI: {str(e)}")
        
        # Create Lyon1 formulaire with first 5 indicators
        if len(predefined_indicators) >= 5:
            try:
                existing_lyon1 = db.query(Formulaire).filter(Formulaire.nom == "Formulaire Emploi Lyon 1").first()
                if not existing_lyon1:
                    formulaire_lyon1 = formulaire_service.create_formulaire(
                        nom="Formulaire Emploi Lyon 1",
                        demandeur="Lyon1",
                        template_type="Lyon1",
                        created_by_id=admin_user.id,
                        indicator_ids=[ind.id for ind in predefined_indicators[:5]],
                        chart_types={ind.id: chart_types_dict[ind.id] for ind in predefined_indicators[:5]}
                    )
                    print(f"  ✅ Created formulaire: {formulaire_lyon1.nom}")
                else:
                    print(f"  ℹ️  Formulaire Lyon1 already exists")
            except Exception as e:
                print(f"  ⚠️  Error creating formulaire Lyon1: {str(e)}")
        
        print("✅ Sample formulaires created")
        return True
        
    except Exception as e:
        print(f"❌ Error creating formulaires: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def main():
    """Main initialization function"""
    print("=" * 60)
    print("🚀 Initializing sample data for PolyStats")
    print("=" * 60)
    
    # Check if examples directory exists
    if not EXAMPLES_DIR.exists():
        print(f"❌ Examples directory not found: {EXAMPLES_DIR}")
        print("   Please ensure the examples folder exists with Excel files.")
        return
    
    # Import sample data
    data_imported = import_sample_data()
    
    # Create sample formulaires
    formulaires_created = create_sample_formulaires()
    
    print("\n" + "=" * 60)
    if data_imported and formulaires_created:
        print("✅ Sample data initialization completed successfully!")
    else:
        print("⚠️  Sample data initialization completed with warnings")
    print("=" * 60)

if __name__ == "__main__":
    main()
