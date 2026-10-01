import sys
from sqlalchemy import text, inspect
from app.db.database import get_engine

def run():
    print("Checking database columns for campaigns table...")
    engine = get_engine()
    inspector = inspect(engine)
    cols = [c['name'] for c in inspector.get_columns('campaigns')]
    print(f"Current columns: {cols}")

    with engine.connect() as conn:
        if 'approved_by' not in cols:
            print("Adding approved_by column...")
            try:
                conn.execute(text("ALTER TABLE campaigns ADD COLUMN approved_by BIGINT NULL"))
            except Exception as e:
                print("Error adding approved_by:", e)
        if 'approved_at' not in cols:
            print("Adding approved_at column...")
            try:
                conn.execute(text("ALTER TABLE campaigns ADD COLUMN approved_at DATETIME NULL"))
            except Exception as e:
                print("Error adding approved_at:", e)
        if 'rejection_reason' not in cols:
            print("Adding rejection_reason column...")
            try:
                conn.execute(text("ALTER TABLE campaigns ADD COLUMN rejection_reason TEXT NULL"))
            except Exception as e:
                print("Error adding rejection_reason:", e)
        conn.commit()

    inspector = inspect(engine)
    new_cols = [c['name'] for c in inspector.get_columns('campaigns')]
    print(f"Updated columns: {new_cols}")
    print("Migration complete!")

if __name__ == "__main__":
    run()
