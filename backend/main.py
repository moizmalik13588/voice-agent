from fastapi import FastAPI
from database import Base, engine
from routers import hospitals, doctors, appointments, vapi

def init_db():
    Base.metadata.create_all(bind=engine)

init_db()

app = FastAPI(title="Hospital SaaS API")

app.include_router(hospitals.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(vapi.router)

import uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=4444, reload=True)