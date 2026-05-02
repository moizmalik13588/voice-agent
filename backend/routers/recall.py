import datetime as dt
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from database import get_db
from models import Appointment, AppointmentStatus
from auth import get_hospital
from services.whatsapp import send_whatsapp

router = APIRouter(prefix="/recall", tags=["Auto Recall"])


def get_inactive_patients(hospital_id: int, days: int, db: Session):
    """Patients jo X days se nahi aaye"""
    cutoff = dt.datetime.now() - dt.timedelta(days=days)

    # Latest appointment per patient
    latest = db.execute(
        select(
            Appointment.patient_name,
            Appointment.patient_phone,
            func.max(Appointment.start_time).label("last_visit"),
        )
        .where(Appointment.hospital_id == hospital_id)
        .where(Appointment.status != AppointmentStatus.canceled)
        .group_by(Appointment.patient_name, Appointment.patient_phone)
        .having(func.max(Appointment.start_time) < cutoff)
        .order_by(func.max(Appointment.start_time).asc())
    ).all()

    return latest


@router.get("/inactive-patients")
def list_inactive_patients(
    days: int = 90,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    patients = get_inactive_patients(hospital.id, days, db)
    
    return [
        {
            "name": r.patient_name,
            "phone": r.patient_phone,
            "last_visit": r.last_visit,
            "days_inactive": (dt.datetime.now() - r.last_visit).days,
        }
        for r in patients
    ]


@router.post("/send-bulk")
def send_bulk_recall(
    background_tasks: BackgroundTasks,
    days: int = 90,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    patients = get_inactive_patients(hospital.id, days, db)
    patients_with_phone = [p for p in patients if p.patient_phone]

    if not patients_with_phone:
        return {"message": "No patients to recall", "sent": 0}

    # Background mein send karo
    background_tasks.add_task(
        _send_recall_messages,
        patients_with_phone,
        hospital.name
    )

    return {
        "message": f"Sending recall messages to {len(patients_with_phone)} patients",
        "sent": len(patients_with_phone),
        "skipped": len(patients) - len(patients_with_phone),
    }


@router.post("/send-single/{patient_name}")
def send_single_recall(
    patient_name: str,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    patient = db.execute(
        select(
            Appointment.patient_name,
            Appointment.patient_phone,
            func.max(Appointment.start_time).label("last_visit"),
        )
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.patient_name == patient_name)
        .where(Appointment.status != AppointmentStatus.canceled)
        .group_by(Appointment.patient_name, Appointment.patient_phone)
    ).first()

    if not patient:
        return {"message": "Patient not found"}
    if not patient.patient_phone:
        return {"message": "No phone number for this patient"}

    success = _send_recall_message(
        name=patient.patient_name,
        phone=patient.patient_phone,
        last_visit=patient.last_visit,
        hospital_name=hospital.name
    )

    return {
        "message": "Recall sent!" if success else "Failed to send",
        "success": success
    }


def _send_recall_messages(patients, hospital_name: str):
    for p in patients:
        _send_recall_message(
            name=p.patient_name,
            phone=p.patient_phone,
            last_visit=p.last_visit,
            hospital_name=hospital_name
        )


def _send_recall_message(name: str, phone: str, last_visit, hospital_name: str) -> bool:
    days_ago = (dt.datetime.now() - last_visit).days
    last_visit_str = last_visit.strftime("%B %d, %Y")

    message = f"""👋 *{hospital_name}*

Hello {name}!

We noticed your last visit was *{days_ago} days ago* ({last_visit_str}).

Your health is our priority! 💙

📅 Book your next appointment:
- Call us anytime
- Our AI assistant is available 24/7

_Reply STOP to unsubscribe_
_MediBook - Smart Hospital Management_"""

    return send_whatsapp(phone, message)