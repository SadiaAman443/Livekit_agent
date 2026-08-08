import psycopg2
conn = psycopg2.connect('postgresql://postgres:Root%40080626@localhost:5432/swargaseema_crm')
cur = conn.cursor()
cur.execute("SELECT atttypmod FROM pg_attribute WHERE attrelid = 'embeddings'::regclass AND attname = 'embedding_vector';")
print(cur.fetchone())
