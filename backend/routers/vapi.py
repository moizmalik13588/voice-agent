import datetime as dt
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db
from models import Appointment, AppointmentStatus, Doctor, DoctorAvailability, Hospital

router = APIRouter(prefix="/vapi", tags=["VAPI"])


# ─── VAPI Request/Response Format ─────────────────────
class VapiToolCallRequest(BaseModel):
    message: dict


# ─── Helper: Hospital by api_key ──────────────────────
def get_hospital_by_key(api_key: str, db: Session) -> Hospital:
    hospital = db.execute(
        select(Hospital)
        .where(Hospital.api_key == api_key)
        .where(Hospital.is_active == True)
    ).scalars().first()
    if not hospital:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return hospital


# ─── Time Parser Helper ───────────────────────────────
def _parse_start_time(date_str: str, time_str: str) -> dt.datetime:
    """
    Multiple formats handle karta hai:
    - "10:00" → 10:00 AM
    - "16:00" → 4:00 PM
    - "4 PM"  → 4:00 PM
    - "4:00 PM" → 4:00 PM
    - "10 AM" → 10:00 AM
    """
    time_str = time_str.strip()
    
    formats = [
        "%Y-%m-%d %H:%M",      # "2026-05-05 16:00"
        "%Y-%m-%d %I:%M %p",   # "2026-05-05 4:00 PM"
        "%Y-%m-%d %I %p",      # "2026-05-05 4 PM"
        "%Y-%m-%d %I:%M%p",    # "2026-05-05 4:00PM"
        "%Y-%m-%d %I%p",       # "2026-05-05 4PM"
    ]
    
    for fmt in formats:
        try:
            return dt.datetime.strptime(f"{date_str} {time_str}", fmt)
        except ValueError:
            continue
    
    raise ValueError(f"Cannot parse time: '{time_str}'. Expected formats: '10:00', '4 PM', '4:00 PM'")


# ─── Main VAPI Webhook ────────────────────────────────
@router.post("/webhook")
def vapi_webhook(
    payload: VapiToolCallRequest,
    db: Session = Depends(get_db),
    api_key: str = Query(...)
):
    message = payload.message
    tool_calls = message.get("toolCalls", [])

    # api_key: pehle metadata se try karo, phir URL param fallback
    metadata_key = (
        message.get("call", {})
        .get("assistantOverrides", {})
        .get("metadata", {})
        .get("api_key", "")
    )
    resolved_key = metadata_key if metadata_key else api_key
    
    hospital = get_hospital_by_key(resolved_key, db)

    results = []

    for tool_call in tool_calls:
        tool_name = tool_call.get("function", {}).get("name")
        args = tool_call.get("function", {}).get("arguments", {})
        tool_call_id = tool_call.get("id")

        print(f"[VAPI] Tool: {tool_name} | Args: {args}")  # Debug log

        try:
            if tool_name == "check_available_slots":
                result = handle_check_slots(args, hospital, db)

            elif tool_name == "book_appointment":
                result = handle_book_appointment(args, hospital, db)

            elif tool_name == "cancel_appointment":
                result = handle_cancel_appointment(args, hospital, db)

            elif tool_name == "list_patient_appointments":
                result = handle_list_patient_appointments(args, hospital, db)

            else:
                result = {"error": f"Unknown tool: {tool_name}"}

        except Exception as e:
            print(f"[VAPI ERROR] Tool: {tool_name} | Error: {str(e)}")
            result = {"error": str(e)}

        results.append({
            "toolCallId": tool_call_id,
            "result": result
        })

    return {"results": results}


# ─── Tool Handlers ────────────────────────────────────

def handle_check_slots(args: dict, hospital: Hospital, db: Session) -> dict:
    doctor_name = args.get("doctor_name")
    date_str = args.get("date")

    date = dt.date.fromisoformat(date_str)
    day_of_week = date.weekday()

    doctor = db.execute(
        select(Doctor)
        .where(Doctor.hospital_id == hospital.id)
        .where(Doctor.name.ilike(f"%{doctor_name}%"))
        .where(Doctor.is_active == True)
    ).scalars().first()

    if not doctor:
        return {"message": f"Sorry, no doctor found with name '{doctor_name}'. Please check the name and try again."}

    availability = db.execute(
        select(DoctorAvailability)
        .where(DoctorAvailability.doctor_id == doctor.id)
        .where(DoctorAvailability.day_of_week == day_of_week)
    ).scalars().first()

    if not availability:
        return {"message": f"Dr. {doctor.name} is not available on {date.strftime('%A, %B %d')}. Please choose another day."}

    all_slots = _generate_slots(date, availability)

    booked = db.execute(
        select(Appointment.start_time)
        .where(Appointment.doctor_id == doctor.id)
        .where(Appointment.status == AppointmentStatus.scheduled)
        .where(Appointment.start_time >= dt.datetime.combine(date, dt.time.min))
        .where(Appointment.start_time < dt.datetime.combine(date, dt.time.min) + dt.timedelta(days=1))
    ).scalars().all()

    booked_times = {b.replace(tzinfo=None) for b in booked}
    available = [s for s in all_slots if s not in booked_times]

    if not available:
        return {"message": f"Dr. {doctor.name} has no available slots on {date.strftime('%A, %B %d')}. All slots are booked."}

    slot_list = ", ".join([s.strftime("%I:%M %p") for s in available[:6]])
    return {
        "message": f"Dr. {doctor.name} has the following slots available on {date.strftime('%A, %B %d')}: {slot_list}. Which time works for you?"
    }


def handle_book_appointment(args: dict, hospital: Hospital, db: Session) -> dict:
    doctor_name = args.get("doctor_name")
    patient_name = args.get("patient_name")
    patient_phone = args.get("patient_phone")
    date_str = args.get("date")
    time_str = args.get("time")
    reason = args.get("reason", "General consultation")

    # ✅ Robust time parsing
    try:
        start_time = _parse_start_time(date_str, time_str)
    except ValueError as e:
        return {"message": f"I couldn't understand the time '{time_str}'. Please say something like '10 AM' or '4 PM'."}

    doctor = db.execute(
        select(Doctor)
        .where(Doctor.hospital_id == hospital.id)
        .where(Doctor.name.ilike(f"%{doctor_name}%"))
        .where(Doctor.is_active == True)
    ).scalars().first()

    if not doctor:
        return {"message": f"Sorry, I couldn't find Dr. {doctor_name} in our system."}

    existing = db.execute(
        select(Appointment)
        .where(Appointment.doctor_id == doctor.id)
        .where(Appointment.start_time == start_time)
        .where(Appointment.status == AppointmentStatus.scheduled)
    ).scalars().first()

    if existing:
        return {"message": f"Sorry, the {time_str} slot with Dr. {doctor.name} is already booked. Please choose another time."}

    availability = db.execute(
        select(DoctorAvailability)
        .where(DoctorAvailability.doctor_id == doctor.id)
        .where(DoctorAvailability.day_of_week == start_time.weekday())
    ).scalars().first()

    if not availability:
        return {"message": f"Dr. {doctor.name} is not available on this day."}

    end_time = start_time + dt.timedelta(minutes=availability.slot_duration_minutes)

    appointment = Appointment(
        hospital_id=hospital.id,
        doctor_id=doctor.id,
        patient_name=patient_name,
        patient_phone=patient_phone,
        reason=reason,
        start_time=start_time,
        end_time=end_time,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return {
        "message": f"Your appointment has been booked successfully! Dr. {doctor.name} on {start_time.strftime('%A, %B %d')} at {start_time.strftime('%I:%M %p')}. Your appointment ID is {appointment.id}. Is there anything else I can help you with?"
    }


def handle_cancel_appointment(args: dict, hospital: Hospital, db: Session) -> dict:
    patient_name = args.get("patient_name")
    date_str = args.get("date")

    date = dt.date.fromisoformat(date_str)
    start_dt = dt.datetime.combine(date, dt.time.min)
    end_dt = start_dt + dt.timedelta(days=1)

    appointments = db.execute(
        select(Appointment)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.patient_name.ilike(f"%{patient_name}%"))
        .where(Appointment.start_time >= start_dt)
        .where(Appointment.start_time < end_dt)
        .where(Appointment.status == AppointmentStatus.scheduled)
    ).scalars().all()

    if not appointments:
        return {"message": f"I couldn't find any appointment for {patient_name} on {date.strftime('%A, %B %d')}. Please double check the name or date."}

    # ✅ Multiple patients match hone par cancel mat karo
    if len(appointments) > 1:
        names = ", ".join(set([a.patient_name for a in appointments]))
        return {"message": f"I found multiple appointments matching '{patient_name}'. Could you please confirm your full exact name? I found: {names}"}

    # ✅ Sirf ek match — safely cancel karo
    appt = appointments[0]
    appt.status = AppointmentStatus.canceled
    db.commit()

    return {
        "message": f"Your appointment on {date.strftime('%A, %B %d')} with Dr. {appt.doctor.name} has been successfully canceled. Is there anything else I can help you with?"
    }

def handle_list_patient_appointments(args: dict, hospital: Hospital, db: Session) -> dict:
    patient_name = args.get("patient_name")
    now = dt.datetime.now()

    appointments = db.execute(
        select(Appointment)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.patient_name.ilike(f"%{patient_name}%"))
        .where(Appointment.status == AppointmentStatus.scheduled)
        .where(Appointment.start_time >= now)
        .order_by(Appointment.start_time.asc())
    ).scalars().all()

    if not appointments:
        return {"message": f"I don't see any upcoming appointments for {patient_name}."}

    appt_list = ", ".join([
        f"Dr. {a.doctor.name} on {a.start_time.strftime('%A %B %d at %I:%M %p')}"
        for a in appointments
    ])

    return {"message": f"Here are the upcoming appointments for {patient_name}: {appt_list}. Is there anything else I can help you with?"}


# ─── Helper ───────────────────────────────────────────
def _generate_slots(date: dt.date, availability: DoctorAvailability) -> list[dt.datetime]:
    slots = []
    current = dt.datetime.combine(date, availability.start_time)
    end = dt.datetime.combine(date, availability.end_time)
    while current < end:
        slots.append(current)
        current += dt.timedelta(minutes=availability.slot_duration_minutes)
    return slots