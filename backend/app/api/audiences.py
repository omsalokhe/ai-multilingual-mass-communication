"""
Audiences & Recipients API endpoints.
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.campaign import AudienceSegment, Language
from app.models.recipient import (
    Recipient, AudienceSegmentMember, Occupation, Organization
)

logger = logging.getLogger("uvicorn")

router = APIRouter(tags=["Audiences & Recipients"])


# ── Schemas ────────────────────────────────────

class SegmentBrief(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    member_count: int
    status: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class RecipientBrief(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    city: Optional[str] = None
    occupation: Optional[str] = None
    organization: Optional[str] = None
    preferred_language: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class CreateSegmentRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class CreateSegmentResponse(BaseModel):
    success: bool
    segment_id: int
    name: str
    message: str


# ── Segments ────────────────────────────────────

@router.get(
    "/audiences/segments",
    response_model=List[SegmentBrief],
    summary="List all audience segments"
)
def list_segments(db: Session = Depends(get_db)):
    segments = db.query(AudienceSegment).order_by(AudienceSegment.created_at.desc()).all()
    result = []
    for seg in segments:
        member_count = db.query(func.count(AudienceSegmentMember.id)).filter(
            AudienceSegmentMember.segment_id == seg.id
        ).scalar() or 0
        result.append(SegmentBrief(
            id=seg.id,
            name=seg.name,
            description=seg.description,
            member_count=member_count,
            status=seg.status,
            created_at=seg.created_at.isoformat() if seg.created_at else None,
        ))
    return result


@router.post(
    "/audiences/segments",
    response_model=CreateSegmentResponse,
    summary="Create a new audience segment"
)
def create_segment(request: CreateSegmentRequest, db: Session = Depends(get_db)):
    existing = db.query(AudienceSegment).filter(AudienceSegment.name == request.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Segment '{request.name}' already exists.")

    segment = AudienceSegment(
        name=request.name,
        description=request.description,
        segment_type="STATIC",
        status="ACTIVE",
        created_by=1,
    )
    db.add(segment)
    db.commit()
    db.refresh(segment)

    return CreateSegmentResponse(
        success=True,
        segment_id=segment.id,
        name=segment.name,
        message=f"Segment '{segment.name}' created successfully."
    )


# ── Recipients ────────────────────────────────────

@router.get(
    "/recipients",
    response_model=List[RecipientBrief],
    summary="List all recipients"
)
def list_recipients(db: Session = Depends(get_db)):
    recipients = db.query(Recipient).order_by(Recipient.created_at.desc()).all()
    result = []
    for r in recipients:
        result.append(RecipientBrief(
            id=r.id,
            first_name=r.first_name,
            last_name=r.last_name,
            email=r.email,
            phone_number=r.phone_number,
            city=r.city,
            occupation=r.occupation.name if r.occupation else None,
            organization=r.organization.name if r.organization else None,
            preferred_language=r.preferred_language.name if r.preferred_language else None,
            status=r.status,
        ))
    return result


# ── Languages ────────────────────────────────────

@router.get(
    "/languages",
    summary="List all active languages"
)
def list_languages(db: Session = Depends(get_db)):
    langs = db.query(Language).filter(Language.is_active == True).all()
    return [
        {"id": l.id, "name": l.name, "code": l.code, "native_name": l.native_name}
        for l in langs
    ]
