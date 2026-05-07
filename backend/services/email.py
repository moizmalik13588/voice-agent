import os
import resend # Naya SDK
from pydantic import EmailStr
import datetime as dt

# Resend API Key set karein
# Railway variables mein MAIL_PASSWORD mein 're_...' wali key honi chahiye
resend.api_key = os.getenv("MAIL_PASSWORD")

async def send_appointment_confirmation_email(
    patient_email: str,
    patient_name: str,
    doctor_name: str,
    appointment_time: str,
    hospital_name: str,
    appointment_id: int,
):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1565c0; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Appointment Confirmed</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <p style="color: #475569; font-size: 16px;">Hello <strong>{patient_name}</strong>,</p>
            <p style="color: #475569;">Your appointment has been successfully booked!</p>
            
            <div style="background: white; border-radius: 10px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 8px 0; color: #0f172a;"><strong>👨‍⚕️ Doctor:</strong> Dr. {doctor_name}</p>
                <p style="margin: 8px 0; color: #0f172a;"><strong>📅 Time:</strong> {appointment_time}</p>
                <p style="margin: 8px 0; color: #0f172a;"><strong>🏥 Hospital:</strong> {hospital_name}</p>
                <p style="margin: 8px 0; color: #0f172a;"><strong>🔖 Appointment ID:</strong> #{appointment_id}</p>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">Please arrive 10 minutes early.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                MediBook — Smart Hospital Management
            </p>
        </div>
    </div>
    """
    
    try:
        params = {
            "from": os.getenv("MAIL_FROM", "onboarding@resend.dev"),
            "to": patient_email,
            "subject": f"✅ Appointment Confirmed — Dr. {doctor_name}",
            "html": html,
        }
        resend.Emails.send(params)
    except Exception as e:
        print(f"Resend Error (Confirmation): {e}")


async def send_appointment_cancellation_email(
    patient_email: str,
    patient_name: str,
    doctor_name: str,
    appointment_time: str,
    hospital_name: str,
):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc2626; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">❌ Appointment Canceled</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <p style="color: #475569;">Hello <strong>{patient_name}</strong>,</p>
            <p style="color: #475569;">Your appointment has been canceled.</p>
            
            <div style="background: white; border-radius: 10px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 8px 0; color: #0f172a;"><strong>👨‍⚕️ Doctor:</strong> Dr. {doctor_name}</p>
                <p style="margin: 8px 0; color: #0f172a;"><strong>📅 Time:</strong> {appointment_time}</p>
                <p style="margin: 8px 0; color: #0f172a;"><strong>🏥 Hospital:</strong> {hospital_name}</p>
            </div>
            
            <p style="color: #475569;">To rebook, please call us or use our AI assistant.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                MediBook — Smart Hospital Management
            </p>
        </div>
    </div>
    """
    
    try:
        params = {
            "from": os.getenv("MAIL_FROM", "onboarding@resend.dev"),
            "to": patient_email,
            "subject": f"❌ Appointment Canceled — Dr. {doctor_name}",
            "html": html,
        }
        resend.Emails.send(params)
    except Exception as e:
        print(f"Resend Error (Cancellation): {e}")


async def send_appointment_reminder_email(
    patient_email: str,
    patient_name: str,
    doctor_name: str,
    appointment_time: str,
    hospital_name: str,
):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #d97706; padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Appointment Reminder</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
            <p style="color: #475569;">Hello <strong>{patient_name}</strong>,</p>
            <p style="color: #475569;">Your appointment is <strong>tomorrow</strong>!</p>
            
            <div style="background: white; border-radius: 10px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 8px 0; color: #0f172a;"><strong>👨‍⚕️ Doctor:</strong> Dr. {doctor_name}</p>
                <p style="margin: 8px 0; color: #0f172a;"><strong>📅 Time:</strong> {appointment_time}</p>
                <p style="margin: 8px 0; color: #0f172a;"><strong>🏥 Hospital:</strong> {hospital_name}</p>
            </div>
            
            <p style="color: #475569;">Please arrive 10 minutes early. See you tomorrow!</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                MediBook — Smart Hospital Management
            </p>
        </div>
    </div>
    """
    
    try:
        params = {
            "from": os.getenv("MAIL_FROM", "onboarding@resend.dev"),
            "to": patient_email,
            "subject": f"⏰ Reminder: Appointment tomorrow — Dr. {doctor_name}",
            "html": html,
        }
        resend.Emails.send(params)
    except Exception as e:
        print(f"Resend Error (Reminder): {e}")