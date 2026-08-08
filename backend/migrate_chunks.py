import os, sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('g:/Kpro pvt/swargaseema-ai Agent/backend/.env')
url = os.getenv('DATABASE_URL')
engine = create_engine(url)

with engine.connect() as conn:
    print("Executing ALTER TABLE document_chunks...")
    conn.execute(text("""
        ALTER TABLE document_chunks
        ADD COLUMN IF NOT EXISTS embedding_status VARCHAR(50) DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS last_embedding_attempt TIMESTAMP,
        ADD COLUMN IF NOT EXISTS error_message TEXT;
    """))
    conn.commit()
    print("Migration successful.")
