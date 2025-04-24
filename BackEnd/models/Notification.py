#!/usr/bin/python3
"""Notification class"""


from BackEnd.models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

class Notification(BaseModel, Base):
    """Stores notifications sent to users."""
    __tablename__ = 'notifications'

    user_id = Column(String(60), ForeignKey('users.id'), nullable=False)
    message = Column(String(255), nullable=False)
    is_read = Column(Boolean, default=False)  # False by default
    type = Column(String(50), nullable=False)  # "email", "telebirr", "system"

