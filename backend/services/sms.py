import os
from twilio.rest import Client

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
FROM_NUMBER = os.getenv("TWILIO_SMS_FROM")  # Twilio phone number

client = Client(ACCOUNT_SID, AUTH_TOKEN)


def format_number(phone: str) -> str:
    if not phone:
        return None
    phone = phone.strip().replace("-", "").replace(" ", "")
    if phone.startswith("0"):
        return "+92" + phone[1:]
    if not phone.startswith("+"):
        return "+" + phone
    return phone


def send_sms(to: str, message: str) -> bool:
    try:
        formatted = format_number(to)
        if not formatted:
            return False

        msg = client.messages.create(
            from_=FROM_NUMBER,
            to=formatted,
            body=message
        )
        print(f"[SMS] Sent to {formatted}: {msg.sid}")
        return True
    except Exception as e:
        print(f"[SMS ERROR] {str(e)}")
        return False


def send_appointment_confirmation_sms(
    patient_name: str,
    phone: str,
    doctor_name: str,
    appointment_time: str,
    hospital_name: str,
    appointment_id: int,
):
    message = (
        f"Appointment Confirmed! #{appointment_id}\n"
        f"Patient: {patient_name}\n"
        f"Doctor: Dr. {doctor_name}\n"
        f"Time: {appointment_time}\n"
        f"Hospital: {hospital_name}\n"
        f"Please arrive 10 mins early."
    )
    return send_sms(phone, message)


def send_appointment_reminder_sms(
    patient_name: str,
    phone: str,
    doctor_name: str,
    appointment_time: str,
):
    message = (
        f"Reminder: {patient_name}, your appointment\n"
        f"with Dr. {doctor_name} is tomorrow\n"
        f"at {appointment_time}.\n"
        f"Please arrive 10 mins early."
    )
    return send_sms(phone, message)


def send_appointment_cancellation_sms(
    patient_name: str,
    phone: str,
    doctor_name: str,
    appointment_time: str,
):
    message = (
        f"Appointment Canceled\n"
        f"Patient: {patient_name}\n"
        f"Doctor: Dr. {doctor_name}\n"
        f"Time: {appointment_time}\n"
        f"To rebook call us or use AI assistant."
    )
    return send_sms(phone, message)