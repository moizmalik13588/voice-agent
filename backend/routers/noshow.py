import datetime as dt
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.sql.expression import case as sa_case
from database import get_db
from models import Appointment, AppointmentStatus, Doctor
from auth import get_hospital

router = APIRouter(prefix="/noshow", tags=["No-Show Prediction"])


@router.get("/risk-patients")
def get_risk_patients(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    results = db.execute(
        select(
            Appointment.patient_name,
            Appointment.patient_phone,
            func.count(Appointment.id).label("total"),
            func.sum(
                sa_case((Appointment.status == AppointmentStatus.no_show, 1), else_=0)
            ).label("no_shows"),
            func.sum(
                sa_case((Appointment.status == AppointmentStatus.canceled, 1), else_=0)
            ).label("cancellations"),
        )
        .where(Appointment.hospital_id == hospital.id)
        .group_by(Appointment.patient_name, Appointment.patient_phone)
        .having(
            func.sum(
                sa_case((Appointment.status == AppointmentStatus.no_show, 1), else_=0)
            ) > 0
        )
        .order_by(
            func.sum(
                sa_case((Appointment.status == AppointmentStatus.no_show, 1), else_=0)
            ).desc()
        )
    ).all()

    patients = []
    for r in results:
        no_show_rate = round((r.no_shows / r.total) * 100, 1) if r.total > 0 else 0
        if no_show_rate >= 60:
            risk = "high"
        elif no_show_rate >= 30:
            risk = "medium"
        else:
            risk = "low"

        patients.append({
            "name": r.patient_name,
            "phone": r.patient_phone,
            "total_appointments": r.total,
            "no_shows": r.no_shows,
            "cancellations": r.cancellations,
            "no_show_rate": no_show_rate,
            "risk_level": risk,
        })

    return patients


@router.get("/upcoming-risky")
def upcoming_risky_appointments(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    now = dt.datetime.now()
    next_week = now + dt.timedelta(days=7)

    upcoming = db.execute(
        select(Appointment, Doctor.name.label("doctor_name"))
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.scheduled)
        .where(Appointment.start_time >= now)
        .where(Appointment.start_time <= next_week)
        .order_by(Appointment.start_time.asc())
    ).all()

    risky = []
    for appt in upcoming:
        history = db.execute(
            select(
                func.count(Appointment.id).label("total"),
                func.sum(
                    sa_case((Appointment.status == AppointmentStatus.no_show, 1), else_=0)
                ).label("no_shows")
            )
            .where(Appointment.hospital_id == hospital.id)
            .where(Appointment.patient_name == appt.Appointment.patient_name)
        ).first()

        total = history.total or 0
        no_shows = history.no_shows or 0
        no_show_rate = round((no_shows / total) * 100, 1) if total > 0 else 0

        if no_show_rate >= 30 or no_shows >= 1:
            risk = "high" if no_show_rate >= 60 else "medium"
            risky.append({
                "appointment_id": appt.Appointment.id,
                "patient_name": appt.Appointment.patient_name,
                "patient_phone": appt.Appointment.patient_phone,
                "doctor_name": appt.doctor_name,
                "start_time": appt.Appointment.start_time,
                "no_show_rate": no_show_rate,
                "past_no_shows": no_shows,
                "risk_level": risk,
            })

    return risky


@router.get("/stats")
def noshow_stats(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    total = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
    ).scalar()

    no_shows = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.no_show)
    ).scalar()

    high_risk_results = db.execute(
        select(
            Appointment.patient_name,
            func.sum(
                sa_case((Appointment.status == AppointmentStatus.no_show, 1), else_=0)
            ).label("no_show_count")
        )
        .where(Appointment.hospital_id == hospital.id)
        .group_by(Appointment.patient_name)
        .having(
            func.sum(
                sa_case((Appointment.status == AppointmentStatus.no_show, 1), else_=0)
            ) >= 2
        )
    ).all()

    return {
        "total_appointments": total,
        "total_no_shows": no_shows,
        "no_show_rate": round((no_shows / total * 100), 1) if total > 0 else 0,
        "high_risk_patients": len(high_risk_results),
    }