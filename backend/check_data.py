from app.database.session import engine
from sqlalchemy import text

def check_data():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM leads"))
        print(f"Leads count: {result.scalar()}")

if __name__ == "__main__":
    check_data()
