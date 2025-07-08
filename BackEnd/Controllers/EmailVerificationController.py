#!/usr/bin/python3
"""
Email Verification Controller
"""
import os
import smtplib
import uuid
from email.mime.text import MIMEText
from BackEnd.models import storage
from BackEnd.models.user import User


def send_verification_email(user_id):
    """
    Sends a verification email to the user.
    """
    user = storage.get(User, user_id)
    if not user:
        return None

    token = str(uuid.uuid4())
    setattr(user, 'verification_token', token)
    storage.save()

    sender_email = os.getenv('EMAIL_USER')
    sender_password = os.getenv('EMAIL_PASSWORD')
    receiver_email = user.email

    verification_link = f"http://localhost:5173/verify-email?token={token}"

    message = MIMEText(f"Click the link to verify your email: {verification_link}")
    message['Subject'] = "Email Verification"
    message['From'] = sender_email
    message['To'] = receiver_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message.as_string())
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def verify_email(token):
    """
    Verifies the user's email address.
    """
    user = storage.get(User, "verification_token", token)
    if not user:
        return None

    setattr(user, 'is_verified', True)
    setattr(user, 'verification_token', None)
    storage.save()
    return user
