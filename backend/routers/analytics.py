import datetime as dt
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from database import get_db
from models import Appointment, AppointmentStatus, Doctor
from auth import get_hospital

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
def get_overview(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    
    # Total appointments all time
    total = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
    ).scalar()

    # This month
    now = dt.datetime.now()
    month_start = dt.datetime(now.year, now.month, 1)
    this_month = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.start_time >= month_start)
    ).scalar()

    # Last month
    if now.month == 1:
        last_month_start = dt.datetime(now.year - 1, 12, 1)
        last_month_end = dt.datetime(now.year, 1, 1)
    else:
        last_month_start = dt.datetime(now.year, now.month - 1, 1)
        last_month_end = month_start

    last_month = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.start_time >= last_month_start)
        .where(Appointment.start_time < last_month_end)
    ).scalar()

    # Growth %
    growth = 0
    if last_month > 0:
        growth = round(((this_month - last_month) / last_month) * 100, 1)

    # Completion rate
    completed = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.completed)
    ).scalar()

    completion_rate = round((completed / total * 100), 1) if total > 0 else 0

    # No show rate
    no_show = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.no_show)
    ).scalar()

    no_show_rate = round((no_show / total * 100), 1) if total > 0 else 0

    # Unique patients
    unique_patients = db.execute(
        select(func.count(func.distinct(Appointment.patient_name)))
        .where(Appointment.hospital_id == hospital.id)
    ).scalar()

    return {
        "total_appointments": total,
        "this_month": this_month,
        "last_month": last_month,
        "growth_percent": growth,
        "completion_rate": completion_rate,
        "no_show_rate": no_show_rate,
        "unique_patients": unique_patients,
        "total_completed": completed,
    }


@router.get("/popular-doctors")
def popular_doctors(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    results = db.execute(
        select(
            Doctor.name,
            Doctor.specialty,
            func.count(Appointment.id).label("total"),
        )
        .join(Appointment, Appointment.doctor_id == Doctor.id)
        .where(Appointment.hospital_id == hospital.id)
        .group_by(Doctor.id, Doctor.name, Doctor.specialty)
        .order_by(func.count(Appointment.id).desc())
    ).all()

    doctors_data = []
    for r in results:
        # Completed count alag query se
        completed = db.execute(
            select(func.count(Appointment.id))
            .join(Doctor, Appointment.doctor_id == Doctor.id)
            .where(Appointment.hospital_id == hospital.id)
            .where(Doctor.name == r.name)
            .where(Appointment.status == AppointmentStatus.completed)
        ).scalar()

        doctors_data.append({
            "name": r.name,
            "specialty": r.specialty,
            "total": r.total,
            "completed": completed or 0,
            "completion_rate": round((completed or 0) / r.total * 100, 1) if r.total > 0 else 0,
        })

    return doctors_data

@router.get("/busy-hours")
def busy_hours(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    appointments = db.execute(
        select(Appointment.start_time)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status != AppointmentStatus.canceled)
    ).scalars().all()

    hour_counts = {}
    for appt in appointments:
        hour = appt.hour
        hour_counts[hour] = hour_counts.get(hour, 0) + 1

    result = []
    for hour in range(8, 20):
        label = f"{hour % 12 or 12}{'AM' if hour < 12 else 'PM'}"
        result.append({
            "hour": label,
            "count": hour_counts.get(hour, 0)
        })

    return result


@router.get("/monthly-trend")
def monthly_trend(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    now = dt.datetime.now()
    result = []

    for i in range(5, -1, -1):
        if now.month - i <= 0:
            month = now.month - i + 12
            year = now.year - 1
        else:
            month = now.month - i
            year = now.year

        start = dt.datetime(year, month, 1)
        if month == 12:
            end = dt.datetime(year + 1, 1, 1)
        else:
            end = dt.datetime(year, month + 1, 1)

        count = db.execute(
            select(func.count(Appointment.id))
            .where(Appointment.hospital_id == hospital.id)
            .where(Appointment.start_time >= start)
            .where(Appointment.start_time < end)
            .where(Appointment.status != AppointmentStatus.canceled)
        ).scalar()

        result.append({
            "month": start.strftime("%b %Y"),
            "appointments": count
        })

    return result


@router.get("/retention")
def retention_rate(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    # Patients with more than 1 visit
    results = db.execute(
        select(
            Appointment.patient_name,
            func.count(Appointment.id).label("visits")
        )
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status != AppointmentStatus.canceled)
        .group_by(Appointment.patient_name)
    ).all()

    total_patients = len(results)
    returning = sum(1 for r in results if r.visits > 1)
    retention = round((returning / total_patients * 100), 1) if total_patients > 0 else 0

    # Visit distribution
    one_visit = sum(1 for r in results if r.visits == 1)
    two_visits = sum(1 for r in results if r.visits == 2)
    three_plus = sum(1 for r in results if r.visits >= 3)

    return {
        "retention_rate": retention,
        "total_patients": total_patients,
        "returning_patients": returning,
        "new_patients": one_visit,
        "visit_distribution": [
            {"label": "1 Visit", "value": one_visit},
            {"label": "2 Visits", "value": two_visits},
            {"label": "3+ Visits", "value": three_plus},
        ]
    }