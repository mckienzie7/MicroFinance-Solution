#!/usr/bin/python3
"""Telebirr class"""


from BackEnd.models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

class Telebirr(BaseModel, Base):
    """Stores Telebirr transactions"""
    __tablename__ = 'telebirr'

    user_id = Column(String(60), ForeignKey('users.id'), nullable=False)
    account_id = Column(String(60), ForeignKey('accounts.id'), nullable=False)
    transaction_id = Column(String(100), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # "pending", "completed", "failed"
    payment_type = Column(String(20), nullable=False)  # "deposit", "withdrawal"
