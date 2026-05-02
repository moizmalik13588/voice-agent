import datetime as dt
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Appointment, AppointmentStatus
from services.whatsapp import send_appointment_reminder

scheduler = BackgroundScheduler()

def schedule_reminder(appointment_id: int, remind_at: dt.datetime):
    scheduler.add_job(
        func=_send_reminder,
        trigger=DateTrigger(run_date=remind_at),
        args=[appointment_id],
        id=f"reminder_{appointment_id}",
        replace_existing=True
    )
    print(f"[Scheduler] Reminder scheduled for appointment {appointment_id} at {remind_at}")

def _send_reminder(appointment_id: int):
    db: Session = SessionLocal()
    try:
        from sqlalchemy import select
        from models import Appointment
        
        appointment = db.execute(
            select(Appointment).where(Appointment.id == appointment_id)
        ).scalars().first()

        if not appointment:
            return
        if appointment.status != AppointmentStatus.scheduled:
            return
        if not appointment.patient_phone:
            return

        send_appointment_reminder(
            patient_name=appointment.patient_name,
            phone=appointment.patient_phone,
            doctor_name=appointment.doctor.name,
            appointment_time=appointment.start_time.strftime("%A, %B %d at %I:%M %p")
        )
        print(f"[Scheduler] Reminder sent for appointment {appointment_id}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        print("[Scheduler] Started!")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()