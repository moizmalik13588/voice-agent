import datetime as dt
import secrets
from sqlalchemy import (
    Boolean, Column, DateTime, Integer, 
    String, ForeignKey, Time, Enum
)
from sqlalchemy.orm import relationship
import enum
from database import Base


# ─── Enums ───────────────────────────────────────────
class SubscriptionPlan(str, enum.Enum):
    free = "free"
    pro = "pro"

class AppointmentStatus(str, enum.Enum):
    scheduled = "scheduled"
    canceled = "canceled"
    completed = "completed"
    no_show = "no_show"

class SlotDuration(int, enum.Enum):
    fifteen = 15
    thirty = 30
    sixty = 60


# ─── Hospital ─────────────────────────────────────────
class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    api_key = Column(String, unique=True, index=True, default=lambda: secrets.token_hex(32))
    subscription_plan = Column(Enum(SubscriptionPlan), default=SubscriptionPlan.free)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: dt.datetime.now(dt.timezone.utc))

    doctors = relationship("Doctor", back_populates="hospital")
    appointments = relationship("Appointment", back_populates="hospital")


# ─── Doctor ───────────────────────────────────────────
class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    consultation_fee = Column(Integer, default=1000)
    is_active = Column(Boolean, default=True)
    # ── New fields ──
    login_email = Column(String, unique=True, nullable=True, index=True)
    login_password = Column(String, nullable=True)  # hashed
    created_at = Column(DateTime, default=lambda: dt.datetime.now(dt.timezone.utc))

    hospital = relationship("Hospital", back_populates="doctors")
    availability = relationship("DoctorAvailability", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")

# ─── Doctor Availability ──────────────────────────────
class DoctorAvailability(Base):
    __tablename__ = "doctor_availability"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon, 6=Sun
    start_time = Column(Time, nullable=False)       # e.g. 09:00
    end_time = Column(Time, nullable=False)         # e.g. 17:00
    slot_duration_minutes = Column(Integer, default=30)

    doctor = relationship("Doctor", back_populates="availability")


# ─── Appointment ──────────────────────────────────────
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    patient_name = Column(String, nullable=False, index=True)
    patient_phone = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    patient_email = Column(String, nullable=True)
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.scheduled)
    created_at = Column(DateTime, default=lambda: dt.datetime.now(dt.timezone.utc))

    hospital = relationship("Hospital", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")


class PatientNote(Base):
    __tablename__ = "patient_notes"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    patient_name = Column(String, nullable=False, index=True)
    note = Column(String, nullable=False)
    note_type = Column(String, default="general")  # general, diagnosis, medication, allergy
    created_by = Column(String, nullable=True)  # doctor name
    created_at = Column(DateTime, default=lambda: dt.datetime.now(dt.timezone.utc))

    hospital = relationship("Hospital", backref="patient_notes")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    message = Column(String, nullable=False)
    type = Column(String, default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=dt.datetime.now)