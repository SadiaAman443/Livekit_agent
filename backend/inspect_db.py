import sys
from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv('g:/Kpro pvt/swargaseema-ai Agent/backend/.env')
url = os.getenv('DATABASE_URL')
if not url:
    print('No DATABASE_URL found')
    sys.exit(1)

engine = create_engine(url)
inspector = inspect(engine)
print('TABLES:', inspector.get_table_names())

for table in ['documents', 'knowledge_chunks', 'embeddings', 'knowledge_sources', 'document_chunks']:
    if inspector.has_table(table):
        print(f'\n--- TABLE {table} ---')
        cols = inspector.get_columns(table)
        for c in cols:
            print(f"  Column: {c['name']} ({c['type']})")
        pk = inspector.get_pk_constraint(table)
        print(f"  PK: {pk}")
        fks = inspector.get_foreign_keys(table)
        print(f"  FKs: {fks}")
    else:
        print(f'\n--- TABLE {table} DOES NOT EXIST ---')

try:
    enums = inspector.get_enums()
    print('\nENUMS:', enums)
except Exception as e:
    print('Failed to get enums:', e)
