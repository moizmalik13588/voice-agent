from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS login_email VARCHAR"))
    conn.execute(text("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS login_password VARCHAR"))
    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_doctors_login_email ON doctors(login_email)"))
    conn.commit()

print("Doctor login columns added!")