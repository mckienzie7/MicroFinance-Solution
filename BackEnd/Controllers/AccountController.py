#!/usr/bin/python3
"""
Contains the class Account Controller
"""
from BackEnd.models import storage
from BackEnd.models.Account import Account
from BackEnd.models.Transaction import Transaction
from sqlalchemy.orm.exc import NoResultFound
from AccountAuthController import AccountAuthController
from typing import List


class AccountController:
    """
    Handles account-related operations
    """

    def __init__(self):
        """Initialize the AccountController with database storage"""
        self.db = storage
        self.auth = AccountAuthController()

    def get_account(self, user_id: int) -> Account:
        """Retrieve account details for a user"""
        if not self.auth.verify_account_existence(user_id):
            raise NoResultFound("Account not found")
        return self.db.get_by_user_id(Account, user_id)

    def create_account(self, user_id: int, initial_balance: float = 0.0) -> Account:
        """Create a new account for a user"""
        if self.auth.verify_account_existence(user_id):
            raise ValueError("User already has an account")

        new_account = Account(user_id=user_id, balance=initial_balance, status="active")
        self.db.new(new_account)
        self.db.save()
        return new_account

    def update_account(self, account: Account, data: dict, ignore: list = None) -> Account:
        """
        Update account details
        Args:
            account: The account to update
            data: Dictionary containing fields to update
            ignore: List of fields to ignore during update
        Returns:
            Updated account
        """
        if not account:
            raise ValueError("Account not found")

        if not self.auth.validate_active_account(account.id):
            raise ValueError("Cannot update a non-active account")

        if ignore is None:
            ignore = []

        for key, value in data.items():
            if key not in ignore and hasattr(account, key):
                setattr(account, key, value)

        self.db.save()
        return account

    def delete_account(self, account: Account) -> None:
        """
        Delete an account
        Args:
            account: The account to delete
        """
        if not account:
            raise ValueError("Account not found")

        if not self.auth.validate_active_account(account.id):
            raise ValueError("Cannot delete a non-active account")

        # Check if account has any balance
        if account.balance > 0:
            raise ValueError("Cannot delete account with remaining balance")

        # Check if account has any pending transactions
        transactions = self.db.get_transactions_by_account(account.id)
        if transactions:
            raise ValueError("Cannot delete account with pending transactions")

        self.db.delete(account)
        self.db.save()

    def freeze_account(self, account_id: int) -> None:
        """Freeze an account (Admin only)"""
        if not self.auth.validate_active_account(account_id):
            raise ValueError("Account must be active to freeze")

        account = self.db.get(Account, account_id)
        account.status = "frozen"
        self.db.save()

    def deactivate_account(self, account_id: int) -> None:
        """Deactivate an account (Admin only)"""
        if not self.auth.validate_active_account(account_id):
            raise ValueError("Account must be active to deactivate")

        account = self.db.get(Account, account_id)
        account.status = "deactivated"
        self.db.save()

    def deposit(self, account_id: int, amount: float) -> None:
        """Deposit money into an account"""
        if not self.auth.validate_active_account(account_id):
            raise ValueError("Cannot deposit to a non-active account")

        account = self.db.get(Account, account_id)
        account.balance += amount
        transaction = Transaction(account_id=account_id, amount=amount, type="deposit")
        self.db.new(transaction)
        self.db.save()

    def withdraw(self, account_id: int, amount: float) -> None:
        """Withdraw money from an account"""
        if not self.auth.validate_active_account(account_id):
            raise ValueError("Cannot withdraw from a non-active account")

        account = self.db.get(Account, account_id)
        if account.balance < amount:
            raise ValueError("Insufficient funds")

        account.balance -= amount
        transaction = Transaction(account_id=account_id, amount=-amount, type="withdrawal")
        self.db.new(transaction)
        self.db.save()

    def transfer(self, from_account_id: int, to_account_id: int, amount: float) -> None:
        """Transfer money between accounts"""
        if not (self.auth.validate_active_account(from_account_id) and self.auth.validate_active_account(
                to_account_id)):
            raise ValueError("Both accounts must be active for transfer")

        from_account = self.db.get(Account, from_account_id)
        to_account = self.db.get(Account, to_account_id)

        if from_account.balance < amount:
            raise ValueError("Insufficient funds")

        from_account.balance -= amount
        to_account.balance += amount
        transaction = Transaction(account_id=from_account_id, amount=-amount, type="transfer")
        self.db.new(transaction)
        self.db.save()

    def get_transactions_by_account(self, account_id: int) -> List[Transaction]:
        """
        Get all transactions for a specific account
        Args:
            account_id: The ID of the account to get transactions for
        Returns:
            List of Transaction objects
        """
        if not self.auth.validate_active_account(account_id):
            raise ValueError("Cannot get transactions for a non-active account")

        return self.db.get_transactions_by_account(account_id)
