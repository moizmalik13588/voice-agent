import datetime as dt
from models import Notification
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, Column, Integer, String, Boolean, ForeignKey, DateTime
from database import get_db, Base
from auth import get_hospital

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ─── Helper ───────────────────────────────────────────
def create_notification(hospital_id: int, message: str, type: str, db: Session):
    """Doosre routers se call kar sakte hain"""
    notif = Notification(
        hospital_id=hospital_id,
        message=message,
        type=type,
    )
    db.add(notif)
    db.commit()


# ─── Endpoints ────────────────────────────────────────

@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    notifs = db.execute(
        select(Notification)
        .where(Notification.hospital_id == hospital.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
    ).scalars().all()

    return [
        {
            "id": n.id,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in notifs
    ]


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    notifs = db.execute(
        select(Notification)
        .where(Notification.hospital_id == hospital.id)
        .where(Notification.is_read == False)
    ).scalars().all()
    return {"count": len(notifs)}


@router.patch("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    notifs = db.execute(
        select(Notification)
        .where(Notification.hospital_id == hospital.id)
        .where(Notification.is_read == False)
    ).scalars().all()
    for n in notifs:
        n.is_read = True
    db.commit()
    return {"message": "All marked as read"}


@router.patch("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    notif = db.execute(
        select(Notification)
        .where(Notification.id == notif_id)
        .where(Notification.hospital_id == hospital.id)
    ).scalars().first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}


@router.delete("/clear")
def clear_all(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    notifs = db.execute(
        select(Notification)
        .where(Notification.hospital_id == hospital.id)
    ).scalars().all()
    for n in notifs:
        db.delete(n)
    db.commit()
    return {"message": "All cleared"}