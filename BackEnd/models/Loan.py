#!/usr/bin/python3
"""Loan Class"""


from sqlalchemy import Float, String, ForeignKey, DateTime, Column, Integer
from sqlalchemy.orm import relationship
from BackEnd.models.base_model import BaseModel, Base
from datetime import datetime


class Loan(BaseModel, Base):
    """Loan Model"""
    __tablename__ = 'loans'

    admin_id = Column(String(60), ForeignKey('users.id'), nullable=False)
    account_id = Column(String(60), ForeignKey('accounts.id'), nullable=False)
    amount = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)  # E.g., 5% interest
    loan_status = Column(String(50), default='pending')  # 'pending', 'approved', 'rejected', etc.
    repayment_period = Column(Integer, nullable=False)
    end_date = Column(DateTime)

    repayments = relationship("Repayment", backref="loan", cascade="all, delete, delete-orphan")

    def to_dict(self):
        """Returns a dictionary representation of the Loan model"""
        # Get the base dictionary from parent class
        base_dict = super().to_dict()
        
        # Add loan-specific fields
        loan_dict = {
            **base_dict,
            'admin_id': self.admin_id,
            'account_id': self.account_id,
            'amount': float(self.amount),
            'interest_rate': float(self.interest_rate),
            'loan_status': self.loan_status,
            'repayment_period': self.repayment_period,
            'end_date': self.end_date.isoformat() if self.end_date else None
        }

        # Add account information if it's loaded
        if hasattr(self, 'account') and self.account is not None:
            loan_dict['account'] = self.account.to_dict()

        return loan_dict
