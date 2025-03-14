#!/usr/bin/python3
"""Account Class"""

from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone


class Account(BaseModel, Base):
    """Account Model"""
    __tablename__ = 'accounts'

    customer_id = Column(String(60), ForeignKey('customers.id'), nullable=False)
    account_number = Column(String(20), unique=True, nullable=False)
    balance = Column(Float, default=0.00)
    type = Column(String(50), nullable=False)  # e.g., 'savings', 'checking'
    currency = Column(String(10), default='USD', nullable=False)
    status = Column(String(10), default='active', nullable=False)
    overdraft_limit = Column(Float, default=0.00)

    transactions = relationship("Transaction",
                                backref="account",
                                cascade="all, delete, delete-orphan")
    loans = relationship("Loan",
                         backref="account",
                         cascade="all, delete, delete-orphan")
