import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["Feedback"])

class FeedbackRequest(BaseModel):
    subject: str
    message: str

@router.post("/send")
def send_feedback(data: FeedbackRequest):
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")

    if not webhook_url:
        raise HTTPException(status_code=500, detail="Webhook URL not configured on server")

    # Construct a rich embed card for Discord
    payload = {
        "username": "Creator Tools Bot",
        "avatar_url": "https://cdn-icons-png.flaticon.com/512/4712/4712109.png",
        "embeds": [
            {
                "title": f"💡 {data.subject or 'New Feature Request'}",
                "description": data.message,
                "color": 3135093,  # Mint/Green accent
                "footer": {"text": "Submitted via Creator Tools App"}
            }
        ]
    }

    res = requests.post(webhook_url, json=payload)

    if res.status_code not in (200, 204):
        raise HTTPException(status_code=500, detail="Failed to dispatch feedback to Discord")

    return {"status": "success", "message": "Feedback sent successfully"}