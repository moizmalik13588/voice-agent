import datetime as dt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, Column, Integer, String, DateTime, ForeignKey, Boolean
from pydantic import BaseModel
from database import get_db, Base
from models import Appointment, AppointmentStatus, Doctor
from auth import get_hospital
import stripe
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter(prefix="/payments", tags=["Payments"])


# ─── Payment Model ────────────────────────────────────
class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    patient_name = Column(String, nullable=False)
    amount = Column(Integer, nullable=False)  # PKR
    stripe_session_id = Column(String, nullable=True)
    stripe_payment_intent = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, paid, failed
    created_at = Column(DateTime, default=lambda: dt.datetime.now(dt.timezone.utc))


# ─── Schemas ──────────────────────────────────────────
class CreatePaymentRequest(BaseModel):
    appointment_id: int
    success_url: str = "http://localhost:5173/appointments?payment=success"
    cancel_url: str = "http://localhost:5173/appointments?payment=canceled"


# ─── Endpoints ────────────────────────────────────────

@router.post("/create-session")
def create_payment_session(
    request: CreatePaymentRequest,
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    # Appointment fetch karo
    appointment = db.execute(
        select(Appointment)
        .where(Appointment.id == request.appointment_id)
        .where(Appointment.hospital_id == hospital.id)
    ).scalars().first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Doctor fee fetch karo
    doctor = db.execute(
        select(Doctor)
        .where(Doctor.id == appointment.doctor_id)
    ).scalars().first()

    amount_pkr = doctor.consultation_fee if doctor else 1000

    # Stripe session banao
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "pkr",
                    "product_data": {
                        "name": f"Consultation - {doctor.name}",
                        "description": f"Appointment on {appointment.start_time.strftime('%B %d, %Y at %I:%M %p')}",
                    },
                    "unit_amount": amount_pkr * 100,  # Stripe paisa mein chahiye
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=request.success_url + "&session_id={CHECKOUT_SESSION_ID}",
            cancel_url=request.cancel_url,
            metadata={
                "appointment_id": str(appointment.id),
                "hospital_id": str(hospital.id),
                "patient_name": appointment.patient_name,
            }
        )

        # Payment record save karo
        payment = Payment(
            hospital_id=hospital.id,
            appointment_id=appointment.id,
            patient_name=appointment.patient_name,
            amount=amount_pkr,
            stripe_session_id=session.id,
            status="pending",
        )
        db.add(payment)
        db.commit()

        return {
            "session_id": session.id,
            "checkout_url": session.url,
            "amount": amount_pkr,
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: dict, db: Session = Depends(get_db)):
    """Stripe webhook — payment confirm hone pe"""
    event_type = request.get("type")

    if event_type == "checkout.session.completed":
        session = request.get("data", {}).get("object", {})
        session_id = session.get("id")

        payment = db.execute(
            select(Payment).where(Payment.stripe_session_id == session_id)
        ).scalars().first()

        if payment:
            payment.status = "paid"
            payment.stripe_payment_intent = session.get("payment_intent")

            # Appointment complete mark karo
            appointment = db.execute(
                select(Appointment).where(Appointment.id == payment.appointment_id)
            ).scalars().first()
            if appointment:
                appointment.status = AppointmentStatus.completed

            db.commit()

    return {"received": True}


@router.get("/")
def list_payments(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    payments = db.execute(
        select(Payment)
        .where(Payment.hospital_id == hospital.id)
        .order_by(Payment.created_at.desc())
    ).scalars().all()

    return [
        {
            "id": p.id,
            "appointment_id": p.appointment_id,
            "patient_name": p.patient_name,
            "amount": p.amount,
            "status": p.status,
            "created_at": p.created_at,
        }
        for p in payments
    ]


@router.get("/stats")
def payment_stats(
    db: Session = Depends(get_db),
    hospital=Depends(get_hospital)
):
    all_payments = db.execute(
        select(Payment)
        .where(Payment.hospital_id == hospital.id)
    ).scalars().all()

    paid = [p for p in all_payments if p.status == "paid"]
    pending = [p for p in all_payments if p.status == "pending"]
    failed = [p for p in all_payments if p.status == "failed"]

    return {
        "total_collected": sum(p.amount for p in paid),
        "total_pending": sum(p.amount for p in pending),
        "paid_count": len(paid),
        "pending_count": len(pending),
        "failed_count": len(failed),
    }