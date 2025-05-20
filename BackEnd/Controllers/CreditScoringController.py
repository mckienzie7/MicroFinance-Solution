#!/usr/bin/python3
"""
Contains the CreditScoringController class
"""
from BackEnd.models import storage
from BackEnd.models.user import User
from BackEnd.models.Loan import Loan
from BackEnd.models.Account import Account
from BackEnd.models.Repayment import Repayment
import numpy as np


class CreditScoringController:
    """
    CreditScoringController class for handling AI-based credit scoring
    """

    def __init__(self):
        """Initialize CreditScoringController"""
        self.db = storage
        self.min_score = 300
        self.max_score = 850
        
    def get_user_credit_score(self, user_id):
        """Calculate credit score for a user based on various factors"""
        try:
            # Get user data
            user = self.db.get(User, user_id)
            if not user:
                return {"error": "User not found"}, 404
                
            # Get all accounts for the user
            accounts = []
            for account in self.db.all(Account).values():
                if account.user_id == user_id:
                    accounts.append(account)
            
            if not accounts:
                # New user with no accounts yet
                return {"score": 600, "reason": "New user, default score assigned"}
            
            # Get all loans for the user
            loans = []
            for account in accounts:
                for loan in self.db.all(Loan).values():
                    if loan.account_id == account.id:
                        loans.append(loan)
            
            # Calculate base score
            base_score = 600  # Default score for new users
            
            # Adjust score based on account activity and balance
            account_score = self._calculate_account_score(accounts)
            
            # Adjust score based on loan repayment history
            loan_score = self._calculate_loan_score(loans)
            
            # Calculate final score
            final_score = base_score + account_score + loan_score
            
            # Ensure score is within valid range
            final_score = max(self.min_score, min(self.max_score, final_score))
            
            # Generate score reason
            reason = self._generate_score_reason(account_score, loan_score)
            
            return {
                "score": int(final_score),
                "reason": reason,
                "factors": {
                    "account_score": account_score,
                    "loan_score": loan_score
                }
            }
            
        except Exception as e:
            print(f"Error calculating credit score: {str(e)}")
            return {"error": str(e)}, 500
    
    def _calculate_account_score(self, accounts):
        """Calculate score component based on account factors"""
        if not accounts:
            return 0
            
        # Calculate average account balance
        total_balance = sum(account.balance for account in accounts)
        avg_balance = total_balance / len(accounts)
        
        # Score based on average balance
        if avg_balance > 10000:
            balance_score = 75
        elif avg_balance > 5000:
            balance_score = 50
        elif avg_balance > 1000:
            balance_score = 25
        else:
            balance_score = 0
            
        # Score based on account age (assuming created_at attribute exists)
        import datetime
        now = datetime.datetime.now()
        
        oldest_account = min(accounts, key=lambda a: now - a.created_at)
        account_age_days = (now - oldest_account.created_at).days
        
        if account_age_days > 365:  # More than 1 year
            age_score = 75
        elif account_age_days > 180:  # More than 6 months
            age_score = 50
        elif account_age_days > 90:  # More than 3 months
            age_score = 25
        else:
            age_score = 0
            
        return balance_score + age_score
    
    def _calculate_loan_score(self, loans):
        """Calculate score component based on loan history"""
        if not loans:
            return 0
            
        score = 0
        
        # Count paid loans
        paid_loans = sum(1 for loan in loans if loan.loan_status == "paid")
        
        # Count active loans
        active_loans = sum(1 for loan in loans if loan.loan_status == "active")
        
        # Count rejected loans
        rejected_loans = sum(1 for loan in loans if loan.loan_status == "rejected")
        
        # Award points for paid loans
        score += paid_loans * 50
        
        # Penalize for rejected loans
        score -= rejected_loans * 75
        
        # Check repayment history for active loans
        late_payments = 0
        for loan in loans:
            if hasattr(loan, 'repayments'):
                # Implementation would depend on how you track late payments
                # This is a placeholder logic
                pass
                
        # Penalize for late payments
        score -= late_payments * 25
        
        return score
    
    def _generate_score_reason(self, account_score, loan_score):
        """Generate human-readable reason for the score"""
        if account_score <= 0 and loan_score <= 0:
            return "Limited credit history"
            
        reasons = []
        
        if account_score > 100:
            reasons.append("Strong account history")
        elif account_score > 50:
            reasons.append("Good account standing")
        elif account_score > 0:
            reasons.append("Acceptable account activity")
        else:
            reasons.append("Limited account history")
            
        if loan_score > 50:
            reasons.append("Positive loan repayment history")
        elif loan_score > 0:
            reasons.append("Acceptable loan history")
        elif loan_score == 0:
            reasons.append("No loan history")
        else:
            reasons.append("Poor loan repayment history")
            
        return ", ".join(reasons)
    
    def evaluate_loan_risk(self, user_id, loan_amount, loan_period):
        """Evaluate the risk of a new loan application"""
        # Get user's credit score
        score_result = self.get_user_credit_score(user_id)
        
        if isinstance(score_result, tuple):
            # Error occurred
            return score_result
            
        credit_score = score_result["score"]
        
        # Get user's existing loans
        user = self.db.get(User, user_id)
        if not user:
            return {"error": "User not found"}, 404
            
        # Calculate risk factors
        risk_factors = []
        
        # 1. Credit score factor
        if credit_score >= 750:
            credit_risk = "very low"
            approval_odds = "very high"
        elif credit_score >= 700:
            credit_risk = "low"
            approval_odds = "high"
        elif credit_score >= 650:
            credit_risk = "moderate"
            approval_odds = "moderate"
        elif credit_score >= 600:
            credit_risk = "moderate to high"
            approval_odds = "moderate"
        elif credit_score >= 550:
            credit_risk = "high"
            approval_odds = "low"
        else:
            credit_risk = "very high"
            approval_odds = "very low"
            
        # 2. Calculate affordability
        accounts = []
        for account in self.db.all(Account).values():
            if account.user_id == user_id:
                accounts.append(account)
                
        total_balance = sum(account.balance for account in accounts) if accounts else 0
        
        # Simple affordability check (would need more sophisticated calculation in real app)
        monthly_payment = loan_amount * (1 + 0.08 / 12) / loan_period  # Simple calculation
        
        if total_balance > loan_amount * 2:
            affordability = "excellent"
        elif total_balance > loan_amount:
            affordability = "good"
        elif total_balance > monthly_payment * 3:
            affordability = "moderate"
        else:
            affordability = "poor"
            risk_factors.append("Insufficient funds for loan payments")
            
        # Compile results
        return {
            "user_id": user_id,
            "credit_score": credit_score,
            "loan_amount": loan_amount,
            "loan_period": loan_period,
            "risk_assessment": {
                "credit_risk": credit_risk,
                "affordability": affordability,
                "approval_odds": approval_odds,
                "risk_factors": risk_factors
            },
            "recommended_interest_rate": self._recommend_interest_rate(credit_score, loan_amount, loan_period),
            "max_recommended_amount": self._recommend_loan_amount(credit_score, total_balance)
        }
    
    def _recommend_interest_rate(self, credit_score, loan_amount, loan_period):
        """Recommend an interest rate based on credit score and other factors"""
        # Base rate
        if credit_score >= 750:
            base_rate = 8.0
        elif credit_score >= 700:
            base_rate = 10.0
        elif credit_score >= 650:
            base_rate = 12.0
        elif credit_score >= 600:
            base_rate = 15.0
        elif credit_score >= 550:
            base_rate = 18.0
        else:
            base_rate = 20.0
            
        # Adjust for loan amount
        if loan_amount > 10000:
            amount_adjustment = -0.5
        elif loan_amount > 5000:
            amount_adjustment = 0
        elif loan_amount > 1000:
            amount_adjustment = 0.5
        else:
            amount_adjustment = 1.0
            
        # Adjust for loan period
        if loan_period > 36:
            period_adjustment = 1.0
        elif loan_period > 24:
            period_adjustment = 0.5
        elif loan_period > 12:
            period_adjustment = 0
        else:
            period_adjustment = -0.5
            
        return round(base_rate + amount_adjustment + period_adjustment, 2)
    
    def _recommend_loan_amount(self, credit_score, total_balance):
        """Recommend a maximum loan amount based on credit score and account balance"""
        # Base factor based on credit score
        if credit_score >= 750:
            factor = 3.0
        elif credit_score >= 700:
            factor = 2.5
        elif credit_score >= 650:
            factor = 2.0
        elif credit_score >= 600:
            factor = 1.5
        elif credit_score >= 550:
            factor = 1.0
        else:
            factor = 0.5
            
        # Calculate max amount as a factor of total balance
        max_amount = total_balance * factor
        
        # Cap at reasonable amounts
        if credit_score < 550:
            max_amount = min(max_amount, 1000)
        elif credit_score < 650:
            max_amount = min(max_amount, 5000)
        elif credit_score < 750:
            max_amount = min(max_amount, 10000)
            
        return max(500, round(max_amount, -2))  # Round to nearest 100, minimum 500 