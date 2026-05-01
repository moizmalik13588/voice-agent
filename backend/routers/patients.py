from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from database import get_db
from models import Appointment, AppointmentStatus, Doctor
from auth import get_hospital

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("/")
def list_patients(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    # Unique patients with their stats
    results = db.execute(
        select(
            Appointment.patient_name,
            Appointment.patient_phone,
            func.count(Appointment.id).label("total_visits"),
            func.max(Appointment.start_time).label("last_visit"),
            func.min(Appointment.start_time).label("first_visit"),
        )
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status != AppointmentStatus.canceled)
        .group_by(Appointment.patient_name, Appointment.patient_phone)
        .order_by(func.max(Appointment.start_time).desc())
    ).all()

    patients = []
    for r in results:
        # Most visited doctor
        doctor_result = db.execute(
            select(Doctor.name, func.count(Appointment.id).label("visits"))
            .join(Doctor, Appointment.doctor_id == Doctor.id)
            .where(Appointment.hospital_id == hospital.id)
            .where(Appointment.patient_name == r.patient_name)
            .where(Appointment.status != AppointmentStatus.canceled)
            .group_by(Doctor.name)
            .order_by(func.count(Appointment.id).desc())
        ).first()

        patients.append({
            "name": r.patient_name,
            "phone": r.patient_phone,
            "total_visits": r.total_visits,
            "last_visit": r.last_visit,
            "first_visit": r.first_visit,
            "preferred_doctor": doctor_result.name if doctor_result else None,
        })

    return patients


@router.get("/{patient_name}/history")
def patient_history(
    patient_name: str,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    appointments = db.execute(
        select(Appointment)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.patient_name == patient_name)
        .order_by(Appointment.start_time.desc())
    ).scalars().all()

    return [
        {
            "id": a.id,
            "doctor_name": a.doctor.name,
            "reason": a.reason,
            "start_time": a.start_time,
            "status": a.status,
        }
        for a in appointments
    ]