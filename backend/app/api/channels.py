from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.channel_dispatcher import ChannelDispatcherService

router = APIRouter(prefix="/channels", tags=["Communication Channels & Dispatch"])


# ── Schemas ───────────────────────────────────────────
class SendTestRequest(BaseModel):
    channel: str = Field(..., description="Target channel: 'EMAIL', 'SMS', or 'WHATSAPP'")
    recipient: str = Field(..., description="Target email address or phone number")
    subject: Optional[str] = Field(default=None, description="Email subject or WhatsApp template title")
    message: str = Field(..., min_length=1, description="Message text content to transmit")
    language: Optional[str] = Field(default="English", description="Content language")


class DispatchCampaignRequest(BaseModel):
    campaign_id: int = Field(..., description="ID of the campaign to dispatch")
    channels: List[str] = Field(default=["EMAIL", "SMS", "WHATSAPP"], description="Target channels to send through")
    language_code: Optional[str] = Field(default=None, description="Language code (e.g., 'en', 'hi', 'kn')")
    custom_message: Optional[str] = Field(default=None, description="Optional override text to send")
    recipient_ids: Optional[List[int]] = Field(default=None, description="Optional explicit recipient IDs")


# ── Endpoints ─────────────────────────────────────────
@router.get(
    "/status",
    summary="Get channel connection status & metrics",
    description="Returns live operational status, protocols, success rates, and total dispatched counts for Email, SMS, and WhatsApp."
)
def get_channel_status(db: Session = Depends(get_db)):
    return ChannelDispatcherService.get_status(db)


@router.get(
    "/history",
    summary="Get recent communication dispatch history",
    description="Returns a real-time log of communications sent through SMS, WhatsApp, and Email."
)
def get_dispatch_history(limit: int = 30, db: Session = Depends(get_db)):
    return ChannelDispatcherService.get_history(db, limit=limit)


@router.post(
    "/send-test",
    summary="Send a test message through Email, SMS, or WhatsApp",
    description="Transmits a single communication through the requested channel and logs delivery status."
)
def send_test_message(req: SendTestRequest, db: Session = Depends(get_db)):
    try:
        return ChannelDispatcherService.send_test_message(
            db=db,
            channel=req.channel,
            recipient=req.recipient,
            subject=req.subject,
            message=req.message,
            language=req.language or "English"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/dispatch-campaign",
    summary="Dispatch campaign across Email, SMS, and WhatsApp",
    description="Transmits the generated campaign content across the selected channels to all targeted recipients."
)
def dispatch_campaign(req: DispatchCampaignRequest, db: Session = Depends(get_db)):
    try:
        return ChannelDispatcherService.dispatch_campaign(
            db=db,
            campaign_id=req.campaign_id,
            channels=req.channels,
            language_code=req.language_code,
            custom_message=req.custom_message,
            recipient_ids=req.recipient_ids
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
