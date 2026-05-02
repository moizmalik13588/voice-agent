import datetime as dt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from database import get_db
from models import PatientNote, Appointment, AppointmentStatus
from auth import get_hospital

router = APIRouter(prefix="/medical", tags=["Medical History"])


# ─── Schemas ──────────────────────────────────────────
class NoteCreateRequest(BaseModel):
    patient_name: str
    note: str
    note_type: str = "general"
    created_by: str | None = None


# ─── Endpoints ────────────────────────────────────────

# ✅ 1st — static routes pehle
@router.get("/patients")
def list_all_patients_medical(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    patients = db.execute(
        select(
            Appointment.patient_name,
            Appointment.patient_phone,
        )
        .where(Appointment.hospital_id == hospital.id)
        .distinct()
        .order_by(Appointment.patient_name.asc())
    ).all()

    result = []
    for p in patients:
        note_count = db.execute(
            select(PatientNote)
            .where(PatientNote.hospital_id == hospital.id)
            .where(PatientNote.patient_name == p.patient_name)
        ).scalars().all()

        result.append({
            "name": p.patient_name,
            "phone": p.patient_phone,
            "note_count": len(note_count),
        })

    return result


# ✅ 2nd — notes routes
@router.post("/notes")
def add_note(
    request: NoteCreateRequest,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    note = PatientNote(
        hospital_id=hospital.id,
        patient_name=request.patient_name,
        note=request.note,
        note_type=request.note_type,
        created_by=request.created_by,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"message": "Note added!", "id": note.id}


@router.delete("/notes/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    note = db.execute(
        select(PatientNote)
        .where(PatientNote.id == note_id)
        .where(PatientNote.hospital_id == hospital.id)
    ).scalars().first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"message": "Note deleted!"}


# ✅ Last — dynamic route
@router.get("/{patient_name}")
def get_patient_medical(
    patient_name: str,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    notes = db.execute(
        select(PatientNote)
        .where(PatientNote.hospital_id == hospital.id)
        .where(PatientNote.patient_name == patient_name)
        .order_by(PatientNote.created_at.desc())
    ).scalars().all()

    visits = db.execute(
        select(Appointment)
        .where(Appointment.hospital_id == hospital.id)
        .where(Appointment.patient_name == patient_name)
        .where(Appointment.status != AppointmentStatus.canceled)
        .order_by(Appointment.start_time.desc())
    ).scalars().all()

    total_visits = len([v for v in visits if v.status == AppointmentStatus.completed])
    no_shows = len([v for v in visits if v.status == AppointmentStatus.no_show])

    return {
        "patient_name": patient_name,
        "stats": {
            "total_visits": total_visits,
            "no_shows": no_shows,
            "upcoming": len([v for v in visits if v.status == AppointmentStatus.scheduled]),
        },
        "notes": [
            {
                "id": n.id,
                "note": n.note,
                "note_type": n.note_type,
                "created_by": n.created_by,
                "created_at": n.created_at,
            }
            for n in notes
        ],
        "visits": [
            {
                "id": v.id,
                "doctor_name": v.doctor.name,
                "reason": v.reason,
                "start_time": v.start_time,
                "status": v.status,
            }
            for v in visits
        ]
    }