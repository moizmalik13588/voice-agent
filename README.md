# MediBook — AI-Powered Hospital Management SaaS

<div align="center">

![MediBook Banner](https://img.shields.io/badge/MediBook-Hospital%20SaaS-1565c0?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xOSAzSDVhMiAyIDAgMCAwLTIgMnYxNGEyIDIgMCAwIDAgMiAyaDE0YTIgMiAwIDAgMCAyLTJWNWEyIDIgMCAwIDAtMi0yem0tNyA0aDJ2M2gzdjJoLTN2M2gtMnYtM0g5di0yaDF6Ii8+PC9zdmc+)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-medibook--gules.vercel.app-success?style=for-the-badge)](https://medibook-gules.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Railway-blueviolet?style=for-the-badge)](https://voice-agent-production.up.railway.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**MediBook** is a production-grade, AI-powered Hospital Management SaaS platform that automates patient calls, appointment booking, reminders, and revenue tracking — 24/7, without a human receptionist.

[Live Demo](https://medibook-gules.vercel.app) · [Backend API](https://voice-agent-production.up.railway.app/docs) · [Report Bug](https://github.com/moizmalik13588/voice-agent/issues)

</div>

---

## 🎯 What is MediBook?

MediBook is a complete hospital CRM + AI voice assistant platform built for Pakistani hospitals and clinics. When a patient calls, our AI voice agent **Alex** answers 24/7, books appointments, sends WhatsApp/SMS/Email confirmations, and syncs everything to Google Calendar — all automatically.

---

## ✨ Key Features

### 🤖 AI Voice Agent
- **Alex** — English AI voice assistant powered by VAPI
- 24/7 automated call handling on real phone number (+1 662 238 0044)
- Caller recognition — returning patients greeted by name
- Natural conversation with booking, cancellation, and slot checking

### 📅 Appointment Management
- Real-time slot availability per doctor
- Book, cancel, and reschedule appointments
- Doctor availability schedule (days + time slots)
- Duplicate appointment prevention
- Confirm modal for all destructive actions

### 📱 Multi-Channel Notifications

| Channel | Trigger |
|---------|---------|
| WhatsApp | Booking confirmation, 1-hour reminder, cancellation |
| SMS | Booking confirmation, cancellation |
| Email | Booking confirmation, cancellation |
| In-App | Real-time notification bell |

### 📊 Analytics & CRM
- Live dashboard with charts (weekly trend, busy hours, status breakdown)
- Patient retention rate
- Popular doctors by appointments
- Completion & no-show rates
- Monthly appointment trends

### 💰 Revenue Tracking
- Revenue per doctor (based on consultation fee)
- Monthly revenue trend
- Lost revenue from cancellations
- **Stripe payment integration** for online collection

### 👥 Patient CRM
- Patient profiles with full visit history
- Doctor preferences tracking
- Medical notes (diagnosis, medication, allergy, general)
- Last visit date & returning patient detection

### 🔔 Engagement Automation
- **Auto Recall** — WhatsApp messages to patients inactive for 30/60/90 days
- **No-Show Prediction** — Risk scoring (High/Medium/Low) based on history
- Upcoming risky appointments flagged automatically

### 🔗 Integrations
- Google Calendar sync (auto-add appointments)
- Stripe payments (sandbox + production ready)
- Twilio WhatsApp & SMS
- Gmail SMTP for emails
- VAPI for AI voice calls

### 👨‍⚕️ Multi-Doctor Portal
- Separate doctor login (`/doctor/login`)
- Doctor-specific appointment dashboard
- Mark appointments as done/no-show
- Mobile-responsive doctor interface

### 🏥 Multi-Tenant SaaS
- Each hospital has isolated data
- API key-based authentication
- Hospital registration & management
- Subscription plan support

---

## 🛠️ Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Python FastAPI** | REST API server |
| **PostgreSQL (Neon)** | Cloud database |
| **SQLAlchemy** | ORM |
| **Railway** | Backend deployment |
| **VAPI** | AI voice agent |
| **Twilio** | WhatsApp + SMS |
| **Stripe** | Payment processing |
| **Google Calendar API** | Calendar sync |
| **APScheduler** | Background jobs |
| **FastAPI-Mail** | Email notifications |
| **Passlib + PyJWT** | Doctor authentication |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18 + Vite** | UI framework |
| **Tailwind CSS v3** | Styling |
| **Recharts** | Dashboard charts |
| **Axios** | API communication |
| **React Router v6** | Navigation |
| **React Hot Toast** | Notifications |
| **Lucide React** | Icons |
| **Vercel** | Frontend deployment |

---

## 📁 Project Structure

```
voice-agent/
├── backend/
│   ├── main.py                    # FastAPI app + lifespan
│   ├── database.py                # SQLAlchemy setup
│   ├── models.py                  # All DB models
│   ├── auth.py                    # API key authentication
│   ├── routers/
│   │   ├── hospitals.py           # Hospital registration + auth
│   │   ├── doctors.py             # Doctor CRUD + availability
│   │   ├── appointments.py        # Booking + cancel + reschedule
│   │   ├── patients.py            # Patient list + history
│   │   ├── vapi.py                # VAPI webhook + tool handlers
│   │   ├── call_logs.py           # VAPI call logs
│   │   ├── analytics.py           # Charts + retention + busy hours
│   │   ├── revenue.py             # Revenue tracking
│   │   ├── recall.py              # Auto recall automation
│   │   ├── noshow.py              # No-show prediction
│   │   ├── medical.py             # Medical history + notes
│   │   ├── payments.py            # Stripe integration
│   │   ├── calendar.py            # Google Calendar sync
│   │   ├── doctor_auth.py         # Doctor login + JWT
│   │   └── notifications.py       # In-app notifications
│   └── services/
│       ├── whatsapp.py            # Twilio WhatsApp
│       ├── sms.py                 # Twilio SMS
│       ├── email.py               # Gmail SMTP
│       └── scheduler.py           # APScheduler jobs
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Doctors.jsx
        │   ├── Appointments.jsx
        │   ├── Patients.jsx
        │   ├── CallLogs.jsx
        │   ├── Analytics.jsx
        │   ├── Revenue.jsx
        │   ├── Recall.jsx
        │   ├── NoShow.jsx
        │   ├── Medical.jsx
        │   ├── Payments.jsx
        │   ├── Settings.jsx
        │   ├── DoctorLogin.jsx
        │   └── DoctorDashboard.jsx
        ├── components/
        │   ├── Layout.jsx
        │   └── ConfirmModal.jsx
        ├── api/
        │   └── axios.js
        └── store/
            └── auth.js
```

---

## 🗄️ Database Schema

```
hospitals
└── doctors (many)
    └── doctor_availability (many)
└── appointments (many)
└── patient_notes (via patient_name)
└── google_tokens
└── payments
└── notifications
```

---

## 🚀 Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or Neon account)

### Backend Setup

```bash
# Clone repo
git clone https://github.com/moizmalik13588/voice-agent.git
cd voice-agent/backend

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Fill in your credentials

# Run backend
uvicorn main:app --reload --port 8000
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# VAPI
VAPI_API_KEY=your_vapi_key

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SMS_FROM=+1xxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx

# Google Calendar
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
GOOGLE_REDIRECT_URI=http://localhost:8000/calendar/callback

# Email
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=app_password_here
MAIL_FROM=your@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587

# Auth
SECRET_KEY=your-secret-key
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Run frontend
npm run dev
```

---

## 🔄 AI Voice Flow

```
Patient calls +1 (662) 238 0044
        ↓
VAPI AI Agent (Alex) picks up
        ↓
identify_caller → check if returning patient
        ↓
Patient states request (book / cancel / check)
        ↓
Alex calls appropriate tool:
├── check_available_slots
├── book_appointment ──→ DB saved
│                    ──→ WhatsApp sent
│                    ──→ SMS sent
│                    ──→ Email sent
│                    ──→ Google Calendar synced
├── cancel_appointment
└── list_patient_appointments
        ↓
Dashboard updates in real-time
        ↓
APScheduler: 1-hour reminder sent automatically
```

---

## ☁️ Deployment

### Backend → Railway
```
Root Directory:  backend
Build Command:   pip install -r requirements.txt
Start Command:   uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend → Vercel
```
Root Directory:   frontend
Framework:        Vite
Build Command:    npm run build
Output Directory: dist
Environment:      VITE_API_URL=https://your-railway-url.up.railway.app
```

---

## 🔒 Security
- API key authentication per hospital (multi-tenant isolation)
- JWT tokens for doctor portal
- Password hashing with SHA-256
- CORS configured for production domains
- Environment variables for all secrets

---

## 📸 Screenshots

| Dashboard | Appointments | Call Logs |
|-----------|-------------|-----------|
| Live stats + charts | Book/cancel/reschedule | VAPI call transcripts |

| Analytics | Revenue | Doctor Portal |
|-----------|---------|---------------|
| Retention + trends | Stripe payments | Doctor-specific view |

---

## 🤝 Contact

**Moiz Malik** — Final Year BSCS Student, SMIU Karachi

[![GitHub](https://img.shields.io/badge/GitHub-moizmalik13588-181717?style=flat&logo=github)](https://github.com/moizmalik13588)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Moiz%20Malik-0077B5?style=flat&logo=linkedin)](https://linkedin.com/in/moizmalik)

---

<div align="center">
Built with ❤️ in Karachi, Pakistan 🇵🇰
</div>
