#!/usr/bin/python3
"""User Class"""

from BackEnd.models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Integer, Text, Boolean, LargeBinary
from sqlalchemy.orm import relationship
import bcrypt
from BackEnd.models.Notification import Notification
import os
from werkzeug.utils import secure_filename
import uuid



class User(BaseModel, Base):
    """User Representation"""

    __tablename__ = "users"  # Specify table name if needed
    # Attributes

    fullname = Column(String(50), nullable=False)
    phone_number = Column(String(20))
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password = Column(String(128), nullable=False)
    bio = Column(Text)
    admin = Column(Boolean, nullable=True, default=False)
    session_id = Column(String(250))
    reset_token = Column(String(250))
    gender = Column(String(10))
    age = Column(Integer)
    interests = Column(String(255))
    location = Column(String(100))
    profile_picture_path = Column(String(255))  # Store path instead of actual image
    fayda_id = Column(String(50))
    fayda_document_path = Column(String(255))  # Store path to Fayda document
    hobbies = Column(String(255))
    preferences = Column(String(255))
    is_verified = Column(Boolean, default=False)

    # Relationships
    Notification = relationship("Notification",
                                backref="user",
                                cascade="all, delete, delete-orphan")

    otp = relationship("OTP",
                       backref="user",
                       cascade="all, delete, delete-orphan")

    loans = relationship("Loan",
                         backref="admin",
                         cascade="all, delete, delete-orphan")

    account = relationship("Account",
                           backref="User",
                           cascade="all, delete, delete-orphan")

    def set_password(self, password):
        """Hash password securely using bcrypt"""
        salt = bcrypt.gensalt()
        self.password = bcrypt.hashpw(password.encode(), salt).decode()

    def check_password(self, password):
        """Verify the provided password"""
        return bcrypt.checkpw(password.encode(), self.password.encode())
        
    @classmethod
    def get_user_by_email(cls, email):
        """Retrieve a user by email"""
        from BackEnd.models import storage
        all_users = storage.all(cls)
        for user in all_users.values():
            if user.email == email:
                return user
        return None

    def _generate_unique_filename(self, original_filename):
        """Generate a unique filename using UUID"""
        ext = os.path.splitext(original_filename)[1]
        return f"{uuid.uuid4()}{ext}"

    def _save_file(self, file, directory):
        """Save a file to the specified directory"""
        if not file:
            return None

        # Create directory if it doesn't exist
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', directory)
        os.makedirs(upload_dir, exist_ok=True)

        # Generate unique filename
        filename = self._generate_unique_filename(secure_filename(file.filename))
        file_path = os.path.join(upload_dir, filename)
        
        # Save the file
        file.save(file_path)
        
        # Return the relative path
        return f"{directory}/{filename}"

    def update_profile_picture(self, file):
        """Update user's profile picture"""
        if file:
            # Delete old profile picture if exists
            if self.profile_picture_path:
                old_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                      'static', self.profile_picture_path)
                if os.path.exists(old_path):
                    os.remove(old_path)

            # Save new profile picture
            self.profile_picture_path = self._save_file(file, 'profile_pictures')
            return True
        return False

    def update_fayda_document(self, file):
        """Update user's Fayda document"""
        if file:
            # Delete old document if exists
            if self.fayda_document_path:
                old_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                      'static', self.fayda_document_path)
                if os.path.exists(old_path):
                    os.remove(old_path)

            # Save new document
            self.fayda_document_path = self._save_file(file, 'fayda_documents')
            return True
        return False

    def get_profile_picture_url(self):
        """Get the full URL for the profile picture"""
        if self.profile_picture_path:
            return f"/static/{self.profile_picture_path}"
        return None

    def get_fayda_document_url(self):
        """Get the full URL for the Fayda document"""
        if self.fayda_document_path:
            return f"/static/{self.fayda_document_path}"
        return None
