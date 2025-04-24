#!/usr/bin/python3
"""
Contains the class Repayment Controller
"""
from BackEnd.models import storage
from BackEnd.models.Repayment import Repayment
from sqlalchemy.orm.exc import NoResultFound
from BackEnd.Controllers.RepaymentAuthController import RepaymentAuthController


class RepaymentController:
    """
    RepaymentController class for managing loan repayments
    """

    def __init__(self):
        """Initialize RepaymentController with storage and authentication controller"""
        self.db = storage
        self.auth = RepaymentAuthController()

    def make_repayment(self, user_id: int, loan_id: int, amount: float) -> Repayment:
        """Make a loan repayment"""
        loan = self.auth.verify_loan_for_repayment(user_id, loan_id)
        account = self.auth.check_funds(user_id, amount)

        account.balance -= amount
        loan.remaining_balance -= amount

        new_repayment = Repayment(user_id=user_id, loan_id=loan_id, amount=amount)
        self.db.new(new_repayment)
        self.db.save()

        if loan.remaining_balance <= 0:
            loan.status = "Paid"
            self.db.save()

        return new_repayment

    def get_repayment_schedule(self, user_id: int):
        """Get the repayment schedule for the user"""
        repayments = self.db.get_all_by_user_id(Repayment, user_id)
        if not repayments:
            raise NoResultFound("No repayment records found")
        return repayments

    def update_repayment(self, repayment_id: int, **updates) -> None:
        """Update repayment information"""
        repayment = self.auth.verify_repayment_exists(repayment_id)

        for key, value in updates.items():
            if hasattr(Repayment, key):
                setattr(repayment, key, value)
            else:
                raise ValueError(f"Invalid field: {key}")
        self.db.save()

    def cancel_repayment(self, repayment_id: int) -> None:
        """Cancel a repayment (only if applicable, like scheduled repayments)"""
        repayment = self.auth.verify_repayment_exists(repayment_id)
        self.db.delete(repayment)
        self.db.save()
