#!/usr/bin/python3
"""
Password Reset Controller
"""
import os
import smtplib
from email.mime.text import MIMEText
from BackEnd.models import storage
from BackEnd.models.user import User
from BackEnd.Controllers.AuthController import AuthController
from BackEnd.Controllers.UserControllers import UserController

def send_password_reset_email(email):
    """
    Sends a password reset email to the user.
    """
    userc = UserController()
    auth = AuthController()
    try:
        token = auth.get_reset_password_token(email)
    except ValueError:
        return False

    sender_email = os.getenv('EMAIL_USER')
    sender_password = os.getenv('EMAIL_PASSWORD')
    receiver_email = email
    url = os.getenv('VITE_API_URL')
    reset_link = f"{url}/api/v1/reset-password/{token}"

    message = MIMEText(f"Click the link to reset your password: {reset_link}")
    message['Subject'] = "Password Reset Request"
    message['From'] = sender_email
    message['To'] = receiver_email
    db = storage
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, receiver_email, message.as_string())
            user = userc.find_user_by(email=email)
            if user:
                user.reset_password_token = token
                storage.new(user)
                storage.save()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False




