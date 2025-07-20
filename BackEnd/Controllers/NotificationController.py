#!/usr/bin/python3
"""
Contains the NotificationController class
"""
from BackEnd.models import storage
from BackEnd.models.Notification import Notification
from BackEnd.models.user import User
from typing import List, Optional
from datetime import datetime


class NotificationController:
    """
    Handles notification-related operations
    """

    def __init__(self):
        """Initialize the NotificationController with database storage"""
        self.db = storage

    def create_notification(self, user_id: str, message: str) -> Notification:
        """
        Create a new notification for a user
        
        Args:
            user_id: The ID of the user to notify
            message: The notification message
            
        Returns:
            The created notification object
        """
        try:
            notification = Notification(
                user_id=user_id,
                message=message,
                is_read=False
            )
            
            self.db.new(notification)
            self.db.save()
            
            return notification
            
        except Exception as e:
            self.db.Rollback()
            print(f"Error creating notification: {e}")
            raise e

    def get_user_notifications(self, user_id: str, limit: int = 50) -> List[Notification]:
        """
        Get all notifications for a user
        
        Args:
            user_id: The ID of the user
            limit: Maximum number of notifications to return
            
        Returns:
            List of notification objects
        """
        try:
            notifications = self.db.session().query(Notification).filter(
                Notification.user_id == user_id
            ).order_by(Notification.created_at.desc()).limit(limit).all()
            
            return notifications
            
        except Exception as e:
            print(f"Error fetching notifications: {e}")
            return []

    def mark_as_read(self, notification_id: str) -> bool:
        """
        Mark a notification as read
        
        Args:
            notification_id: The ID of the notification
            
        Returns:
            True if successful, False otherwise
        """
        try:
            notification = self.db.get(Notification, notification_id)
            if notification:
                notification.is_read = True
                self.db.save()
                return True
            return False
            
        except Exception as e:
            self.db.Rollback()
            print(f"Error marking notification as read: {e}")
            return False

    def mark_all_as_read(self, user_id: str) -> bool:
        """
        Mark all notifications as read for a user
        
        Args:
            user_id: The ID of the user
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.db.session().query(Notification).filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).update({'is_read': True})
            
            self.db.save()
            return True
            
        except Exception as e:
            self.db.Rollback()
            print(f"Error marking all notifications as read: {e}")
            return False

    def get_unread_count(self, user_id: str) -> int:
        """
        Get the count of unread notifications for a user
        
        Args:
            user_id: The ID of the user
            
        Returns:
            Number of unread notifications
        """
        try:
            count = self.db.session().query(Notification).filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).count()
            
            return count
            
        except Exception as e:
            print(f"Error getting unread count: {e}")
            return 0

    def delete_notification(self, notification_id: str) -> bool:
        """
        Delete a notification
        
        Args:
            notification_id: The ID of the notification
            
        Returns:
            True if successful, False otherwise
        """
        try:
            notification = self.db.get(Notification, notification_id)
            if notification:
                self.db.delete(notification)
                self.db.save()
                return True
            return False
            
        except Exception as e:
            self.db.Rollback()
            print(f"Error deleting notification: {e}")
            return False

    # Specific notification creation methods for different actions

    def notify_deposit(self, user_id: str, amount: float, account_number: str = None):
        """Create notification for successful deposit"""
        message = f"Deposit of {amount} ETB has been successfully processed"
        if account_number:
            message += f" to account {account_number}"
        message += "."
        return self.create_notification(user_id, message)

    def notify_withdrawal(self, user_id: str, amount: float, account_number: str = None):
        """Create notification for successful withdrawal"""
        message = f"Withdrawal of {amount} ETB has been successfully processed"
        if account_number:
            message += f" from account {account_number}"
        message += "."
        return self.create_notification(user_id, message)

    def notify_loan_application(self, user_id: str, amount: float, loan_id: str = None):
        """Create notification for loan application submission"""
        message = f"Your loan application for {amount} ETB has been submitted and is under review"
        if loan_id:
            message += f" (Loan ID: {loan_id})"
        message += "."
        return self.create_notification(user_id, message)

    def notify_loan_approval(self, user_id: str, amount: float, loan_id: str = None):
        """Create notification for loan approval"""
        message = f"Congratulations! Your loan application for {amount} ETB has been approved"
        if loan_id:
            message += f" (Loan ID: {loan_id})"
        message += ". The funds will be credited to your account shortly."
        return self.create_notification(user_id, message)

    def notify_loan_rejection(self, user_id: str, amount: float, reason: str = None, loan_id: str = None):
        """Create notification for loan rejection"""
        message = f"Your loan application for {amount} ETB has been declined"
        if loan_id:
            message += f" (Loan ID: {loan_id})"
        if reason:
            message += f". Reason: {reason}"
        message += ". Please contact support for more information."
        return self.create_notification(user_id, message)

    def notify_loan_repayment(self, user_id: str, amount: float, loan_id: str = None):
        """Create notification for loan repayment"""
        message = f"Loan repayment of {amount} ETB has been successfully processed"
        if loan_id:
            message += f" for Loan ID: {loan_id}"
        message += "."
        return self.create_notification(user_id, message)

    def notify_account_activation(self, user_id: str):
        """Create notification for account activation"""
        message = "Your account has been activated! You can now access all banking services."
        return self.create_notification(user_id, message)

    def notify_account_deactivation(self, user_id: str):
        """Create notification for account deactivation"""
        message = "Your account has been deactivated. Please contact support for assistance."
        return self.create_notification(user_id, message)

    def notify_payment_success(self, user_id: str, amount: float, payment_type: str):
        """Create notification for successful payment"""
        message = f"Your {payment_type} payment of {amount} ETB has been successfully processed."
        return self.create_notification(user_id, message)

    def notify_payment_failure(self, user_id: str, amount: float, payment_type: str, reason: str = None):
        """Create notification for failed payment"""
        message = f"Your {payment_type} payment of {amount} ETB has failed"
        if reason:
            message += f". Reason: {reason}"
        message += ". Please try again or contact support."
        return self.create_notification(user_id, message)

    def notify_low_balance(self, user_id: str, current_balance: float):
        """Create notification for low account balance"""
        message = f"Your account balance is low (Current balance: {current_balance} ETB). Consider making a deposit."
        return self.create_notification(user_id, message)

    def notify_welcome(self, user_id: str, username: str):
        """Create welcome notification for new users"""
        message = f"Welcome to MicroFinance, {username}! Your account is being reviewed and will be activated soon."
        return self.create_notification(user_id, message)