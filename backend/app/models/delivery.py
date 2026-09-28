from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class DeliveryLog(Base):
    __tablename__ = "delivery_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    channel = Column(String(30), nullable=False)  # 'EMAIL', 'SMS', 'WHATSAPP'
    recipient_name = Column(String(150), nullable=False)
    recipient_contact = Column(String(255), nullable=False)  # Email address or phone number
    language = Column(String(50), default="English")
    subject = Column(String(500), nullable=True)
    message_preview = Column(Text, nullable=False)
    status = Column(String(30), default="DELIVERED")  # 'DELIVERED', 'SENT', 'FAILED'
    gateway_message_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign")
