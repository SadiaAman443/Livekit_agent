import os, sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv('g:/Kpro pvt/swargaseema-ai Agent/backend/.env')
url = os.getenv('DATABASE_URL')
engine = create_engine(url)

tables = ['knowledge_sources', 'documents', 'document_chunks', 'embeddings']
with engine.connect() as conn:
    for table in tables:
        print(f'\\n--- TABLE {table} ---')
        res = conn.execute(text(f"""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = '{table}'
            ORDER BY ordinal_position;
        """)).fetchall()
        for r in res:
            print(f"  {r[0]}: {r[1]} (Nullable: {r[2]}, Default: {r[3]})")
