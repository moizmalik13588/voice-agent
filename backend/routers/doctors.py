from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db
from models import Doctor, DoctorAvailability
from auth import get_hospital

router = APIRouter(prefix="/doctors", tags=["Doctors"])


# ─── Schemas ──────────────────────────────────────────
class AvailabilitySchema(BaseModel):
    day_of_week: int          # 0=Mon, 6=Sun
    start_time: str           # "09:00"
    end_time: str             # "17:00"
    slot_duration_minutes: int = 30

class DoctorCreateRequest(BaseModel):
    name: str
    specialty: str
    email: str | None = None
    phone: str | None = None
    availability: list[AvailabilitySchema] = []

class AvailabilityResponse(BaseModel):
    id: int
    day_of_week: int
    start_time: str
    end_time: str
    slot_duration_minutes: int

    class Config:
        from_attributes = True

class DoctorResponse(BaseModel):
    id: int
    name: str
    specialty: str
    email: str | None
    phone: str | None
    is_active: bool
    availability: list[AvailabilityResponse] = []

    class Config:
        from_attributes = True


# ─── Helper ───────────────────────────────────────────
def parse_time(time_str: str):
    from datetime import time
    h, m = map(int, time_str.split(":"))
    return time(h, m)


# ─── Endpoints ────────────────────────────────────────

# Add doctor
@router.post("/", response_model=DoctorResponse)
def add_doctor(
    request: DoctorCreateRequest,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    doctor = Doctor(
        hospital_id=hospital.id,
        name=request.name,
        specialty=request.specialty,
        email=request.email,
        phone=request.phone,
    )
    db.add(doctor)
    db.flush()  # id milega without commit

    for slot in request.availability:
        avail = DoctorAvailability(
            doctor_id=doctor.id,
            day_of_week=slot.day_of_week,
            start_time=parse_time(slot.start_time),
            end_time=parse_time(slot.end_time),
            slot_duration_minutes=slot.slot_duration_minutes,
        )
        db.add(avail)

    db.commit()
    db.refresh(doctor)
    return _format_doctor(doctor)


# List all doctors
@router.get("/", response_model=list[DoctorResponse])
def list_doctors(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    doctors = db.execute(
        select(Doctor)
        .where(Doctor.hospital_id == hospital.id)
        .where(Doctor.is_active == True)
    ).scalars().all()

    return [_format_doctor(d) for d in doctors]


# Get single doctor
@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    doctor = _get_doctor_or_404(doctor_id, hospital.id, db)
    return _format_doctor(doctor)


# Update doctor
@router.patch("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    request: DoctorCreateRequest,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    doctor = _get_doctor_or_404(doctor_id, hospital.id, db)

    doctor.name = request.name
    doctor.specialty = request.specialty
    doctor.email = request.email
    doctor.phone = request.phone

    # Availability replace karo
    db.execute(
        DoctorAvailability.__table__.delete()
        .where(DoctorAvailability.doctor_id == doctor.id)
    )
    for slot in request.availability:
        avail = DoctorAvailability(
            doctor_id=doctor.id,
            day_of_week=slot.day_of_week,
            start_time=parse_time(slot.start_time),
            end_time=parse_time(slot.end_time),
            slot_duration_minutes=slot.slot_duration_minutes,
        )
        db.add(avail)

    db.commit()
    db.refresh(doctor)
    return _format_doctor(doctor)


# Deactivate doctor
@router.delete("/{doctor_id}")
def deactivate_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    doctor = _get_doctor_or_404(doctor_id, hospital.id, db)
    doctor.is_active = False
    db.commit()
    return {"message": f"Dr. {doctor.name} deactivated successfully"}


# ─── Private Helpers ──────────────────────────────────
def _get_doctor_or_404(doctor_id: int, hospital_id: int, db: Session) -> Doctor:
    doctor = db.execute(
        select(Doctor)
        .where(Doctor.id == doctor_id)
        .where(Doctor.hospital_id == hospital_id)
    ).scalars().first()

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


def _format_doctor(doctor: Doctor) -> dict:
    return {
        "id": doctor.id,
        "name": doctor.name,
        "specialty": doctor.specialty,
        "email": doctor.email,
        "phone": doctor.phone,
        "is_active": doctor.is_active,
        "availability": [
            {
                "id": a.id,
                "day_of_week": a.day_of_week,
                "start_time": a.start_time.strftime("%H:%M"),
                "end_time": a.end_time.strftime("%H:%M"),
                "slot_duration_minutes": a.slot_duration_minutes,
            }
            for a in doctor.availability
        ]
    }