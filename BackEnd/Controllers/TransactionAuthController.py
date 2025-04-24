#!/usr/bin/python3
"""
Contains the class Transaction Authentication Controller
"""
from BackEnd.models import storage
from BackEnd.models.Account import Account
from sqlalchemy.orm.exc import NoResultFound

from BackEnd.models.Transaction import Transaction


class TransactionAuthController:
    """
    Handles authentication and validation of transactions
    """

    def __init__(self):
        """Initialize TransactionAuthController"""
        self.db = storage

    def validate_active_account(self, account_id: int) -> bool:
        """Check if an account is active for performing transactions"""
        account = self.db.get(Account, account_id)
        if not account:
            raise NoResultFound("Account not found")
        return account.status == "active"

    def get_transaction_status(self, transaction_id: int) -> str:
        """Retrieve transaction status"""
        transaction = self.db.get(Transaction, transaction_id)
        if not transaction:
            raise NoResultFound("Transaction not found")
        return transaction.status
