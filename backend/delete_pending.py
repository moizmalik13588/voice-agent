from database import SessionLocal
from routers.payments import Payment
from sqlalchemy import delete

db = SessionLocal()
db.execute(delete(Payment).where(Payment.status == "pending"))
db.commit()
db.close()

print("Pending payments deleted!")