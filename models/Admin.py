from sqlalchemy import Column, Enum, JSON
from models.base_model import BaseModel, Base
from models.user import User
from sqlalchemy.orm import relationship

class Admin(BaseModel, Base, User):
    """Admin Model"""
    __tablename__ = 'admins'

    role = Column(Enum('super_admin', 'loan_officer', 'account_manager'), nullable=False)
    permisssion = Column(JSON, nullable=False)

    #Relationship
    loans = relationship("Loan",
                         backref="admin",
                         cascade="all, delete, delete-orphan")
