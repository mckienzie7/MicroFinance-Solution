#!/usr/bin/python3
"""Customer Class"""

from models.user import User
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Integer, JSON
from sqlalchemy.orm import relationship



class Customer(User):
    """Customer Model"""
    __tablename__ = 'customers'

    id = Column(String(60), ForeignKey('users.id'), primary_key=True)
    #Relationship
    account = relationship("Account",
                           backref="customer",
                           cascade="all, delete, delete-orphan")
