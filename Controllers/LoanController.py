#!/usr/bin/python3
"""
Contains the class Loan Controller
"""
from datetime import datetime
from models import storage
from models.Loan import Loan
from models.Account import Account
from models.credit_score import CreditScore
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.exc import InvalidRequestError
from Controllers.LoanAuthController import LoanAuthController


class LoanController:
    """
    LoanController class for handling loan operations
    """

    def __init__(self):
        """Initialize the LoanController with database storage and authentication controller"""
        self.db = storage
        self.auth = LoanAuthController()

    def apply_loan(self, user_id: int, amount: float, duration: int) -> Loan:
        """Apply for a loan"""
        if not self.auth.verify_loan_eligibility(user_id):
            raise ValueError("Loan application rejected due to low credit score")

        account = self.db.get_by_user_id(Account, user_id)
        if not account:
            raise ValueError("User has no account")

        new_loan = Loan(user_id=user_id, amount=amount, duration=duration, status="pending")
        self.db.new(new_loan)
        self.db.save()
        return new_loan

    def approve_loan(self, loan_id: int) -> None:
        """Approve a loan (Admin only)"""
        loan = self.db.get(Loan, loan_id)
        if not loan:
            raise NoResultFound("Loan not found")

        loan.status = "approved"
        account = self.db.get_by_user_id(Account, loan.user_id)
        account.balance += loan.amount  # Credit the loan amount
        self.db.save()

    def get_loans(self, user_id: int):
        """Retrieve all loans for a user"""
        return self.db.get_all_by_user_id(Loan, user_id)

    def update_loan(self, loan_id: int, **updates) -> None:
        """Update loan information"""
        loan = self.db.get(Loan, loan_id)
        if not loan:
            raise NoResultFound("Loan not found")

        for key, value in updates.items():
            if hasattr(Loan, key):
                setattr(loan, key, value)
            else:
                raise ValueError(f"Invalid field: {key}")
        self.db.save()

    def cancel_loan(self, loan_id: int) -> None:
        """Cancel a loan application if it's still pending"""
        self.auth.cancel_loan(loan_id)
