from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class CampaignType(Base):
    __tablename__ = "campaign_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    default_priority = Column(String(20), default="NORMAL")
    is_active = Column(Boolean, default=True)

    campaigns = relationship("Campaign", back_populates="campaign_type")


class AudienceSegment(Base):
    __tablename__ = "audience_segments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    segment_type = Column(String(20), default="DYNAMIC")
    status = Column(String(20), default="ACTIVE")
    created_by = Column(BigInteger, nullable=True, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    campaign_audiences = relationship("CampaignAudience", back_populates="segment")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_code = Column(String(50), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    campaign_type_id = Column(BigInteger, ForeignKey("campaign_types.id"), nullable=False)
    objective = Column(Text, nullable=True)
    priority = Column(String(20), default="NORMAL")
    status = Column(String(30), default="DRAFT")
    start_at = Column(DateTime, nullable=True)
    end_at = Column(DateTime, nullable=True)
    created_by = Column(BigInteger, nullable=True, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Approval workflow fields
    approved_by = Column(BigInteger, ForeignKey("admins.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    campaign_type = relationship("CampaignType", back_populates="campaigns")
    audiences = relationship("CampaignAudience", back_populates="campaign", cascade="all, delete-orphan")
    contents = relationship("CampaignContent", back_populates="campaign", cascade="all, delete-orphan")
    approver = relationship("Admin", foreign_keys=[approved_by])


class CampaignAudience(Base):
    __tablename__ = "campaign_audiences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    segment_id = Column(BigInteger, ForeignKey("audience_segments.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("campaign_id", "segment_id", name="uk_campaign_segment"),
    )

    campaign = relationship("Campaign", back_populates="audiences")
    segment = relationship("AudienceSegment", back_populates="campaign_audiences")


class Language(Base):
    __tablename__ = "languages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    code = Column(String(10), nullable=False, unique=True)
    native_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)

    contents = relationship("CampaignContent", back_populates="language")
