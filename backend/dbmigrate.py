from database import engine
from models import Base
from routers.payments import Payment

Base.metadata.create_all(bind=engine)
print("Payments table created!")