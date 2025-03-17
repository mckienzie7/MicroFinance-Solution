#!/usr/bin/python3
"""Loan Class"""


from sqlalchemy import Float, String, ForeignKey, DateTime, Column, Integer
from sqlalchemy.orm import relationship
from models.base_model import BaseModel, Base
from datetime import datetime


class Loan(BaseModel, Base):
    """Loan Model"""
    __tablename__ = 'loans'

    admin_id = Column(String(60), ForeignKey('admins.id'), nullable=False)
    account_id = Column(String(60), ForeignKey('accounts.id'), nullable=False)
    amount = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)  # E.g., 5% interest
    loan_status = Column(String(50), default='pending')  # 'pending', 'approved', 'rejected', etc.
    repayment_period = Column(Integer, nullable=False)  # E.g., 12 months
    start_date = Column(DateTime, default=datetime.now)
    end_date = Column(DateTime)

    repayments = relationship("Repayment", backref="loan", cascade="all, delete, delete-orphan")
