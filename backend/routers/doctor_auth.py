import datetime as dt
import os
import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db
from models import Doctor, Appointment, AppointmentStatus

router = APIRouter(prefix="/doctor-auth", tags=["Doctor Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "medibook-secret-key-2026")
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


# ─── Schemas ──────────────────────────────────────────
class DoctorLoginRequest(BaseModel):
    email: str
    password: str

class DoctorSetPasswordRequest(BaseModel):
    doctor_id: int
    login_email: str
    password: str


# ─── Helpers ──────────────────────────────────────────
def create_doctor_token(doctor_id: int, hospital_id: int) -> str:
    payload = {
        "doctor_id": doctor_id,
        "hospital_id": hospital_id,
        "role": "doctor",
        "exp": dt.datetime.utcnow() + dt.timedelta(days=7),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_doctor(token: str, db: Session) -> Doctor:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        doctor_id = payload.get("doctor_id")
        doctor = db.execute(
            select(Doctor).where(Doctor.id == doctor_id)
        ).scalars().first()
        if not doctor:
            raise HTTPException(status_code=401, detail="Doctor not found")
        return doctor
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─── Endpoints ────────────────────────────────────────

# Admin sets doctor password
@router.post("/set-password")
def set_doctor_password(
    request: DoctorSetPasswordRequest,
    db: Session = Depends(get_db),
):
    doctor = db.execute(
        select(Doctor).where(Doctor.id == request.doctor_id)
    ).scalars().first()

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Check email unique
    existing = db.execute(
        select(Doctor)
        .where(Doctor.login_email == request.login_email)
        .where(Doctor.id != request.doctor_id)
    ).scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already in use")

    doctor.login_email = request.login_email
    doctor.login_password = hash_password(request.password)
    db.commit()

    return {"message": f"Login credentials set for Dr. {doctor.name}"}


# Doctor login
@router.post("/login")
def doctor_login(
    request: DoctorLoginRequest,
    db: Session = Depends(get_db),
):
    doctor = db.execute(
        select(Doctor).where(Doctor.login_email == request.email)
    ).scalars().first()

    if not doctor or not doctor.login_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(request.password, doctor.login_password):
       raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_doctor_token(doctor.id, doctor.hospital_id)

    return {
        "token": token,
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "specialty": doctor.specialty,
            "email": doctor.login_email,
            "hospital_id": doctor.hospital_id,
        }
    }


# Doctor ka apna dashboard data
@router.get("/my-appointments")
def my_appointments(
    token: str,
    date: dt.date = None,
    db: Session = Depends(get_db),
):
    doctor = get_current_doctor(token, db)

    query = (
        select(Appointment)
        .where(Appointment.doctor_id == doctor.id)
        .where(Appointment.status == AppointmentStatus.scheduled)
        .order_by(Appointment.start_time.asc())
    )

    if date:
        query = query.where(
            Appointment.start_time >= dt.datetime.combine(date, dt.time.min)
        ).where(
            Appointment.start_time < dt.datetime.combine(date, dt.time.min) + dt.timedelta(days=1)
        )

    appointments = db.execute(query).scalars().all()

    return [
        {
            "id": a.id,
            "patient_name": a.patient_name,
            "patient_phone": a.patient_phone,
            "reason": a.reason,
            "start_time": a.start_time,
            "end_time": a.end_time,
            "status": a.status,
        }
        for a in appointments
    ]


@router.get("/my-stats")
def my_stats(
    token: str,
    db: Session = Depends(get_db),
):
    doctor = get_current_doctor(token, db)
    today = dt.date.today()

    total = db.execute(
        select(Appointment)
        .where(Appointment.doctor_id == doctor.id)
    ).scalars().all()

    today_appts = [
    a for a in total
    if a.start_time.date() == today
    and a.status == AppointmentStatus.scheduled  # ← add karo
]

    return {
        "doctor_name": doctor.name,
        "specialty": doctor.specialty,
        "total_appointments": len(total),
        "today_appointments": len(today_appts),
        "completed": len([a for a in total if a.status == AppointmentStatus.completed]),
        "no_shows": len([a for a in total if a.status == AppointmentStatus.no_show]),
    }