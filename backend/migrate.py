from database import engine
from models import Base
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS consultation_fee INTEGER DEFAULT 1000'))
        conn.commit()
        print('consultation_fee column added!')
    except Exception as e:
        print(f'consultation_fee: {e}')

    # ✅ Yeh add karo
    try:
        conn.execute(text('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS login_email VARCHAR'))
        conn.commit()
        print('login_email column added!')
    except Exception as e:
        print(f'login_email: {e}')

    try:
        conn.execute(text('ALTER TABLE doctors ADD COLUMN IF NOT EXISTS login_password VARCHAR'))
        conn.commit()
        print('login_password column added!')
    except Exception as e:
        print(f'login_password: {e}')

    try:
        conn.execute(text('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email VARCHAR'))
        conn.commit()
        print('patient_email column added!')
    except Exception as e:
        print(f'patient_email: {e}')

    try:
        conn.execute(text('DELETE FROM notifications'))
        conn.commit()
        print('Old notifications cleared!')
    except Exception as e:
        print(f'notifications: {e}')

# Create any new tables
Base.metadata.create_all(bind=engine)
print('All tables updated!')