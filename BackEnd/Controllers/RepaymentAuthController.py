#!/usr/bin/python3
"""
Contains the class Repayment Authentication Controller
"""
from BackEnd.models import storage
from BackEnd.models.Loan import Loan
from BackEnd.models.Account import Account
from BackEnd.models.Repayment import Repayment
from sqlalchemy.orm.exc import NoResultFound


class RepaymentAuthController:
    """
    RepaymentAuthController class for handling repayment validation and authentication
    """

    def __init__(self):
        """Initialize RepaymentAuthController"""
        self.db = storage

    def verify_loan_for_repayment(self, user_id: int, loan_id: int) -> Loan:
        """Check if the loan is valid and belongs to the user"""
        loan = self.db.get(Loan, loan_id)
        if not loan or loan.user_id != user_id:
            raise NoResultFound("Loan not found or not authorized")
        return loan

    def check_funds(self, user_id: int, amount: float) -> Account:
        """Check if the user has sufficient funds in their account"""
        account = self.db.get_by_user_id(Account, user_id)
        if not account or account.balance < amount:
            raise ValueError("Insufficient funds")
        return account

    def verify_repayment_exists(self, repayment_id: int) -> Repayment:
        """Verify if a repayment exists"""
        repayment = self.db.get(Repayment, repayment_id)
        if not repayment:
            raise NoResultFound("Repayment not found")
        return repayment
