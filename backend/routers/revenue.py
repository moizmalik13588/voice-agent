import datetime as dt
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from database import get_db
from models import Appointment, AppointmentStatus, Doctor
from auth import get_hospital

router = APIRouter(prefix="/revenue", tags=["Revenue"])

# Default consultation fee per specialty
SPECIALTY_FEES = {
    "General Physician": 500,
    "Cardiology": 2000,        # ← Cardiology add karo
    "Cardiologist": 2000,
    "Dermatology": 1500,
    "Dermatologist": 1500,
    "Neurology": 2500,
    "Neurologist": 2500,
    "Orthopedic": 2000,
    "Pediatrics": 1000,
    "Pediatrician": 1000,
    "Gynecology": 1500,
    "Gynecologist": 1500,
    "ENT": 1200,
    "Ophthalmology": 1500,
    "Ophthalmologist": 1500,
    "Psychiatry": 2000,
    "Psychiatrist": 2000,
    "default": 1000,
}



@router.get("/overview")
def revenue_overview(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    now = dt.datetime.now()
    month_start = dt.datetime(now.year, now.month, 1)

    # ✅ DB se consultation_fee lo
    completed = db.execute(
        select(Appointment, Doctor.consultation_fee)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.completed)
    ).all()

    total_revenue = sum(r.consultation_fee for r in completed)

    this_month = db.execute(
        select(Appointment, Doctor.consultation_fee)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.completed)
        .where(Appointment.start_time >= month_start)
    ).all()
    this_month_revenue = sum(r.consultation_fee for r in this_month)

    # Last month
    if now.month == 1:
        last_month_start = dt.datetime(now.year - 1, 12, 1)
        last_month_end = dt.datetime(now.year, 1, 1)
    else:
        last_month_start = dt.datetime(now.year, now.month - 1, 1)
        last_month_end = month_start

    last_month = db.execute(
        select(Appointment, Doctor.consultation_fee)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.completed)
        .where(Appointment.start_time >= last_month_start)
        .where(Appointment.start_time < last_month_end)
    ).all()
    last_month_revenue = sum(r.consultation_fee for r in last_month)

    # Growth
    growth = 0
    if last_month_revenue > 0:
        growth = round(((this_month_revenue - last_month_revenue) / last_month_revenue) * 100, 1)

    # Lost revenue
    canceled = db.execute(
        select(Appointment, Doctor.consultation_fee)
        .join(Doctor, Appointment.doctor_id == Doctor.id)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.canceled)
    ).all()
    lost_revenue = sum(r.consultation_fee for r in canceled)

    # Completion rate
    total = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
    ).scalar()

    no_show = db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.no_show)
    ).scalar()

    unique_patients = db.execute(
        select(func.count(func.distinct(Appointment.patient_name)))
        .where(Appointment.hospital_id == hospital.id)
    ).scalar()

    return {
        "total_revenue": total_revenue,
        "this_month_revenue": this_month_revenue,
        "last_month_revenue": last_month_revenue,
        "growth_percent": growth,
        "lost_revenue": lost_revenue,
        "currency": "PKR",
    }

@router.get("/by-doctor")
def revenue_by_doctor(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
    results = db.execute(
        select(
            Doctor.name,
            Doctor.specialty,
            Doctor.consultation_fee,  # ← yeh add hai?
            func.count(Appointment.id).label("completed")
        )
        .join(Appointment, Appointment.doctor_id == Doctor.id)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == AppointmentStatus.completed)
        .group_by(Doctor.id, Doctor.name, Doctor.specialty, Doctor.consultation_fee)  # ← yeh bhi
        .order_by(func.count(Appointment.id).desc())
    ).all()

    return [
        {
            "name": r.name,
            "specialty": r.specialty,
            "completed": r.completed,
            "revenue": r.completed * r.consultation_fee,
            "fee_per_visit": r.consultation_fee,
        }
        for r in results
    ]


@router.get("/monthly")
def monthly_revenue(db: Session = Depends(get_db), hospital=Depends(get_hospital)):
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
        end = dt.datetime(year, month + 1, 1) if month < 12 else dt.datetime(year + 1, 1, 1)

        completed = db.execute(
            select(Appointment, Doctor.consultation_fee)
            .join(Doctor, Appointment.doctor_id == Doctor.id)
            .where(Appointment.hospital_id == hospital.id)
            .where(Appointment.status == AppointmentStatus.completed)
            .where(Appointment.start_time >= start)
            .where(Appointment.start_time < end)
        ).all()

        revenue = sum(r.consultation_fee for r in completed)

        result.append({
            "month": start.strftime("%b %Y"),
            "revenue": revenue,
            "appointments": len(completed),
        })

    return result