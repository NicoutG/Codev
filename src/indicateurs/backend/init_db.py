"""
Script d'initialisation de la base de données
Crée les tables et les indicateurs pré-définis
"""
from database import init_db, SessionLocal
from models import User
from services.user_service import UserService
from services.indicator_service import IndicatorService
from data.predefined_indicators import PREDEFINED_INDICATORS
from auth import get_password_hash

def init_database():
    """Initialize database with tables and default data"""
    print("Initializing database...")
    
    # Create tables
    init_db()
    print("✓ Tables created")
    
    db = SessionLocal()
    try:
        # Create default admin user if it doesn't exist
        user_service = UserService(db)
        admin = user_service.get_user_by_username("admin")
        if not admin:
            admin = user_service.create_user(
                username="admin",
                email="admin@polytech.fr",
                password="admin123",  # Change in production!
                role="modificateur"
            )
            print(f"✓ Default admin user created (username: admin, password: admin123)")
        else:
            print("✓ Admin user already exists")
        
        # Create default consultant user
        consultant = user_service.get_user_by_username("consultant")
        if not consultant:
            consultant = user_service.create_user(
                username="consultant",
                email="consultant@polytech.fr",
                password="consultant123",
                role="consultant"
            )
            print(f"✓ Default consultant user created (username: consultant, password: consultant123)")
        else:
            print("✓ Consultant user already exists")
        
        # Create predefined indicators
        indicator_service = IndicatorService(db)
        existing = indicator_service.get_predefined_indicators()
        
        if len(existing) == 0:
            print("Creating predefined indicators...")
            for indicator_data in PREDEFINED_INDICATORS:
                indicator_service.create_indicator(
                    title=indicator_data["title"],
                    description=indicator_data["description"],
                    spec_json=indicator_data["spec_json"],
                    created_by_id=admin.id,
                    is_predefined=True
                )
            print(f"✓ Created {len(PREDEFINED_INDICATORS)} predefined indicators")
        else:
            print(f"✓ {len(existing)} predefined indicators already exist")
        
        print("\n✓ Database initialization complete!")
        
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
