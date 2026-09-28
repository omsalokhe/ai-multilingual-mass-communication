"""
Dashboard stats endpoint - returns real data from the database.
"""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.campaign import Campaign, AudienceSegment, Language
from app.models.content import CampaignContent, ContentQualityReport
from app.models.recipient import Recipient, AudienceSegmentMember

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardStats(BaseModel):
    total_campaigns: int
    total_recipients: int
    total_segments: int
    total_contents: int
    total_languages: int
    campaigns_by_status: dict
    campaigns_by_priority: dict
    recent_campaigns: list
    audience_segments: list
    languages: list


@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Get dashboard statistics",
    description="Returns aggregate stats for campaigns, recipients, segments, and content from the database."
)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Total counts
    total_campaigns = db.query(func.count(Campaign.id)).scalar() or 0
    total_recipients = db.query(func.count(Recipient.id)).scalar() or 0
    total_segments = db.query(func.count(AudienceSegment.id)).scalar() or 0
    total_contents = db.query(func.count(CampaignContent.id)).scalar() or 0
    total_languages = db.query(func.count(Language.id)).filter(Language.is_active == True).scalar() or 0

    # Campaigns by status
    status_counts = db.query(
        Campaign.status, func.count(Campaign.id)
    ).group_by(Campaign.status).all()
    campaigns_by_status = {s: c for s, c in status_counts}

    # Campaigns by priority
    priority_counts = db.query(
        Campaign.priority, func.count(Campaign.id)
    ).group_by(Campaign.priority).all()
    campaigns_by_priority = {p: c for p, c in priority_counts}

    # Recent campaigns
    recent = db.query(Campaign).order_by(Campaign.created_at.desc()).limit(10).all()
    recent_campaigns = []
    for c in recent:
        audiences = [a.segment.name for a in c.audiences if a.segment]
        content_count = db.query(func.count(CampaignContent.id)).filter(
            CampaignContent.campaign_id == c.id
        ).scalar() or 0
        recent_campaigns.append({
            "id": c.id,
            "name": c.name,
            "campaign_code": c.campaign_code,
            "status": c.status,
            "priority": c.priority,
            "campaign_type": c.campaign_type.name if c.campaign_type else "General",
            "target_audiences": audiences,
            "content_count": content_count,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    # Audience segments with member counts
    segments = db.query(AudienceSegment).filter(AudienceSegment.status == "ACTIVE").all()
    audience_segments = []
    for seg in segments:
        member_count = db.query(func.count(AudienceSegmentMember.id)).filter(
            AudienceSegmentMember.segment_id == seg.id
        ).scalar() or 0
        audience_segments.append({
            "id": seg.id,
            "name": seg.name,
            "description": seg.description,
            "member_count": member_count,
            "status": seg.status,
        })

    # Languages
    langs = db.query(Language).filter(Language.is_active == True).all()
    languages = [
        {"id": l.id, "name": l.name, "code": l.code, "native_name": l.native_name}
        for l in langs
    ]

    return DashboardStats(
        total_campaigns=total_campaigns,
        total_recipients=total_recipients,
        total_segments=total_segments,
        total_contents=total_contents,
        total_languages=total_languages,
        campaigns_by_status=campaigns_by_status,
        campaigns_by_priority=campaigns_by_priority,
        recent_campaigns=recent_campaigns,
        audience_segments=audience_segments,
        languages=languages,
    )
