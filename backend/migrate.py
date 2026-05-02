from database import engine
from models import Base
from sqlalchemy import text

# Add consultation_fee column
with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_fee INTEGER DEFAULT 1000'))
        conn.commit()
        print('consultation_fee column added!')
    except Exception as e:
        print(f'consultation_fee: {e}')

# Create any new tables
Base.metadata.create_all(bind=engine)
print('All tables updated!')