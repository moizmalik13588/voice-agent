import os
from twilio.rest import Client

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
FROM_NUMBER = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

client = Client(ACCOUNT_SID, AUTH_TOKEN)

def send_whatsapp(to_number: str, message: str) -> bool:
    try:
        # Number format fix
        if not to_number.startswith("+"):
            # Pakistan number fix
            if to_number.startswith("0"):
                to_number = "+92" + to_number[1:]
            else:
                to_number = "+" + to_number

        msg = client.messages.create(
            from_=FROM_NUMBER,
            to=f"whatsapp:{to_number}",
            body=message
        )
        print(f"[WhatsApp] Sent to {to_number}: {msg.sid}")
        return True
    except Exception as e:
        print(f"[WhatsApp ERROR] {str(e)}")
        return False


def send_appointment_confirmation(patient_name: str, phone: str, doctor_name: str, appointment_time: str):
    message = f"""✅ *Appointment Confirmed!*

Hello {patient_name}! 

Your appointment has been booked:
👨‍⚕️ Doctor: Dr. {doctor_name}
📅 Time: {appointment_time}
🏥 Hospital: Islamabad Hospital

Reply *CANCEL* to cancel your appointment.

_MediBook - Smart Hospital Management_"""
    return send_whatsapp(phone, message)


def send_appointment_reminder(patient_name: str, phone: str, doctor_name: str, appointment_time: str):
    message = f"""⏰ *Appointment Reminder*

Hello {patient_name}!

Your appointment is in *1 hour*:
👨‍⚕️ Doctor: Dr. {doctor_name}
📅 Time: {appointment_time}
🏥 Hospital: Islamabad Hospital

Please arrive 10 minutes early.

_MediBook - Smart Hospital Management_"""
    return send_whatsapp(phone, message)


def send_appointment_cancellation(patient_name: str, phone: str, doctor_name: str, appointment_time: str):
    message = f"""❌ *Appointment Canceled*

Hello {patient_name}!

Your appointment has been canceled:
👨‍⚕️ Doctor: Dr. {doctor_name}
📅 Time: {appointment_time}

To rebook, please call us or use our AI assistant.

_MediBook - Smart Hospital Management_"""
    return send_whatsapp(phone, message)