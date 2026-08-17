from app.database.session import engine
from sqlalchemy import inspect

def check():
    inspector = inspect(engine)
    print("Tables:", inspector.get_table_names())
    if 'leads' in inspector.get_table_names():
        print("leads table columns:")
        for col in inspector.get_columns('leads'):
            print(f"  {col['name']}: {col['type']}")

if __name__ == "__main__":
    check()
