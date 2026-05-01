import datetime as dt
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db
from models import Appointment, AppointmentStatus, Doctor, DoctorAvailability
from auth import get_hospital

router = APIRouter(prefix="/appointments", tags=["Appointments"])


# ─── Schemas ──────────────────────────────────────────
class AppointmentCreateRequest(BaseModel):
    doctor_id: int
    patient_name: str
    patient_phone: str | None = None
    reason: str | None = None
    start_time: dt.datetime

class AppointmentResponse(BaseModel):
    id: int
    doctor_id: int
    doctor_name: str
    patient_name: str
    patient_phone: str | None
    reason: str | None
    start_time: dt.datetime
    end_time: dt.datetime
    status: AppointmentStatus

class RescheduleRequest(BaseModel):
    new_start_time: dt.datetime

class ListAppointmentsRequest(BaseModel):
    date: dt.date
    doctor_id: int | None = None  # optional filter


# ─── Endpoints ────────────────────────────────────────

# Get available slots
@router.get("/available-slots")
def get_available_slots(
    doctor_id: int,
    date: dt.date,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    doctor = _get_doctor_or_404(doctor_id, hospital.id, db)

    # Doctor us din available hai?
    day_of_week = date.weekday()  # 0=Mon, 6=Sun
    availability = db.execute(
        select(DoctorAvailability)
        .where(DoctorAvailability.doctor_id == doctor_id)
        .where(DoctorAvailability.day_of_week == day_of_week)
    ).scalars().first()

    if not availability:
        raise HTTPException(
            status_code=404,
            detail=f"Dr. {doctor.name} is not available on this day"
        )

    # Sare slots generate karo
    all_slots = _generate_slots(date, availability)

    # Already booked slots nikalo
    booked = db.execute(
        select(Appointment.start_time)
        .where(Appointment.doctor_id == doctor_id)
        .where(Appointment.status == AppointmentStatus.scheduled)
        .where(Appointment.start_time >= dt.datetime.combine(date, dt.time.min))
        .where(Appointment.start_time < dt.datetime.combine(date, dt.time.min) + dt.timedelta(days=1))
    ).scalars().all()

    booked_times = {b.replace(tzinfo=None) for b in booked}

    available = [s for s in all_slots if s not in booked_times]

    return {
        "doctor": doctor.name,
        "date": str(date),
        "slot_duration_minutes": availability.slot_duration_minutes,
        "available_slots": [s.strftime("%H:%M") for s in available]
    }
@router.get("/stats")
def get_appointment_stats(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    from sqlalchemy import func
    
    total_completed = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.completed)
    ).scalar()

    total_canceled = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.canceled)
    ).scalar()

    total_today = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.start_time >= dt.datetime.combine(dt.date.today(), dt.time.min))
        .where(Appointment.start_time < dt.datetime.combine(dt.date.today(), dt.time.min) + dt.timedelta(days=1))
    ).scalar()

    return {
        "total_completed": total_completed,
        "total_canceled": total_canceled,
        "total_today": total_today,
    }

# Book appointment
@router.post("/", response_model=AppointmentResponse)
def book_appointment(
    request: AppointmentCreateRequest,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    doctor = _get_doctor_or_404(request.doctor_id, hospital.id, db)

    # Slot available hai?
    _check_slot_available(request.doctor_id, request.start_time, db)

    # Doctor ki availability check karo us din
    day_of_week = request.start_time.weekday()
    availability = db.execute(
        select(DoctorAvailability)
        .where(DoctorAvailability.doctor_id == request.doctor_id)
        .where(DoctorAvailability.day_of_week == day_of_week)
    ).scalars().first()

    if not availability:
        raise HTTPException(
            status_code=400,
            detail=f"Dr. {doctor.name} is not available on this day"
        )

    end_time = request.start_time + dt.timedelta(minutes=availability.slot_duration_minutes)

    appointment = Appointment(
        hospital_id=hospital.id,
        doctor_id=request.doctor_id,
        patient_name=request.patient_name,
        patient_phone=request.patient_phone,
        reason=request.reason,
        start_time=request.start_time,
        end_time=end_time,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return _format_appointment(appointment, doctor.name)


# List appointments
@router.post("/list", response_model=list[AppointmentResponse])
def list_appointments(
    request: ListAppointmentsRequest,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    start_dt = dt.datetime.combine(request.date, dt.time.min)
    end_dt = start_dt + dt.timedelta(days=1)

    query = (
        select(Appointment)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.scheduled)
        .where(Appointment.start_time >= start_dt)
        .where(Appointment.start_time < end_dt)
        .order_by(Appointment.start_time.asc())
    )

    if request.doctor_id:
        query = query.where(Appointment.doctor_id == request.doctor_id)

    appointments = db.execute(query).scalars().all()

    return [
        _format_appointment(a, a.doctor.name)
        for a in appointments
    ]


# Cancel appointment
@router.patch("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    appointment = _get_appointment_or_404(appointment_id, hospital.id, db)
    appointment.status = AppointmentStatus.canceled
    db.commit()
    return {"message": "Appointment canceled successfully"}


# Reschedule appointment
@router.patch("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: int,
    request: RescheduleRequest,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    appointment = _get_appointment_or_404(appointment_id, hospital.id, db)

    # New slot available hai?
    _check_slot_available(appointment.doctor_id, request.new_start_time, db, exclude_id=appointment_id)

    # Slot duration
    availability = db.execute(
        select(DoctorAvailability)
        .where(DoctorAvailability.doctor_id == appointment.doctor_id)
        .where(DoctorAvailability.day_of_week == request.new_start_time.weekday())
    ).scalars().first()

    if not availability:
        raise HTTPException(status_code=400, detail="Doctor not available on this day")

    appointment.start_time = request.new_start_time
    appointment.end_time = request.new_start_time + dt.timedelta(minutes=availability.slot_duration_minutes)
    db.commit()
    db.refresh(appointment)

    return _format_appointment(appointment, appointment.doctor.name)


# Mark completed / no_show (for dashboard)
@router.patch("/{appointment_id}/status")
def update_status(
    appointment_id: int,
    status: AppointmentStatus,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    appointment = _get_appointment_or_404(appointment_id, hospital.id, db)
    appointment.status = status
    db.commit()
    return {"message": f"Status updated to {status}"}


# ─── Private Helpers ──────────────────────────────────
def _get_doctor_or_404(doctor_id: int, hospital_id: int, db: Session) -> Doctor:
    doctor = db.execute(
        select(Doctor)
        .where(Doctor.id == doctor_id)
        .where(Doctor.hospital_id == hospital_id)
        .where(Doctor.is_active == True)
    ).scalars().first()

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


def _get_appointment_or_404(appointment_id: int, hospital_id: int, db: Session) -> Appointment:
    appointment = db.execute(
        select(Appointment)
        .where(Appointment.id == appointment_id)
        .where(Appointment.hospital_id == hospital_id)
        .where(Appointment.status == AppointmentStatus.scheduled)
    ).scalars().first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found or already canceled")
    return appointment


def _check_slot_available(doctor_id: int, start_time: dt.datetime, db: Session, exclude_id: int = None):
    query = (
        select(Appointment)
        .where(Appointment.doctor_id == doctor_id)
        .where(Appointment.start_time == start_time)
        .where(Appointment.status == AppointmentStatus.scheduled)
    )
    if exclude_id:
        query = query.where(Appointment.id != exclude_id)

    existing = db.execute(query).scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="This slot is already booked")


def _generate_slots(date: dt.date, availability: DoctorAvailability) -> list[dt.datetime]:
    slots = []
    current = dt.datetime.combine(date, availability.start_time)
    end = dt.datetime.combine(date, availability.end_time)

    while current < end:
        slots.append(current)
        current += dt.timedelta(minutes=availability.slot_duration_minutes)

    return slots


def _format_appointment(appointment: Appointment, doctor_name: str) -> dict:
    return {
        "id": appointment.id,
        "doctor_id": appointment.doctor_id,
        "doctor_name": doctor_name,
        "patient_name": appointment.patient_name,
        "patient_phone": appointment.patient_phone,
        "reason": appointment.reason,
        "start_time": appointment.start_time,
        "end_time": appointment.end_time,
        "status": appointment.status,
    }


