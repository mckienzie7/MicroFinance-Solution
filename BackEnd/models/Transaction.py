#!/usr/bin/python3
"""Transaction Class"""

from BackEnd.models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone


class Transaction(BaseModel, Base):
    """Transaction Model"""
    __tablename__ = 'transactions'


    repayment_id = Column(String(60), ForeignKey('repayments.id'))
    account_id = Column(String(60), ForeignKey('accounts.id'), nullable=False)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(50), nullable=False)
    description = Column(String(255))
