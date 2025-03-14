#!/usr/bin/python3
"""Customer Class"""

from models.user import User
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum, Integer, JSON
from sqlalchemy.orm import relationship



class Customer(BaseModel, Base,User):
    """Customer Model"""
    __tablename__ = 'customers'


    #Relationship
    account = relationship("Account",
                           backref="user",
                           cascade="all, delete, delete-orphan")
