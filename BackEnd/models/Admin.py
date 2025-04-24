#!/usr/bin/python3
"""Admin Class"""


from sqlalchemy import Column, Enum, JSON, ForeignKey,String
from BackEnd.models.user import User
from sqlalchemy.orm import relationship

class Admin(User):
    """Admin Model"""
    __tablename__ = 'admins'

    id = Column(String(60), ForeignKey('users.id'), primary_key=True)  # Explicit FK

    role = Column(Enum('super_admin', 'loan_officer', 'account_manager'), nullable=False)
    permission = Column(JSON, nullable=False)

    # Relationship
    loans = relationship("Loan", backref="admin", cascade="all, delete, delete-orphan")
