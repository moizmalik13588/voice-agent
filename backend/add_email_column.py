from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email VARCHAR'))
    conn.commit()

print('patient_email column added!')