#!/usr/bin/python3
"""
Contains the class Account Controller
"""
from models import storage
from models.Account import Account
from models.Transaction import Transaction
from sqlalchemy.orm.exc import NoResultFound
from AccountAuthController import AccountAuthController


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
