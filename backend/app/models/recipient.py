from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.database import Base


class Occupation(Base):
    __tablename__ = "occupations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)  # 'Student', 'Teacher', 'Doctor', 'Employee', 'Farmer', 'Resident'
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    recipients = relationship("Recipient", back_populates="occupation")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    recipients = relationship("Recipient", back_populates="organization")


class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True, unique=True)
    phone_number = Column(String(20), nullable=True, unique=True)
    occupation_id = Column(BigInteger, ForeignKey("occupations.id"), nullable=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=True)
    city = Column(String(100), nullable=True)
    preferred_language_id = Column(BigInteger, ForeignKey("languages.id"), nullable=True)
    status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    occupation = relationship("Occupation", back_populates="recipients")
    organization = relationship("Organization", back_populates="recipients")
    preferred_language = relationship("Language")
    segment_memberships = relationship("AudienceSegmentMember", back_populates="recipient", cascade="all, delete-orphan")


class AudienceSegmentMember(Base):
    __tablename__ = "audience_segment_members"

    id = Column(Integer, primary_key=True, autoincrement=True)
    segment_id = Column(BigInteger, ForeignKey("audience_segments.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(BigInteger, ForeignKey("recipients.id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("segment_id", "recipient_id", name="uk_segment_recipient"),
    )

    segment = relationship("AudienceSegment")
    recipient = relationship("Recipient", back_populates="segment_memberships")


class CommunicationTemplate(Base):
    __tablename__ = "communication_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    template_type = Column(String(50), nullable=False)  # 'AWARENESS', 'EMERGENCY_ALERT', 'EDUCATIONAL'
    channel = Column(String(30), nullable=False)        # 'SMS', 'EMAIL', 'WHATSAPP'
    language_id = Column(BigInteger, ForeignKey("languages.id"), nullable=False)
    subject_template = Column(String(500), nullable=True)
    body_template = Column(Text, nullable=False)
    variables = Column(JSON, nullable=True)             # e.g., ["audience_group", "location", "action_url", "helpline"]
    version = Column(Integer, default=1)
    status = Column(String(20), default="PUBLISHED")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    language = relationship("Language")
