import datetime as dt
import json
import re
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db
from models import Appointment, AppointmentStatus, Doctor, DoctorAvailability
from auth import get_hospital
from services.whatsapp import send_appointment_confirmation, send_appointment_cancellation
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from routers.notifications import create_notification


router = APIRouter(prefix="/appointments", tags=["Appointments"])


# ─── Schemas ──────────────────────────────────────────
class AppointmentCreateRequest(BaseModel):
    doctor_id: int
    patient_name: str
    patient_phone: str | None = None
    patient_email: str | None = None
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
    doctor_id: int | None = None


def _clean_doctor_name(name: str) -> str:
    return re.sub(r'^[Dd]r\.?\s*', '', name).strip()


# ─── Endpoints ────────────────────────────────────────

@router.get("/available-slots")
def get_available_slots(
    doctor_id: int,
    date: dt.date,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    doctor = _get_doctor_or_404(doctor_id, hospital.id, db)
    day_of_week = date.weekday()
    availability = db.execute(
        select(DoctorAvailability)
        .where(DoctorAvailability.doctor_id == doctor_id)
        .where(DoctorAvailability.day_of_week == day_of_week)
    ).scalars().first()

    if not availability:
        raise HTTPException(status_code=404, detail=f"Dr. {doctor.name} is not available on this day")

    all_slots = _generate_slots(date, availability)
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
    .where(Appointment.status == AppointmentStatus.scheduled)  # ← add karo
    .where(Appointment.start_time >= dt.datetime.combine(dt.date.today(), dt.time.min))
    .where(Appointment.start_time < dt.datetime.combine(dt.date.today(), dt.time.min) + dt.timedelta(days=1))
).scalar()

    return {
        "total_completed": total_completed,
        "total_canceled": total_canceled,
        "total_today": total_today,
    }


@router.get("/all-scheduled")
def get_all_scheduled(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    appointments = db.execute(
        select(Appointment)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.scheduled)
        .order_by(Appointment.start_time.desc())
    ).scalars().all()
    return [_format_appointment(a, a.doctor.name) for a in appointments]


# ─── Book Appointment ─────────────────────────────────
@router.post("/", response_model=AppointmentResponse)
def book_appointment(
    request: AppointmentCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    doctor = _get_doctor_or_404(request.doctor_id, hospital.id, db)
    _check_slot_available(request.doctor_id, request.start_time, db)

    day_of_week = request.start_time.weekday()
    availability = db.execute(
        select(DoctorAvailability)
        .where(DoctorAvailability.doctor_id == request.doctor_id)
        .where(DoctorAvailability.day_of_week == day_of_week)
    ).scalars().first()

    if not availability:
        raise HTTPException(status_code=400, detail=f"Dr. {doctor.name} is not available on this day")

    end_time = request.start_time + dt.timedelta(minutes=availability.slot_duration_minutes)

    appointment = Appointment(
        hospital_id=hospital.id,
        doctor_id=request.doctor_id,
        patient_name=request.patient_name,
        patient_phone=request.patient_phone,
        patient_email=request.patient_email,
        reason=request.reason,
        start_time=request.start_time,
        end_time=end_time,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    # ✅ Email
    if request.patient_email:
        from services.email import send_appointment_confirmation_email
        background_tasks.add_task(
            send_appointment_confirmation_email,
            patient_email=request.patient_email,
            patient_name=request.patient_name,
            doctor_name=_clean_doctor_name(doctor.name),
            appointment_time=appointment.start_time.strftime("%A, %B %d at %I:%M %p"),
            hospital_name=hospital.name,
            appointment_id=appointment.id,
        )

    # ✅ SMS
    if request.patient_phone:
        from services.sms import send_appointment_confirmation_sms
        send_appointment_confirmation_sms(
            patient_name=request.patient_name,
            phone=request.patient_phone,
            doctor_name=_clean_doctor_name(doctor.name),
            appointment_time=appointment.start_time.strftime("%A, %B %d at %I:%M %p"),
            hospital_name=hospital.name,
            appointment_id=appointment.id,
        )

    # ✅ WhatsApp
    if appointment.patient_phone:
        try:
            send_appointment_confirmation(
                patient_name=appointment.patient_name,
                phone=appointment.patient_phone,
                doctor_name=_clean_doctor_name(doctor.name),
                appointment_time=appointment.start_time.strftime("%A, %B %d at %I:%M %p")
            )
        except Exception as e:
            print(f"[WhatsApp] Failed: {e}")

    # ✅ Notification
    create_notification(
        hospital_id=hospital.id,
        message=f"New appointment — {request.patient_name} with Dr. {_clean_doctor_name(doctor.name)} on {appointment.start_time.strftime('%b %d at %I:%M %p')}",
        type="success",
        db=db
    )


    # ✅ Google Calendar — lazy import
    try:
        from routers.calender import GoogleToken, _create_calendar_event, CLIENT_ID, CLIENT_SECRET, SCOPES
        token = db.execute(
            select(GoogleToken).where(GoogleToken.hospital_id == hospital.id)
        ).scalars().first()

        if token:
            data = json.loads(token.token_data)
            creds = Credentials(
                token=data.get("token"),
                refresh_token=data.get("refresh_token"),
                token_uri="https://oauth2.googleapis.com/token",
                client_id=CLIENT_ID,
                client_secret=CLIENT_SECRET,
                scopes=SCOPES,
            )
            service = build("calendar", "v3", credentials=creds)
            event_body = _create_calendar_event(appointment, hospital.name)
            
            # 🔥 FIX: Result ko variable mein lein aur save karein
            created_event = service.events().insert(calendarId="primary", body=event_body).execute()
            
            # Database update
            appointment.google_event_id = created_event.get("id")
            db.add(appointment)
            db.commit() # Save the ID to Neon
            
            print(f"[Calendar] Synced and Saved ID {appointment.google_event_id} for appointment {appointment.id}")
            
    except Exception as e:
        db.rollback()
        print(f"[Calendar] Sync skipped or failed: {e}")
        

    return _format_appointment(appointment, doctor.name)


# ─── List Appointments ────────────────────────────────
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
    return [_format_appointment(a, a.doctor.name) for a in appointments]


# ─── Cancel Appointment ───────────────────────────────
@router.patch("/{appointment_id}/cancel")
def cancel_appointment(
    appointment_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    appointment = _get_appointment_or_404(appointment_id, hospital.id, db)
    appointment.status = AppointmentStatus.canceled
    
    # ─── GOOGLE CALENDAR DELETION (Yahan add karein) ───────────────
    if appointment.google_event_id:
        from routers.calender import delete_calendar_event
        # Background task mein daalna behtar hai taake API fast rahay
        background_tasks.add_task(
            delete_calendar_event, 
            appointment_id=appointment.id, 
            hospital_id=hospital.id, 
            db=db
        )
    # ──────────────────────────────────────────────────────────────

    db.commit()

    # ✅ Email
    if appointment.patient_email:
        from services.email import send_appointment_cancellation_email
        background_tasks.add_task(
            send_appointment_cancellation_email,
            patient_email=appointment.patient_email,
            patient_name=appointment.patient_name,
            doctor_name=_clean_doctor_name(appointment.doctor.name),
            appointment_time=appointment.start_time.strftime("%A, %B %d at %I:%M %p"),
            hospital_name=hospital.name,
        )

    # ✅ SMS
    if appointment.patient_phone:
        from services.sms import send_appointment_cancellation_sms
        background_tasks.add_task(
            send_appointment_cancellation_sms,
            patient_name=appointment.patient_name,
            phone=appointment.patient_phone,
            doctor_name=_clean_doctor_name(appointment.doctor.name),
            appointment_time=appointment.start_time.strftime("%A, %B %d at %I:%M %p"),
        )

    # ✅ WhatsApp
    if appointment.patient_phone:
        try:
            send_appointment_cancellation(
                patient_name=appointment.patient_name,
                phone=appointment.patient_phone,
                doctor_name=_clean_doctor_name(appointment.doctor.name),
                appointment_time=appointment.start_time.strftime("%A, %B %d at %I:%M %p")
            )
        except Exception as e:
            print(f"[WhatsApp] Failed: {e}")

    # ✅ Notification
    create_notification(
        hospital_id=hospital.id,
        message=f"Appointment canceled — {appointment.patient_name} with Dr. {_clean_doctor_name(appointment.doctor.name)}",
        type="warning",
        db=db
    )

    return {"message": "Appointment canceled successfully and calendar updated"}

# ─── Reschedule ───────────────────────────────────────
@router.patch("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: int,
    request: RescheduleRequest,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    appointment = _get_appointment_or_404(appointment_id, hospital.id, db)
    _check_slot_available(appointment.doctor_id, request.new_start_time, db, exclude_id=appointment_id)

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


# ─── Status Update ────────────────────────────────────
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

    if status == AppointmentStatus.no_show:
        create_notification(
            hospital_id=hospital.id,
            message=f"No-show — {appointment.patient_name} missed appointment with Dr. {_clean_doctor_name(appointment.doctor.name)}",
            type="warning",
            db=db
        )

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