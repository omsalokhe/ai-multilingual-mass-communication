from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class CampaignContent(Base):
    __tablename__ = "campaign_contents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    language_id = Column(BigInteger, ForeignKey("languages.id"), nullable=False)
    channel = Column(String(30), nullable=False)  # 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'WEB', 'SOCIAL'
    subject = Column(String(500), nullable=True)
    title = Column(String(500), nullable=True)
    body = Column(Text, nullable=False)
    ai_generated = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    status = Column(String(30), default="DRAFT")  # 'DRAFT', 'APPROVED', 'REJECTED'
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("campaign_id", "language_id", "channel", name="uk_camp_content_lang_chan"),
    )

    campaign = relationship("Campaign", back_populates="contents")
    language = relationship("Language", back_populates="contents")
    quality_reports = relationship("ContentQualityReport", back_populates="content", cascade="all, delete-orphan")


class ContentQualityReport(Base):
    __tablename__ = "content_quality_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_content_id = Column(BigInteger, ForeignKey("campaign_contents.id", ondelete="CASCADE"), nullable=False)
    sentiment = Column(String(20), nullable=True)  # POSITIVE / NEUTRAL / NEGATIVE
    tone = Column(String(50), nullable=True)
    clarity_score = Column(Integer, nullable=True)
    grammar_ok = Column(Boolean, nullable=True)
    grammar_issues = Column(Text, nullable=True)      # JSON array of grammar errors from LanguageTool
    factual_ok = Column(Boolean, nullable=True)
    factual_issues = Column(Text, nullable=True)       # JSON from LLM factual/safety check
    compliance_ok = Column(Boolean, nullable=True)
    compliance_issues = Column(Text, nullable=True)    # JSON array of rule-based compliance violations
    overall_score = Column(Integer, nullable=True)
    status = Column(String(20), default="APPROVED")    # 'APPROVED', 'REJECTED', 'NEEDS_REVIEW'
    created_at = Column(DateTime, default=datetime.utcnow)

    content = relationship("CampaignContent", back_populates="quality_reports")
