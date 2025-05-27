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

    def to_dict(self):
        """Returns a dictionary representation of the Account model"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'account_number': self.account_number,
            'balance': float(self.balance),
            'type': self.type,
            'currency': self.currency,
            'status': self.status,
            'overdraft_limit': float(self.overdraft_limit),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }