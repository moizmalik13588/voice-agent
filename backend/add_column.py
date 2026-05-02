from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_fee INTEGER DEFAULT 1000'))
    conn.commit()
    print('Column added!')