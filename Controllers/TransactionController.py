#!/usr/bin/python3
"""
Contains the class Transaction Controller
"""
from models import storage
from models.Transaction import Transaction
from sqlalchemy.orm.exc import NoResultFound
from TransactionAuthController import TransactionAuthController


class TransactionController:
    """
    Handles transaction-related operations
    """

    def __init__(self):
        """Initialize the TransactionController with database storage"""
        self.db = storage
        self.auth = TransactionAuthController()

    def create_transaction(self, account_id: int, amount: float, transaction_type: str) -> Transaction:
        """Create a new transaction for an account"""
        if not self.auth.validate_active_account(account_id):
            raise ValueError("Cannot create a transaction for a non-active account")

        new_transaction = Transaction(account_id=account_id, amount=amount, type=transaction_type)
        self.db.new(new_transaction)
        self.db.save()
        return new_transaction

    def get_transaction(self, transaction_id: int) -> Transaction:
        """Retrieve transaction details"""
        transaction = self.db.get(Transaction, transaction_id)
        if not transaction:
            raise NoResultFound("Transaction not found")
        return transaction

    def get_transactions_by_account(self, account_id: int) -> list[Transaction]:
        """Retrieve all transactions for an account"""
        if not self.auth.validate_active_account(account_id):
            raise NoResultFound("Account not found or inactive")

        return self.db.get_all_by_account_id(Transaction, account_id)

    def delete_transaction(self, transaction_id: int) -> None:
        """Delete a transaction (Admin only)"""
        transaction = self.db.get(Transaction, transaction_id)
        if not transaction:
            raise NoResultFound("Transaction not found")

        self.db.delete(transaction)
        self.db.save()

    def reverse_transaction(self, transaction_id: int) -> Transaction:
        """Reverse a transaction (Admin only)"""
        transaction = self.db.get(Transaction, transaction_id)
        if not transaction:
            raise NoResultFound("Transaction not found")

        if transaction.type == "deposit":
            new_transaction = self.create_transaction(transaction.account_id, -transaction.amount, "reversal")
        elif transaction.type == "withdrawal":
            new_transaction = self.create_transaction(transaction.account_id, transaction.amount, "reversal")
        else:
            raise ValueError("Unsupported transaction type for reversal")

        self.db.save()
        return new_transaction
