# Step 1: Import Database objects
from database import init_db, Appointment, get_db

init_db()

# Step 2: Create Data Contracts using Pydantic Models
import datetime as dt
from pydantic import BaseModel

class AppointmentRequest(BaseModel):
    patient_name: str
    reason: str
    start_time: dt.datetime

class AppointmentResponse(BaseModel):
    id: int
    patient_name: str
    reason: str | None
    start_time: dt.datetime
    canceled: bool
    created_at: dt.datetime

class CancelAppointmentRequest(BaseModel):
    patient_name: str
    date: dt.date

class CancelAppointmentResponse(BaseModel):
    canceled_count: int

class ListAppointmentRequest(BaseModel):
    date: dt.date


# Step 3: Create FastAPI application and endpoints
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

app = FastAPI()


# Schedule appointment
@app.post("/schedule_appointment/")
def schedule_appointment(request: AppointmentRequest, db: Session = Depends(get_db)):
    
    # Duplicate check
    existing = db.execute(
        select(Appointment)
        .where(Appointment.patient_name == request.patient_name)
        .where(Appointment.start_time == request.start_time)
        .where(Appointment.canceled == False)
    ).scalars().first()

    if existing:
        raise HTTPException(status_code=409, detail="Appointment already exists at this time for this patient")

    new_appointment = Appointment(
        patient_name=request.patient_name,
        reason=request.reason,
        start_time=request.start_time,
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    return AppointmentResponse(
        id=new_appointment.id,
        patient_name=new_appointment.patient_name,
        reason=new_appointment.reason,
        start_time=new_appointment.start_time,
        canceled=new_appointment.canceled,
        created_at=new_appointment.created_at,
    )


# Cancel appointment
@app.post("/cancel_appointment/")
def cancel_appointment(request: CancelAppointmentRequest, db: Session = Depends(get_db)):
    start_dt = dt.datetime.combine(request.date, dt.time.min)
    end_dt = start_dt + dt.timedelta(days=1)

    appointments = db.execute(
        select(Appointment)
        .where(Appointment.patient_name == request.patient_name)
        .where(Appointment.start_time >= start_dt)
        .where(Appointment.start_time < end_dt)
        .where(Appointment.canceled == False)
    ).scalars().all()

    if not appointments:
        raise HTTPException(status_code=404, detail="No matching appointment found in our system")  # ✅ raise, not return

    for appointment in appointments:
        appointment.canceled = True

    db.commit()

    return CancelAppointmentResponse(canceled_count=len(appointments))


# List appointments
@app.post("/list_appointments/")
def list_appointments(request: ListAppointmentRequest, db: Session = Depends(get_db)):
    start_dt = dt.datetime.combine(request.date, dt.time.min)
    end_dt = start_dt + dt.timedelta(days=1)

    appointments = db.execute(
        select(Appointment)
        .where(Appointment.canceled == False)
        .where(Appointment.start_time >= start_dt)
        .where(Appointment.start_time < end_dt)
        .order_by(Appointment.start_time.asc())
    ).scalars().all()

    return [
        AppointmentResponse(
            id=appt.id,
            patient_name=appt.patient_name,
            reason=appt.reason,
            start_time=appt.start_time,
            canceled=appt.canceled,
            created_at=appt.created_at,
        )
        for appt in appointments  # ✅ list comprehension — cleaner
    ]


import uvicorn
if __name__ == "__main__":
    uvicorn.run("backend:app", host="127.0.0.1", port=4444, reload=True)