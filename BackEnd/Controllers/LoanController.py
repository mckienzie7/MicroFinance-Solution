#!/usr/bin/python3
"""
Contains the class Loan Controller
"""
from BackEnd.models import storage
from BackEnd.models.Loan import Loan
from BackEnd.models.Account import Account
from BackEnd.models.Transaction import Transaction
from BackEnd.models.user import User
from sqlalchemy.orm.exc import NoResultFound
from BackEnd.Controllers.LoanAuthController import LoanAuthController
from datetime import datetime, timedelta
from typing import List, Tuple
from BackEnd.Controllers.CreditScoringController import CreditScoringController


class LoanController:
    """
    LoanController class for handling loan operations
    """

    def __init__(self):
        """Initialize the LoanController with database storage and authentication controller"""
        self.db = storage
        self.auth = LoanAuthController()

    def apply_loan(self, user_id: str, amount: float, interest_rate: float,
                   repayment_period: int, purpose: str, admin_id: str) -> Loan:
        """Apply for a loan (regular user)"""
        try:
            # Verify user eligibility with AI credit scoring
            credit_scoring = CreditScoringController()
            credit_result = credit_scoring.get_user_credit_score(user_id)
            
            # Check if result is an error tuple
            if isinstance(credit_result, tuple):
                raise ValueError(f"Credit scoring failed: {credit_result[0].get('error')}")
            
            credit_score = credit_result["score"]
            
            # Evaluate loan risk
            risk_result = credit_scoring.evaluate_loan_risk(user_id, amount, repayment_period)
            
            # Check if result is an error tuple
            if isinstance(risk_result, tuple):
                raise ValueError(f"Risk evaluation failed: {risk_result[0].get('error')}")
            
            # Check if credit score is sufficient (minimum 550)
            if credit_score < 550:
                raise ValueError(f"Credit score too low ({credit_score}). Minimum required: 550")
            
            # Check if loan amount is within recommended range
            max_recommended = risk_result["max_recommended_amount"]
            if amount > max_recommended:
                raise ValueError(f"Requested amount ({amount}) exceeds maximum recommended ({max_recommended})")
            
            # Get the account for this user
            user = self.db.get(User, user_id)
            if not user:
                raise NoResultFound("User not found")
            
            # Get the account (assuming one account per user)
            account = None
            for acc in self.db.all(Account).values():
                if acc.user_id == user_id:
                    account = acc
                    break
                
            if not account:
                raise NoResultFound("No account found for this user")
            
            # Get the admin
            admin = self.db.get(User, admin_id)
            if not admin or not admin.admin:
                raise ValueError("Invalid admin ID")
            
            # Suggest the AI recommended interest rate if needed
            suggested_rate = risk_result["recommended_interest_rate"]
            if interest_rate < suggested_rate:
                interest_rate = suggested_rate
            
            # Create the loan application
            new_loan = Loan(
                admin_id=admin_id,
                account_id=account.id,
                amount=amount,
                interest_rate=interest_rate,
                repayment_period=repayment_period,
                purpose=purpose
            )
            
            # Store credit score assessment with the loan
            setattr(new_loan, '_credit_score', credit_score)
            setattr(new_loan, '_risk_assessment', risk_result["risk_assessment"]["credit_risk"])
            
            self.db.new(new_loan)
            self.db.save()
            
            return new_loan
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Error applying for loan: {str(e)}")

    def approve_loan(self, loan_id: str, admin_id: str) -> Loan:
        """Approve a loan (Admin only)"""
        try:
            loan = self.db.get(Loan, loan_id)
            if not loan:
                raise NoResultFound("Loan not found")

            if loan.loan_status != "pending":
                raise ValueError("Only pending loans can be approved")

            # Verify admin
            admin = self.db.get(User, admin_id)
            if not admin or not admin.admin:
                raise ValueError("Invalid admin")

            account = self.db.get(Account, loan.account_id)
            if not account:
                raise NoResultFound("Account not found")

            # Calculate loan details
            total_interest = loan.amount * (loan.interest_rate / 100) * (loan.repayment_period / 12)
            total_amount = loan.amount + total_interest
            monthly_payment = total_amount / loan.repayment_period

            # Update loan status and details
            loan.loan_status = "active"
            loan.start_date = datetime.now()
            loan.end_date = loan.start_date + timedelta(days=30 * loan.repayment_period)
            loan.next_payment_date = loan.start_date + timedelta(days=30)
            loan.remaining_balance = total_amount
            loan.total_interest = total_interest
            loan.monthly_payment = monthly_payment

            # Create transaction for loan disbursement
            transaction = Transaction(
                account_id=account.id,
                amount=loan.amount,
                transaction_type="loan_disbursement",
                description=f"Loan disbursement for loan {loan_id}"
            )
            self.db.new(transaction)

            # Update account balance
            account.balance += loan.amount
            self.db.save()

            return loan
        except Exception as e:
            # Use the correct method name for rollback
            self.db.Rollback()
            raise ValueError(f"Error approving loan: {str(e)}")

    def make_repayment(self, loan_id: str, amount: float) -> Tuple[Transaction, Loan]:
        """
        Make a loan repayment
        Args:
            loan_id: The ID of the loan to repay
            amount: The amount to repay
        Returns:
            Tuple of (transaction, loan)
        """
        loan = self.db.get(Loan, loan_id)
        if not loan:
            raise NoResultFound("Loan not found")

        if loan.loan_status != "active":
            raise ValueError("Can only make repayments on active loans")

        account = self.db.get(Account, loan.account_id)
        if not account:
            raise NoResultFound("Account not found")

        if account.balance < amount:
            raise ValueError("Insufficient funds for repayment")

        # Create repayment transaction
        transaction = Transaction(
            account_id=account.id,
            amount=-amount,  # Negative amount for repayment
            transaction_type="loan_repayment",
            description=f"Loan repayment for loan {loan_id}"
        )
        self.db.new(transaction)

        # Update account balance
        account.balance -= amount

        # Update loan status if fully repaid
        if amount >= loan.amount:
            loan.loan_status = "paid"
            loan.end_date = datetime.now()

        self.db.save()
        return transaction, loan

    def get_repayment_schedule(self, loan_id: str) -> List[dict]:
        """
        Get the repayment schedule for a loan
        Args:
            loan_id: The ID of the loan
        Returns:
            List of dictionaries containing repayment schedule
        """
        loan = self.db.get(Loan, loan_id)
        if not loan:
            raise NoResultFound("Loan not found")

        monthly_payment = self._calculate_monthly_payment(loan)
        schedule = []
        current_date = loan.start_date

        for month in range(loan.repayment_period):
            schedule.append({
                "due_date": current_date + timedelta(days=30 * (month + 1)),
                "amount": monthly_payment,
                "status": "pending"
            })

        return schedule

    def _calculate_monthly_payment(self, loan: Loan) -> float:
        """Calculate monthly payment amount"""
        # Simple interest calculation
        total_interest = loan.amount * (loan.interest_rate / 100) * (loan.repayment_period / 12)
        total_amount = loan.amount + total_interest
        return total_amount / loan.repayment_period

    def get_loan_repayments(self, loan_id: str) -> List[Transaction]:
        """Get all repayments for a loan"""
        loan = self.db.get(Loan, loan_id)
        if not loan:
            raise NoResultFound("Loan not found")

        return self.db.get_transactions_by_loan(loan_id)

    def update_loan(self, loan_id: str, **updates) -> Loan:
        """Update loan information"""
        loan = self.db.get(Loan, loan_id)
        if not loan:
            raise NoResultFound("Loan not found")

        ignore = ['id', 'created_at', 'updated_at', 'account_id', 'amount']
        for key, value in updates.items():
            if key not in ignore and hasattr(loan, key):
                setattr(loan, key, value)

        self.db.save()
        return loan

    def cancel_loan(self, loan: Loan) -> None:
        """Cancel a loan"""
        if not loan:
            raise ValueError("Loan not found")

        if loan.loan_status != "pending":
            raise ValueError("Can only delete pending loans")

        self.db.delete(loan)
        self.db.save()

    def reject_loan(self, loan_id: str, admin_id: str, reason: str) -> Loan:
        """
        Reject a loan application
        Args:
            loan_id: The ID of the loan to reject
            admin_id: The ID of the admin rejecting the loan
            reason: The reason for rejection
        Returns:
            The rejected loan
        """
        loan = self.db.get(Loan, loan_id)
        if not loan:
            raise NoResultFound("Loan not found")

        if loan.loan_status != "pending":
            raise ValueError("Only pending loans can be rejected")

        # Verify admin
        admin = self.db.get(User, admin_id)
        if not admin or not admin.admin:
            raise ValueError("Invalid admin")

        loan.loan_status = "rejected"
        loan.rejection_reason = reason
        self.db.save()
        return loan

    def get_admin_loans(self, admin_id: str) -> List[Loan]:
        """Get all loans assigned to a specific admin"""
        admin = self.db.get(User, admin_id)
        if not admin or not admin.admin:
            raise ValueError("Invalid admin ID")
            
        return self.db.session().query(Loan).filter(Loan.admin_id == admin_id).all()

    def get_unassigned_loans(self) -> List[Loan]:
        """Get all pending loans that haven't been assigned to an admin"""
        return self.db.session().query(Loan).filter(
            Loan.loan_status == "pending"
        ).all()

    def get_loan_repayment_schedule(self, loan_id: str) -> List[dict]:
        """
        Get the repayment schedule for a loan
        Args:
            loan_id: The ID of the loan
        Returns:
            List of dictionaries containing repayment schedule
        """
        loan = self.db.get(Loan, loan_id)
        if not loan:
            raise NoResultFound("Loan not found")

        if loan.loan_status not in ["active", "paid"]:
            raise ValueError("Can only get repayment schedule for active or paid loans")

        # Calculate schedule
        schedule = []
        current_date = loan.start_date
        remaining_balance = loan.remaining_balance
        monthly_payment = loan.monthly_payment

        for month in range(loan.repayment_period):
            payment_amount = monthly_payment
            if month == loan.repayment_period - 1:
                # Last payment might be slightly different due to rounding
                payment_amount = remaining_balance

            schedule.append({
                "due_date": current_date + timedelta(days=30 * (month + 1)),
                "amount": payment_amount,
                "status": "pending",
                "payment_number": month + 1,
                "remaining_balance": remaining_balance - payment_amount
            })
            remaining_balance -= payment_amount

        return schedule
