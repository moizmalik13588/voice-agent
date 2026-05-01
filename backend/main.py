from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers import hospitals, doctors, appointments, vapi

def init_db():
    Base.metadata.create_all(bind=engine)

init_db()

app = FastAPI(title="Hospital SaaS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # development ke liye sab allow
    allow_credentials=True,
    allow_methods=["*"],
        allow_headers=["*"],
)


app.include_router(hospitals.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(vapi.router)

import uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)