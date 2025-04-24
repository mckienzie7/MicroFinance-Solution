#!/usr/bin/python3
"""OTP Class"""


from BackEnd.models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta

class OTP(BaseModel, Base):
    """Stores OTPs for verification"""
    __tablename__ = 'otps'

    user_id = Column(String(60), ForeignKey('users.id'), nullable=False)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(minutes=5))
    is_verified = Column(Boolean, default=False)
