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
            except:
                duration = 0

        # ✅ STATUS FIX YAHAN ADD KARO
        status = call.get("status", "unknown")

        # 0 duration = missed
        duration = round(duration)
        if duration == 0 and status == "ended":
            status = "missed"

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
            "duration": duration,
            "status": status,   # ✅ yahan bhi change
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
    
    # Check karo tool calls mein book_appointment tha?
    messages = call.get("messages", [])
    for msg in messages:
        if msg.get("role") == "tool_call":
            if "book_appointment" in str(msg):
                return "appointment_booked"
        if msg.get("role") == "tool_result":
            content = str(msg.get("content", "")).lower()
            if "booked successfully" in content or "is confirmed" in content:
                return "appointment_booked"
            if "has been canceled" in content:
                return "appointment_canceled"
    
    # Transcript fallback
    if any(phrase in transcript for phrase in [
        "you're all set", "is confirmed for", "confirmed for", "appointment with doctor"
    ]):
        return "appointment_booked"
    elif "canceled" in transcript:
        return "appointment_canceled"
    elif call.get("status") == "ended":
        return "info_provided"
    return "no_action"
   