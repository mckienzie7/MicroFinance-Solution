#!/usr/bin/python3
"""
Contains the class Transaction Controller
"""
from BackEnd.models import storage
from BackEnd.models.Transaction import Transaction
from BackEnd.models.Account import Account
from sqlalchemy.orm.exc import NoResultFound
from BackEnd.Controllers.TransactionAuthController import TransactionAuthController
from datetime import datetime
from typing import List, Tuple


class TransactionController:
    """
    Handles transaction-related operations
    """

    def __init__(self):
        """Initialize the TransactionController with database storage"""
        self.db = storage
        self.auth = TransactionAuthController()

    def create_transaction(self, account_id: str, amount: float, transaction_type: str, description: str = None) -> Transaction:
        """Create a new transaction for an account"""
        if not self.auth.validate_active_account(account_id):
            raise ValueError("Cannot create a transaction for a non-active account")

        new_transaction = Transaction(
            account_id=account_id,
            amount=amount,
            transaction_type=transaction_type,
            description=description
        )
        self.db.new(new_transaction)
        self.db.save()
        return new_transaction

    def update_transaction(self, transaction: Transaction, data: dict, ignore: list = None) -> Transaction:
        """
        Update transaction details
        Args:
            transaction: The transaction to update
            data: Dictionary containing fields to update
            ignore: List of fields to ignore during update
        Returns:
            Updated transaction
        """
        if not transaction:
            raise ValueError("Transaction not found")

        if ignore is None:
            ignore = ['id', 'created_at', 'updated_at', 'account_id', 'amount']

        for key, value in data.items():
            if key not in ignore and hasattr(transaction, key):
                setattr(transaction, key, value)

        self.db.save()
        return transaction

    def get_transaction(self, transaction_id: str) -> Transaction:
        """Retrieve transaction details"""
        transaction = self.db.get(Transaction, transaction_id)
        if not transaction:
            raise NoResultFound("Transaction not found")
        return transaction

    def get_transactions_by_account(self, account_id: str) -> List[Transaction]:
        """Retrieve all transactions for an account"""
        if not self.auth.validate_active_account(account_id):
            raise NoResultFound("Account not found or inactive")

        return self.db.get_all_by_account_id(Transaction, account_id)

    def get_transactions_by_date(self, start_date: str, end_date: str) -> List[Transaction]:
        """
        Get transactions within a date range
        Args:
            start_date: Start date in format 'YYYY-MM-DD'
            end_date: End date in format 'YYYY-MM-DD'
        Returns:
            List of Transaction objects
        """
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
        except ValueError:
            raise ValueError("Invalid date format. Use YYYY-MM-DD")

        if start > end:
            raise ValueError("Start date must be before end date")

        return self.db.get_transactions_by_date_range(start, end)

    def transfer(self, from_account_id: str, to_account_id: str, amount: float, description: str = None) -> Tuple[Transaction, Transaction]:
        """
        Transfer money between accounts
        Args:
            from_account_id: Source account ID
            to_account_id: Destination account ID
            amount: Amount to transfer
            description: Optional description of the transfer
        Returns:
            Tuple of (debit_transaction, credit_transaction)
        """
        if not (self.auth.validate_active_account(from_account_id) and 
                self.auth.validate_active_account(to_account_id)):
            raise ValueError("Both accounts must be active for transfer")

        from_account = self.db.get(Account, from_account_id)
        to_account = self.db.get(Account, to_account_id)

        if not from_account or not to_account:
            raise NoResultFound("One or both accounts not found")

        if from_account.balance < amount:
            raise ValueError("Insufficient funds")

        # Create debit transaction
        debit_transaction = self.create_transaction(
            from_account_id,
            -amount,
            "transfer",
            f"Transfer to {to_account_id}" + (f": {description}" if description else "")
        )

        # Create credit transaction
        credit_transaction = self.create_transaction(
            to_account_id,
            amount,
            "transfer",
            f"Transfer from {from_account_id}" + (f": {description}" if description else "")
        )

        # Update account balances
        from_account.balance -= amount
        to_account.balance += amount

        self.db.save()
        return debit_transaction, credit_transaction

    def delete_transaction(self, transaction: Transaction) -> None:
        """Delete a transaction"""
        if not transaction:
            raise ValueError("Transaction not found")

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
