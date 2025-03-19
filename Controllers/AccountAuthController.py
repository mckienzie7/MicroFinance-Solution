#!/usr/bin/python3
"""
Contains the class Account Authentication Controller
"""
import uuid
from models import storage
from models.Account import Account
from sqlalchemy.orm.exc import NoResultFound


def _generate_uuid() -> str:
    """Generates a unique identifier"""
    return str(uuid.uuid4())


class AccountAuthController:
    """
    Handles authentication and validation of accounts
    """
    def __init__(self):
        """Initialize AccountAuthController"""
        self.db = storage

    def verify_account_existence(self, user_id: int) -> bool:
        """Check if a user has an account"""
        account = self.db.get_by_user_id(Account, user_id)
        return account is not None

    def validate_active_account(self, account_id: int) -> bool:
        """Check if an account is active"""
        account = self.db.get(Account, account_id)
        if not account:
            raise NoResultFound("Account not found")
        return account.status == "active"

    def generate_account_id(self) -> str:
        """Generates a unique account ID"""
        return _generate_uuid()

    def get_account_status(self, account_id: int) -> str:
        """Retrieve account status"""
        account = self.db.get(Account, account_id)
        if not account:
            raise NoResultFound("Account not found")
        return account.status
