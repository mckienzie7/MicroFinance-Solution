#!/usr/bin/python3
"""
Contains the class Transaction Controller
"""
from BackEnd.models import storage
from BackEnd.models.Transaction import Transaction
from BackEnd.models.Account import Account
from sqlalchemy.orm.exc import NoResultFound
from BackEnd.Controllers.TransactionAuthController import TransactionAuthController
from BackEnd.Controllers.NotificationController import NotificationController
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
        self.notification_controller = NotificationController()

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

    def deposit(self, account_id: str, amount: float, description: str = None) -> Transaction:
        """
        Deposit money into an account.
        Args:
            account_id: The ID of the account to deposit into.
            amount: The amount to deposit.
            description: Optional description of the deposit.
        Returns:
            The created transaction.
        """
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")

        account = self.db.get(Account, account_id)
        if not account:
            raise NoResultFound("Account not found")

        if not self.auth.validate_active_account(account_id):
            raise ValueError("Account must be active for deposit")

        account.balance += amount
        transaction = self.create_transaction(
            account_id,
            amount,
            "deposit",
            description
        )
        self.db.save()
        return transaction

    def withdraw(self, account_id: str, amount: float, description: str = None) -> Transaction:
        """
        Withdraw money from an account.
        Args:
            account_id: The ID of the account to withdraw from.
            amount: The amount to withdraw.
            description: Optional description of the withdrawal.
        Returns:
            The created transaction.
        """
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")

        account = self.db.get(Account, account_id)
        if not account:
            raise NoResultFound("Account not found")

        if not self.auth.validate_active_account(account_id):
            raise ValueError("Account must be active for withdrawal")

        if account.balance < amount:
            raise ValueError("Insufficient funds")

        account.balance -= amount
        transaction = self.create_transaction(
            account_id,
            -amount,
            "withdrawal",
            description
        )
        self.db.save()
        
        # Check for low balance and create notification if needed
        LOW_BALANCE_THRESHOLD = 100.0  # ETB
        if account.balance < LOW_BALANCE_THRESHOLD:
            self.notification_controller.notify_low_balance(
                user_id=account.user_id,
                current_balance=account.balance
            )
        
        return transaction

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
        """
        Get all transactions for a specific account
        """
        try:
            # Use SQLAlchemy query interface to get transactions by account_id
            transactions = self.db.session().query(Transaction).filter(Transaction.account_id == account_id).all()
            return transactions
        except Exception as e:
            print(f"Error getting transactions for account {account_id}: {str(e)}")
            return []

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

        # Withdraw from source account
        debit_transaction = self.withdraw(
            from_account_id,
            amount,
            f"Transfer to {to_account.id}" + (f": {description}" if description else "")
        )

        # Deposit into destination account
        credit_transaction = self.deposit(
            to_account_id,
            amount,
            f"Transfer from {from_account.id}" + (f": {description}" if description else "")
        )

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
