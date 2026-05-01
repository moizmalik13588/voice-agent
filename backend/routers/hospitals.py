from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from database import get_db
from models import Hospital, SubscriptionPlan
from auth import get_hospital

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


# ─── Schemas ──────────────────────────────────────────
class HospitalRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None

class HospitalResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    api_key: str
    subscription_plan: SubscriptionPlan
    is_active: bool

    class Config:
        from_attributes = True


# ─── Endpoints ────────────────────────────────────────

# Register new hospital (public)
@router.post("/register", response_model=HospitalResponse)
def register_hospital(request: HospitalRegisterRequest, db: Session = Depends(get_db)):
    # Check duplicate email
    existing = db.execute(
        select(Hospital).where(Hospital.email == request.email)
    ).scalars().first()

    if existing:
        raise HTTPException(status_code=409, detail="Hospital with this email already exists")

    hospital = Hospital(
        name=request.name,
        email=request.email,
        phone=request.phone,
    )
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return hospital


# Get own hospital info (protected)
@router.get("/me", response_model=HospitalResponse)
def get_my_hospital(hospital: Hospital = Depends(get_hospital)):
    return hospital