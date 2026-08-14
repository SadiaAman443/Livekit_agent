import sys
from app.database.models import Base
from app.database.session import engine

def create_tables():
    # Fix charmap codec issue on windows for the checkmark symbol
    sys.stdout.reconfigure(encoding='utf-8')
    print("Creating missing CRM tables...")
    try:
        # Base.metadata.create_all only creates missing tables.
        # It does NOT drop existing tables or delete any data.
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables are ready")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    create_tables()
