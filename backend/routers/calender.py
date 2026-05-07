import datetime as dt
import json
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, Column, Integer, String, Text, ForeignKey
from database import get_db, Base
from models import Appointment, Doctor
from sqlalchemy import update
from auth import get_hospital
import os
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

_flows = {}

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

router = APIRouter(prefix="/calendar", tags=["Google Calendar"])

SCOPES = ["https://www.googleapis.com/auth/calendar"]
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/calendar/callback")


# ─── Google Token Model ───────────────────────────────
class GoogleToken(Base):
    __tablename__ = "google_tokens"
    id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), unique=True)
    token_data = Column(Text, nullable=False)  # JSON stored


# ─── Helper ───────────────────────────────────────────
def get_flow():
    if not _flows.get(CLIENT_ID):
        _flows[CLIENT_ID] = Flow.from_client_config(
            {
                "web": {
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    return _flows[CLIENT_ID]
def get_credentials(hospital_id: int, db: Session):
    token = db.execute(
        select(GoogleToken).where(GoogleToken.hospital_id == hospital_id)
    ).scalars().first()

    if not token:
        return None

    data = json.loads(token.token_data)
    creds = Credentials(
        token=data.get("token"),
        refresh_token=data.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        scopes=SCOPES,
    )
    return creds


def save_credentials(hospital_id: int, creds: Credentials, db: Session):
    token_data = json.dumps({
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes) if creds.scopes else [],
    })

    existing = db.execute(
        select(GoogleToken).where(GoogleToken.hospital_id == hospital_id)
    ).scalars().first()

    if existing:
        existing.token_data = token_data
    else:
        db.add(GoogleToken(hospital_id=hospital_id, token_data=token_data))

    db.commit()


# ─── Endpoints ────────────────────────────────────────

@router.get("/auth")
def google_auth(hospital=Depends(get_hospital)):
    flow = get_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        state=str(hospital.id),
        prompt="consent",
    )
    # Flow save karo state ke saath
    _flows[state] = flow
    return {"auth_url": auth_url}


@router.get("/callback")
def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    try:
        # Same flow use karo
        flow = _flows.get(state)
        if not flow:
            # Naya flow banao fallback ke liye
            flow = get_flow()
        
        os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
        flow.fetch_token(code=code)
        creds = flow.credentials
        hospital_id = int(state)
        save_credentials(hospital_id, creds, db)
        
        # Cleanup
        _flows.pop(state, None)
        
        return RedirectResponse(
        url="http://localhost:5173/settings?calendar=connected"
    )
    except Exception as e:
        print(f"[Calendar Error] {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    

@router.get("/status")
def calendar_status(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    """Calendar connected hai ya nahi"""
    creds = get_credentials(hospital.id, db)
    return {"connected": creds is not None}


from sqlalchemy import text # Top par ye add karein

from sqlalchemy import text

@router.post("/sync/{appointment_id}")
def sync_appointment(
    appointment_id: int, 
    db: Session = Depends(get_db), 
    hospital=Depends(get_hospital)
):
    creds = get_credentials(hospital.id, db)
    if not creds:
        raise HTTPException(status_code=401, detail="Google Calendar not connected")

    # 1. Direct fetch
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id, 
        Appointment.hospital_id == hospital.id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    try:
        # 2. Google Calendar Event Create
        service = build("calendar", "v3", credentials=creds)
        event = _create_calendar_event(appointment, hospital.name)
        created = service.events().insert(calendarId="primary", body=event).execute()

        new_id = created.get("id")
        
        # 3. 🔥 THE FIX: Direct assignment with Flush & Commit
        appointment.google_event_id = new_id
        db.add(appointment)
        db.flush()  # Pehle database ko changes bhejo
        db.commit() # Phir permanent save karo
        db.refresh(appointment) # Database se wapas confirm karo
        
        print(f"DEBUG: Saved ID {new_id} for Appt {appointment_id}")

        return {
            "message": "Added to Google Calendar!",
            "event_id": appointment.google_event_id,
            "event_link": created.get("htmlLink"),
        }
    except Exception as e:
        db.rollback()
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sync-all")
def sync_all_appointments(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    """Sab upcoming appointments sync karo"""
    creds = get_credentials(hospital.id, db)
    if not creds:
        raise HTTPException(status_code=401, detail="Google Calendar not connected")

    now = dt.datetime.now()
    appointments = db.execute(
        select(Appointment)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.status == "scheduled")
        .where(Appointment.start_time >= now)
        .order_by(Appointment.start_time.asc())
    ).scalars().all()

    service = build("calendar", "v3", credentials=creds)
    synced = 0
    failed = 0

    for appt in appointments:
        try:
            event = _create_calendar_event(appt, hospital.name)
            service.events().insert(calendarId="primary", body=event).execute()
            synced += 1
        except:
            failed += 1

    return {
        "message": f"Synced {synced} appointments!",
        "synced": synced,
        "failed": failed,
    }


@router.delete("/disconnect")
def disconnect_calendar(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    token = db.execute(
        select(GoogleToken).where(GoogleToken.hospital_id == hospital.id)
    ).scalars().first()

    if token:
        db.delete(token)
        db.commit()

    return {"message": "Google Calendar disconnected"}


# ─── Helper ───────────────────────────────────────────
def _create_calendar_event(appointment: Appointment, hospital_name: str) -> dict:
    start = appointment.start_time
    end = appointment.end_time
    
    import pytz
    pkt = pytz.timezone("Asia/Karachi")
    if start.tzinfo is None:
        start = pkt.localize(start)
        end = pkt.localize(end)
    return {
         "summary": f"Appointment - {appointment.patient_name}",
        "description": (
            f"Patient: {appointment.patient_name}\n"
            f"Phone: {appointment.patient_phone or 'N/A'}\n"
            f"Doctor: {appointment.doctor.name}\n"
            f"Reason: {appointment.reason or 'General consultation'}\n"
            f"Hospital: {hospital_name}"
        ),
        "start": {
            "dateTime": start.isoformat(),
            "timeZone": "Asia/Karachi",
        },
        "end": {
            "dateTime": end.isoformat(),
            "timeZone": "Asia/Karachi",
        },
        "colorId": "1",
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 60},
                {"method": "popup", "minutes": 30},
            ],
        },
    }

# Yeh function Calendar.py mein niche add karein
def delete_calendar_event(appointment_id: int, hospital_id: int, db: Session):
    """Google Calendar se event delete karne ke liye helper"""
    creds = get_credentials(hospital_id, db)
    if not creds:
        return  # Calendar connected nahi hai toh kuch nahi karna

    appointment = db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    ).scalars().first()

    # Agar appointment mil jaye aur uske paas google_event_id ho
    if appointment and appointment.google_event_id:
        try:
            service = build("calendar", "v3", credentials=creds)
            service.events().delete(
                calendarId="primary", 
                eventId=appointment.google_event_id
            ).execute()
            print(f"[Calendar] Event {appointment.google_event_id} deleted successfully.")
        except Exception as e:
            print(f"[Calendar Error] Could not delete event: {e}")