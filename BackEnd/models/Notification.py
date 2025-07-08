#!/usr/bin/python3
"""
Notification model
"""
from .base_model import BaseModel, Base
from sqlalchemy import Column, String, ForeignKey, Boolean


class Notification(BaseModel, Base):
    """
    Representation of a notification
    """
    __tablename__ = 'notifications'
    user_id = Column(String(60), ForeignKey('users.id'), nullable=False)
    message = Column(String(255), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)

    def __init__(self, *args, **kwargs):
        """initializes notification"""
        super().__init__(*args, **kwargs)
