#!/usr/bin/python3
"""User Class"""

from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship

import bcrypt


class User(BaseModel, Base):
    """User Representation"""

    __tablename__ = "users"  # Specify table name if needed
    # Attributes
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password = Column(String(128), nullable=False)
    bio = Column(Text)
    admin = Column(Boolean,nullable=True ,default=False)
    session_id = Column(String(250))
    reset_token = Column(String(250))
    gender = Column(String(10))
    age = Column(Integer)
    interests = Column(String(255))
    location = Column(String(100))
    profile_picture = Column(String(255))
    hobbies = Column(String(255))
    preferences = Column(String(255))
    is_verified = Column(Boolean, default=False)
    created_at = Column(String(100))
    updated_at = Column(String(100))

    # Relationships




    def set_password(self, password):
        """Hash password securely using bcrypt"""
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode(), salt).decode()

    def check_password(self, password):
        """Verify the provided password"""
        return bcrypt.checkpw(password.encode(), self.password_hash.encode())
