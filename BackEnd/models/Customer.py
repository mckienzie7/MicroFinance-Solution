#!/usr/bin/python3
"""Customer Class"""

from BackEnd.models.user import User
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.orm import relationship



class Customer(User):
    """Customer Model"""
    __tablename__ = 'customers'

    id = Column(String(60), ForeignKey('users.id'), primary_key=True)
    #Relationship
    account = relationship("Account",
                           backref="customer",
                           cascade="all, delete, delete-orphan")
