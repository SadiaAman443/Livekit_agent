from app.database.session import engine
from sqlalchemy import text

def drop():
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE leads CASCADE"))
    print("Dropped leads table.")

if __name__ == "__main__":
    drop()
