#!/usr/bin/python3
"""Account Class"""

from BackEnd.models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone


class Account(BaseModel, Base):
    """Account Model"""
    __tablename__ = 'accounts'

    user_id = Column(String(60), ForeignKey('users.id'), nullable=False)
    account_number = Column(String(20), unique=True, nullable=False)
    balance = Column(Float, default=0.00)
    type = Column(String(50), nullable=False)
    currency = Column(String(10), default='ETB')
    status = Column(String(10), default='active')
    overdraft_limit = Column(Float, default=0.00)

    transactions = relationship("Transaction",
                                backref="account",
                                cascade="all, delete, delete-orphan")
    loans = relationship("Loan",
                         backref="account",
                         cascade="all, delete, delete-orphan")

    telebirr = relationship("Telebirr",
                            backref="user",
                            cascade="all, delete, delete-orphan")
