from app.database.session import engine
from sqlalchemy import text

def fix_db():
    print('Fixing Neon DB...')
    with engine.connect() as conn:
        conn.execute(text('ALTER TABLE calls ADD COLUMN IF NOT EXISTS vobiz_call_id VARCHAR(255);'))
        conn.execute(text('ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url VARCHAR(2048);'))
        conn.execute(text('ALTER TABLE calls ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITHOUT TIME ZONE;'))
        conn.execute(text('ALTER TABLE calls ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITHOUT TIME ZONE;'))
        conn.execute(text('''
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'uq_calls_vobiz_call_id'
            ) THEN
                ALTER TABLE calls ADD CONSTRAINT uq_calls_vobiz_call_id UNIQUE (vobiz_call_id);
            END IF;
        END $$;
        '''))
        conn.commit()
        print('DB Schema Updated.')

if __name__ == '__main__':
    fix_db()
