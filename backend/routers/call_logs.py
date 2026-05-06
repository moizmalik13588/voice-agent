from fastapi import APIRouter, Depends, Query
from auth import get_hospital
import httpx
import os

router = APIRouter(prefix="/call-logs", tags=["Call Logs"])

@router.get("/")
async def get_call_logs(
    limit: int = Query(50),
    hospital=Depends(get_hospital)
):
    vapi_key = os.getenv("VAPI_API_KEY")
    
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.vapi.ai/call",
            headers={"Authorization": f"Bearer {vapi_key}"},
            params={"limit": limit}
        )
    
    calls = res.json()
    
    formatted = []
    for call in calls:
        # Duration fix
        duration = (
            call.get("durationSeconds") or
            call.get("duration") or
            0
        )
        # Try endedAt - startedAt calculate karo
        if not duration and call.get("startedAt") and call.get("endedAt"):
            from datetime import datetime
            try:
                start = datetime.fromisoformat(call["startedAt"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(call["endedAt"].replace("Z", "+00:00"))
                duration = round((end - start).total_seconds())
            except: duration = 0

        # Caller fix
        caller = (
            call.get("customer", {}).get("name") or
            call.get("callerName") or
            "Unknown"
        )

        # Phone fix
        phone = (
            call.get("customer", {}).get("number") or
            call.get("phoneNumber", {}).get("number") or
            "—"
        )

        formatted.append({
            "id": call.get("id"),
            "caller": caller,
            "phone": phone,
            "duration": round(duration),
            "status": call.get("status", "unknown"),
            "outcome": _get_outcome(call),
            "started_at": call.get("startedAt"),
            "ended_at": call.get("endedAt"),
            "transcript": call.get("transcript", ""),
            "recording_url": call.get("recordingUrl"),
            "cost": call.get("cost", 0),
        })
    
    return formatted

def _get_outcome(call: dict) -> str:
    transcript = (call.get("transcript") or "").lower()
    
    # Sirf tab "booked" mark karo jab actually book hua ho
    if "appointment has been booked" in transcript or "your appointment is confirmed" in transcript:
        return "appointment_booked"
    elif "cancel" in transcript and "canceled" in transcript:
        return "appointment_canceled"
    elif call.get("status") == "ended":
        return "info_provided"
    else:
        return "no_action"