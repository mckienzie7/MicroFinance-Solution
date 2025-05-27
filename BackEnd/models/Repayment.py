#!/usr/bin/python3
"""Repayment Class"""

from sqlalchemy import Float, String, ForeignKey, Column
from sqlalchemy.orm import relationship

from BackEnd.models.base_model import BaseModel, Base


class Repayment(BaseModel, Base):
    """Repayment Model"""
    __tablename__ = 'repayments'

    loan_id = Column(String(60), ForeignKey('loans.id'), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), default='pending')

    transactions = relationship("Transaction",
                                backref="repayment",
                                cascade="all, delete, delete-orphan")