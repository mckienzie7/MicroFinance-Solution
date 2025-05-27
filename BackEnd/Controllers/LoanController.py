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
        """Create a new loan application"""
        # Validate user_id and admin_id
        if not user_id or user_id == 'undefined':
            raise ValueError("Invalid user_id provided")
            
        if not admin_id or admin_id == 'undefined':
            raise ValueError("Invalid admin_id provided")
            
        print(f"Processing loan for user_id: {user_id} with admin_id: {admin_id}")
        
        # Find the user and admin
        customer = self.db.get(User, user_id)
        admin = self.db.get(User, admin_id)
        
        if not customer:
            raise ValueError("Customer not found")
            
        if not admin or not admin.admin:
            raise ValueError("Invalid admin selected")
        
        # Find or create an account for this user
        all_accounts = self.db.all(Account).values()
        account = None
        
        # Try to find an account for this user
        for acc in all_accounts:
            if acc.user_id == customer.id:
                account = acc
                break
        
        # If no account exists, create one
        if not account:
            account = Account(
                user_id=customer.id,
                account_type="savings",
                balance=1000.0,
                status="active"
            )
            self.db.new(account)
            self.db.save()

        # Calculate end date based on repayment period
        start_date = datetime.now()
        end_date = start_date + timedelta(days=repayment_period * 30)  # Assuming 30 days per month

        new_loan = Loan(
            user_id=user_id,
            admin_id=admin_id,
            account_id=account.id,
            amount=amount,
            interest_rate=interest_rate,
            repayment_period=repayment_period,
            purpose=purpose,
            start_date=start_date,
            end_date=end_date,
            loan_status="pending"
        )
        self.db.new(new_loan)
        self.db.save()
        return new_loan

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

        # Query transactions directly using SQLAlchemy
        return self.db.session().query(Transaction).filter(
            Transaction.account_id == loan.account_id,
            Transaction.transaction_type == "loan_repayment"
        ).order_by(Transaction.created_at.desc()).all()

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
