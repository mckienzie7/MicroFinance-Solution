#!/usr/bin/python3
"""
Contains the class Loan Authentication Controller
"""
import uuid
from models import storage
from models.Loan import Loan
from sqlalchemy.orm.exc import NoResultFound


def _generate_uuid() -> str:
    """Generates a unique identifier"""
    return str(uuid.uuid4())


class LoanAuthController:
    """
    LoanAuthController class to handle authentication and validation of loans
    """

    def __init__(self):
        """Initialize LoanAuthController"""
        self.db = storage

    def verify_loan_eligibility(self, user_id: int) -> bool:
        """Checks if the user is eligible for a loan"""
        credit_score = self.db.get_by_user_id("CreditScore", user_id)
        return credit_score and credit_score.score >= 600

    def generate_loan_id(self) -> str:
        """Generates a unique loan ID"""
        return _generate_uuid()

    def get_loan_status(self, loan_id: int) -> str:
        """Retrieve loan status by ID"""
        loan = self.db.get(Loan, loan_id)
        if not loan:
            raise NoResultFound("Loan not found")
        return loan.status

    def cancel_loan(self, loan_id: int) -> None:
        """Cancel a loan application if it's still pending"""
        loan = self.db.get(Loan, loan_id)
        if not loan:
            raise NoResultFound("Loan not found")

        if loan.status != "pending":
            raise ValueError("Only pending loans can be canceled")

        self.db.delete(loan)
        self.db.save()
