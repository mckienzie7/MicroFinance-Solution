#!/usr/bin/python3
"""
Contains the class Account Controller
"""
from BackEnd.models import storage
from BackEnd.models.Account import Account
from BackEnd.models.Transaction import Transaction
from sqlalchemy.orm.exc import NoResultFound
from BackEnd.Controllers.AccountAuthController import AccountAuthController
from typing import List
from sqlalchemy import func
import re


class AccountController:
    """
    Handles account-related operations
    """

    def __init__(self):
        """Initialize the AccountController with database storage"""
        self.db = storage
        self.auth = AccountAuthController()
        self.__session = None

    def _get_last_account_number(self):
        """Get the last account number from the database"""
        last_account = self.db.session().query(Account).order_by(
            Account.account_number.desc()
        ).first()
        return last_account.account_number if last_account else None

    def _generate_account_number(self):
        """Generate a new account number in format MF00001"""
        last_number = self._get_last_account_number()
        
        if not last_number:
            # If no accounts exist, start with MF00001
            return "MF00001"
        
        # Extract the numeric part using regex
        match = re.match(r'MF(\d+)', last_number)
        if match:
            # Get the numeric part and increment it
            number = int(match.group(1))
            next_number = number + 1
            # Format with leading zeros
            return f"MF{next_number:05d}"
        else:
            # If format is invalid, start with MF00001
            return "MF00001"

    def get_account(self, user_id: int) -> Account:
        """Retrieve account details for a user"""
        if not self.auth.verify_account_existence(user_id):
            raise NoResultFound("Account not found")
        return self.db.get_by_user_id(Account, user_id)

    def create_account(self, user_id: str, account_type: str = 'savings') -> Account:
        """Create a new account for a customer"""
        try:
            # Generate new account number
            account_number = self._generate_account_number()
            
            # Create new account
            account = Account(
                user_id=user_id,
                account_number=account_number,
                type=account_type
            )
            
            # Save to database
            self.db.new(account)
            self.db.save()
            
            return account
            
        except Exception as e:
            self.db.Rollback()
            print(f"Error creating account: {e}")
            raise e

    def get_account_by_number(self, account_number: str) -> Account:
        """Get account by account number"""
        return self.db.session().query(Account).filter(
            Account.account_number == account_number
        ).first()

    def get_accounts_by_customer(self, customer_id: str) -> list:
        """Get all accounts for a customer"""
        return self.db.session().query(Account).filter(
            Account.customer_id == customer_id
        ).all()

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
        transaction = Transaction(account_id=account_id, amount=amount, transaction_type="deposit")
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
        return transaction.id

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

    def update_account_status(self, account_number: str, status: str) -> bool:
        """Update account status"""
        try:
            account = self.get_account_by_number(account_number)
            if account:
                account.status = status
                self.db.save()
                return True
            return False
        except Exception as e:
            self.db.Rollback()
            print(f"Error updating account status: {e}")
            return False

    def update_account_balance(self, account_number: str, amount: float) -> bool:
        """Update account balance"""
        try:
            account = self.get_account_by_number(account_number)
            if account:
                account.balance += amount
                self.db.save()
                return True
            return False
        except Exception as e:
            self.db.Rollback()
            print(f"Error updating account balance: {e}")
            return False
