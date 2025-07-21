#!/usr/bin/python3
"""
Comprehensive Credit Score Model
This is a new advanced credit scoring system that considers multiple factors:
- User details and account age
- Transaction history and patterns
- Deposit amounts and frequency
- Loan repayment pace and history
- Account balance trends
- Financial behavior patterns
"""

from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sqlalchemy import func, and_, or_
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')


class ComprehensiveCreditScoreModel:
    """
    Advanced AI-powered credit scoring model that analyzes comprehensive user financial behavior
    """
    
    def __init__(self):
        """Initialize the comprehensive credit score model"""
        self.score_weights = {
            'payment_history': 0.35,      # 35% - Most important factor
            'account_age': 0.15,          # 15% - Credit history length
            'transaction_patterns': 0.20,  # 20% - Transaction behavior
            'deposit_behavior': 0.15,     # 15% - Savings and deposit patterns
            'loan_management': 0.10,      # 10% - Loan handling
            'financial_stability': 0.05   # 5% - Overall stability indicators
        }
        
        # Score ranges
        self.score_ranges = {
            'excellent': (750, 850),
            'very_good': (700, 749),
            'good': (650, 699),
            'fair': (600, 649),
            'poor': (550, 599),
            'very_poor': (300, 549)
        }

    def calculate_comprehensive_credit_score(self, user_id: str, session) -> Dict:
        """
        Calculate comprehensive credit score considering all factors
        
        Args:
            user_id: User ID to calculate score for
            session: Database session
            
        Returns:
            Dictionary containing score and detailed breakdown
        """
        try:
            # Extract all user financial data
            user_data = self._extract_comprehensive_user_data(user_id, session)
            
            if not user_data:
                return self._default_score_response()
            
            # Calculate individual component scores
            payment_score = self._calculate_payment_history_score(user_data)
            age_score = self._calculate_account_age_score(user_data)
            transaction_score = self._calculate_transaction_pattern_score(user_data)
            deposit_score = self._calculate_deposit_behavior_score(user_data)
            loan_score = self._calculate_loan_management_score(user_data)
            stability_score = self._calculate_financial_stability_score(user_data)
            
            # Calculate weighted final score
            final_score = (
                payment_score * self.score_weights['payment_history'] +
                age_score * self.score_weights['account_age'] +
                transaction_score * self.score_weights['transaction_patterns'] +
                deposit_score * self.score_weights['deposit_behavior'] +
                loan_score * self.score_weights['loan_management'] +
                stability_score * self.score_weights['financial_stability']
            )
            
            # Ensure score is within valid range
            final_score = max(300, min(850, final_score))
            
            # Get score rating and detailed breakdown
            score_rating = self._get_score_rating(final_score)
            
            return {
                'credit_score': round(final_score),
                'score_rating': score_rating,
                'score_breakdown': {
                    'payment_history': {
                        'score': round(payment_score),
                        'weight': self.score_weights['payment_history'],
                        'contribution': round(payment_score * self.score_weights['payment_history'])
                    },
                    'account_age': {
                        'score': round(age_score),
                        'weight': self.score_weights['account_age'],
                        'contribution': round(age_score * self.score_weights['account_age'])
                    },
                    'transaction_patterns': {
                        'score': round(transaction_score),
                        'weight': self.score_weights['transaction_patterns'],
                        'contribution': round(transaction_score * self.score_weights['transaction_patterns'])
                    },
                    'deposit_behavior': {
                        'score': round(deposit_score),
                        'weight': self.score_weights['deposit_behavior'],
                        'contribution': round(deposit_score * self.score_weights['deposit_behavior'])
                    },
                    'loan_management': {
                        'score': round(loan_score),
                        'weight': self.score_weights['loan_management'],
                        'contribution': round(loan_score * self.score_weights['loan_management'])
                    },
                    'financial_stability': {
                        'score': round(stability_score),
                        'weight': self.score_weights['financial_stability'],
                        'contribution': round(stability_score * self.score_weights['financial_stability'])
                    }
                },
                'detailed_factors': self._get_detailed_factors(user_data, final_score),
                'recommendations': self._get_improvement_recommendations(user_data, final_score),
                'risk_assessment': self._assess_risk_level(final_score, user_data),
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error calculating comprehensive credit score: {e}")
            return self._default_score_response()

    def _extract_comprehensive_user_data(self, user_id: str, session) -> Optional[Dict]:
        """Extract comprehensive user financial data from database"""
        try:
            from BackEnd.models.user import User
            from BackEnd.models.Account import Account
            from BackEnd.models.Transaction import Transaction
            from BackEnd.models.Loan import Loan
            from BackEnd.models.Repayment import Repayment
            
            # Get user information
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            
            # Get user accounts
            accounts = session.query(Account).filter(Account.user_id == user_id).all()
            if not accounts:
                return None
            
            account_ids = [acc.id for acc in accounts]
            
            # Get all transactions
            transactions = session.query(Transaction).filter(
                Transaction.account_id.in_(account_ids)
            ).order_by(Transaction.created_at.desc()).all()
            
            # Get all loans
            loans = session.query(Loan).filter(Loan.account_id.in_(account_ids)).all()
            
            # Get all repayments
            loan_ids = [loan.id for loan in loans] if loans else []
            repayments = session.query(Repayment).filter(
                Repayment.loan_id.in_(loan_ids)
            ).all() if loan_ids else []
            
            # Compile comprehensive data
            user_data = {
                'user': user,
                'accounts': accounts,
                'transactions': transactions,
                'loans': loans,
                'repayments': repayments,
                'account_ids': account_ids,
                'loan_ids': loan_ids
            }
            
            return user_data
            
        except Exception as e:
            print(f"Error extracting user data: {e}")
            return None

    def _calculate_payment_history_score(self, user_data: Dict) -> float:
        """Calculate payment history score (35% weight)"""
        loans = user_data['loans']
        repayments = user_data['repayments']
        transactions = user_data['transactions']
        
        if not loans:
            return 750  # No loans is neutral, not bad
        
        # Calculate repayment metrics
        total_loan_amount = sum(loan.amount for loan in loans)
        total_repayments = sum(repayment.amount for repayment in repayments if repayment.status == 'completed')
        
        # Calculate repayment ratio
        repayment_ratio = min(1.0, total_repayments / max(total_loan_amount, 1))
        
        # Count on-time payments (loan_repayment transactions)
        loan_repayment_transactions = [t for t in transactions if t.transaction_type == 'loan_repayment']
        
        # Calculate payment consistency
        payment_consistency = self._calculate_payment_consistency(loan_repayment_transactions)
        
        # Count overdue loans
        current_date = datetime.now()
        overdue_loans = len([loan for loan in loans 
                           if loan.loan_status == 'active' and loan.end_date and loan.end_date < current_date])
        
        # Calculate base score
        base_score = 300
        
        # Repayment ratio contribution (0-300 points)
        base_score += repayment_ratio * 300
        
        # Payment consistency contribution (0-150 points)
        base_score += payment_consistency * 150
        
        # Penalty for overdue loans (-50 points per overdue loan)
        base_score -= overdue_loans * 50
        
        # Bonus for recent payment activity (0-50 points)
        recent_payments = len([t for t in loan_repayment_transactions 
                             if (current_date - t.created_at).days <= 30])
        base_score += min(50, recent_payments * 10)
        
        return max(300, min(850, base_score))

    def _calculate_account_age_score(self, user_data: Dict) -> float:
        """Calculate account age score (15% weight)"""
        user = user_data['user']
        accounts = user_data['accounts']
        
        # Use user creation date as primary indicator
        if user.created_at:
            account_age_days = (datetime.now() - user.created_at).days
        else:
            # Fallback to oldest account
            oldest_account = min(accounts, key=lambda x: x.created_at)
            account_age_days = (datetime.now() - oldest_account.created_at).days
        
        # Score calculation based on age
        if account_age_days >= 1095:  # 3+ years
            return 800
        elif account_age_days >= 730:  # 2+ years
            return 750
        elif account_age_days >= 365:  # 1+ year
            return 700
        elif account_age_days >= 180:  # 6+ months
            return 650
        elif account_age_days >= 90:   # 3+ months
            return 600
        else:  # Less than 3 months
            return 550

    def _calculate_transaction_pattern_score(self, user_data: Dict) -> float:
        """Calculate transaction pattern score (20% weight)"""
        transactions = user_data['transactions']
        
        if not transactions:
            return 400  # Low score for no activity
        
        # Analyze transaction patterns
        transaction_count = len(transactions)
        
        # Calculate transaction frequency (transactions per month)
        if transactions:
            oldest_transaction = min(transactions, key=lambda x: x.created_at)
            days_active = max(1, (datetime.now() - oldest_transaction.created_at).days)
            monthly_frequency = (transaction_count / max(days_active, 1)) * 30
        else:
            monthly_frequency = 0
        
        # Calculate transaction diversity
        transaction_types = set(t.transaction_type for t in transactions)
        diversity_score = len(transaction_types) * 20  # More types = better
        
        # Calculate average transaction amount
        amounts = [abs(t.amount) for t in transactions]
        avg_amount = np.mean(amounts) if amounts else 0
        
        # Calculate transaction regularity
        regularity_score = self._calculate_transaction_regularity(transactions)
        
        # Base score calculation
        base_score = 300
        
        # Frequency contribution (0-200 points)
        base_score += min(200, monthly_frequency * 10)
        
        # Diversity contribution (0-100 points)
        base_score += min(100, diversity_score)
        
        # Regularity contribution (0-150 points)
        base_score += regularity_score * 150
        
        # Average amount bonus (0-100 points)
        if avg_amount > 1000:
            base_score += min(100, (avg_amount / 1000) * 20)
        
        return max(300, min(850, base_score))

    def _calculate_deposit_behavior_score(self, user_data: Dict) -> float:
        """Calculate deposit behavior score (15% weight)"""
        transactions = user_data['transactions']
        accounts = user_data['accounts']
        
        # Filter deposit transactions
        deposits = [t for t in transactions if t.transaction_type in ['deposit', 'credit'] and t.amount > 0]
        
        if not deposits:
            return 400  # Low score for no deposits
        
        # Calculate deposit metrics
        total_deposits = sum(t.amount for t in deposits)
        deposit_count = len(deposits)
        avg_deposit = total_deposits / max(deposit_count, 1)
        
        # Calculate deposit frequency
        if deposits:
            oldest_deposit = min(deposits, key=lambda x: x.created_at)
            days_active = max(1, (datetime.now() - oldest_deposit.created_at).days)
            monthly_deposit_frequency = (deposit_count / max(days_active, 1)) * 30
        else:
            monthly_deposit_frequency = 0
        
        # Calculate deposit consistency
        deposit_consistency = self._calculate_deposit_consistency(deposits)
        
        # Current balance consideration
        total_balance = sum(acc.balance for acc in accounts)
        
        # Base score calculation
        base_score = 300
        
        # Total deposits contribution (0-200 points)
        base_score += min(200, (total_deposits / 10000) * 100)
        
        # Frequency contribution (0-150 points)
        base_score += min(150, monthly_deposit_frequency * 30)
        
        # Consistency contribution (0-100 points)
        base_score += deposit_consistency * 100
        
        # Current balance contribution (0-100 points)
        base_score += min(100, (total_balance / 5000) * 50)
        
        return max(300, min(850, base_score))

    def _calculate_loan_management_score(self, user_data: Dict) -> float:
        """Calculate loan management score (10% weight)"""
        loans = user_data['loans']
        repayments = user_data['repayments']
        
        if not loans:
            return 750  # No loans is neutral
        
        # Calculate loan metrics
        total_loans = len(loans)
        active_loans = len([l for l in loans if l.loan_status == 'active'])
        repaid_loans = len([l for l in loans if l.loan_status == 'repaid'])
        rejected_loans = len([l for l in loans if l.loan_status == 'rejected'])
        
        # Calculate repayment performance
        completed_repayments = len([r for r in repayments if r.status == 'completed'])
        total_repayment_amount = sum(r.amount for r in repayments if r.status == 'completed')
        
        # Base score calculation
        base_score = 500
        
        # Repaid loans bonus (0-200 points)
        if total_loans > 0:
            repayment_rate = repaid_loans / total_loans
            base_score += repayment_rate * 200
        
        # Active loan management (0-100 points)
        if active_loans <= 2:  # Manageable number of active loans
            base_score += 100
        elif active_loans <= 4:
            base_score += 50
        else:
            base_score -= 50  # Too many active loans
        
        # Repayment activity bonus (0-100 points)
        base_score += min(100, completed_repayments * 20)
        
        # Penalty for rejected loans (-30 points per rejection)
        base_score -= rejected_loans * 30
        
        return max(300, min(850, base_score))

    def _calculate_financial_stability_score(self, user_data: Dict) -> float:
        """Calculate financial stability score (5% weight)"""
        accounts = user_data['accounts']
        transactions = user_data['transactions']
        
        # Calculate balance stability
        total_balance = sum(acc.balance for acc in accounts)
        balance_history = self._calculate_balance_history(transactions, total_balance)
        balance_volatility = np.std(balance_history) if len(balance_history) > 1 else 0
        
        # Calculate overdraft usage
        overdraft_accounts = len([acc for acc in accounts if acc.balance < 0])
        overdraft_ratio = overdraft_accounts / max(len(accounts), 1)
        
        # Calculate account utilization
        withdrawals = [t for t in transactions if t.transaction_type in ['withdrawal', 'debit'] and t.amount < 0]
        deposits = [t for t in transactions if t.transaction_type in ['deposit', 'credit'] and t.amount > 0]
        
        total_withdrawals = sum(abs(t.amount) for t in withdrawals)
        total_deposits = sum(t.amount for t in deposits)
        
        utilization_ratio = total_withdrawals / max(total_deposits, 1) if total_deposits > 0 else 0
        
        # Base score calculation
        base_score = 500
        
        # Balance stability contribution (0-150 points)
        if balance_volatility < 1000:
            base_score += 150
        elif balance_volatility < 5000:
            base_score += 100
        else:
            base_score += 50
        
        # Overdraft penalty (0-100 points)
        base_score -= overdraft_ratio * 100
        
        # Utilization score (0-100 points)
        if utilization_ratio < 0.3:  # Low utilization is good
            base_score += 100
        elif utilization_ratio < 0.7:
            base_score += 50
        else:
            base_score += 0  # High utilization
        
        # Current balance bonus (0-100 points)
        if total_balance > 10000:
            base_score += 100
        elif total_balance > 5000:
            base_score += 50
        
        return max(300, min(850, base_score))

    def _calculate_payment_consistency(self, payment_transactions: List) -> float:
        """Calculate payment consistency score (0-1)"""
        if len(payment_transactions) < 2:
            return 0.5
        
        # Sort by date
        sorted_payments = sorted(payment_transactions, key=lambda x: x.created_at)
        
        # Calculate intervals between payments
        intervals = []
        for i in range(1, len(sorted_payments)):
            interval = (sorted_payments[i].created_at - sorted_payments[i-1].created_at).days
            intervals.append(interval)
        
        if not intervals:
            return 0.5
        
        # Calculate consistency based on standard deviation
        std_interval = np.std(intervals)
        mean_interval = np.mean(intervals)
        
        # Lower standard deviation relative to mean indicates more consistency
        consistency = max(0, 1 - (std_interval / max(mean_interval, 1)))
        return min(consistency, 1.0)

    def _calculate_transaction_regularity(self, transactions: List) -> float:
        """Calculate transaction regularity score (0-1)"""
        if len(transactions) < 3:
            return 0.3
        
        # Group transactions by month
        monthly_counts = {}
        for transaction in transactions:
            month_key = transaction.created_at.strftime('%Y-%m')
            monthly_counts[month_key] = monthly_counts.get(month_key, 0) + 1
        
        if len(monthly_counts) < 2:
            return 0.3
        
        # Calculate regularity based on consistency of monthly activity
        monthly_values = list(monthly_counts.values())
        std_monthly = np.std(monthly_values)
        mean_monthly = np.mean(monthly_values)
        
        regularity = max(0, 1 - (std_monthly / max(mean_monthly, 1)))
        return min(regularity, 1.0)

    def _calculate_deposit_consistency(self, deposits: List) -> float:
        """Calculate deposit consistency score (0-1)"""
        if len(deposits) < 2:
            return 0.3
        
        # Calculate deposit amount consistency
        amounts = [d.amount for d in deposits]
        std_amount = np.std(amounts)
        mean_amount = np.mean(amounts)
        
        amount_consistency = max(0, 1 - (std_amount / max(mean_amount, 1)))
        
        # Calculate deposit timing consistency
        timing_consistency = self._calculate_payment_consistency(deposits)
        
        # Combined consistency score
        return (amount_consistency + timing_consistency) / 2

    def _calculate_balance_history(self, transactions: List, current_balance: float) -> List[float]:
        """Calculate historical balance progression"""
        if not transactions:
            return [current_balance]
        
        # Sort transactions by date (newest first)
        sorted_transactions = sorted(transactions, key=lambda x: x.created_at, reverse=True)
        
        balances = [current_balance]
        running_balance = current_balance
        
        # Reconstruct balance history (last 60 transactions)
        for transaction in sorted_transactions[:60]:
            if transaction.transaction_type in ['withdrawal', 'debit', 'loan_repayment']:
                running_balance += abs(transaction.amount)
            else:
                running_balance -= transaction.amount
            balances.append(running_balance)
        
        return balances

    def _get_score_rating(self, score: float) -> str:
        """Get score rating based on score value"""
        for rating, (min_score, max_score) in self.score_ranges.items():
            if min_score <= score <= max_score:
                return rating
        return 'unknown'

    def _get_detailed_factors(self, user_data: Dict, final_score: float) -> List[Dict]:
        """Get detailed factors affecting the credit score"""
        factors = []
        
        # Payment History Factor
        loans = user_data['loans']
        repayments = user_data['repayments']
        
        if loans:
            total_loan_amount = sum(loan.amount for loan in loans)
            total_repayments = sum(r.amount for r in repayments if r.status == 'completed')
            repayment_ratio = min(1.0, total_repayments / max(total_loan_amount, 1))
            
            if repayment_ratio >= 0.9:
                factors.append({
                    'category': 'Payment History',
                    'status': 'excellent',
                    'impact': 'very_high',
                    'description': f'Outstanding payment history with {repayment_ratio*100:.1f}% repayment rate',
                    'score_impact': 35
                })
            elif repayment_ratio >= 0.7:
                factors.append({
                    'category': 'Payment History',
                    'status': 'good',
                    'impact': 'high',
                    'description': f'Good payment history with {repayment_ratio*100:.1f}% repayment rate',
                    'score_impact': 25
                })
            else:
                factors.append({
                    'category': 'Payment History',
                    'status': 'needs_improvement',
                    'impact': 'high',
                    'description': f'Payment history needs improvement - {repayment_ratio*100:.1f}% repayment rate',
                    'score_impact': -15
                })
        
        # Account Age Factor
        user = user_data['user']
        if user.created_at:
            account_age_days = (datetime.now() - user.created_at).days
            years = account_age_days / 365
            
            if years >= 2:
                factors.append({
                    'category': 'Account Age',
                    'status': 'excellent',
                    'impact': 'medium',
                    'description': f'Established credit history of {years:.1f} years',
                    'score_impact': 15
                })
            elif years >= 1:
                factors.append({
                    'category': 'Account Age',
                    'status': 'good',
                    'impact': 'medium',
                    'description': f'Good credit history length of {years:.1f} years',
                    'score_impact': 10
                })
            else:
                factors.append({
                    'category': 'Account Age',
                    'status': 'building',
                    'impact': 'low',
                    'description': f'Building credit history - {years:.1f} years',
                    'score_impact': 5
                })
        
        # Transaction Activity Factor
        transactions = user_data['transactions']
        if transactions:
            monthly_activity = len(transactions) / max(1, (datetime.now() - min(t.created_at for t in transactions)).days / 30)
            
            if monthly_activity >= 10:
                factors.append({
                    'category': 'Transaction Activity',
                    'status': 'excellent',
                    'impact': 'medium',
                    'description': f'Very active account with {monthly_activity:.1f} transactions per month',
                    'score_impact': 20
                })
            elif monthly_activity >= 5:
                factors.append({
                    'category': 'Transaction Activity',
                    'status': 'good',
                    'impact': 'medium',
                    'description': f'Good account activity with {monthly_activity:.1f} transactions per month',
                    'score_impact': 15
                })
            else:
                factors.append({
                    'category': 'Transaction Activity',
                    'status': 'low',
                    'impact': 'low',
                    'description': f'Low account activity with {monthly_activity:.1f} transactions per month',
                    'score_impact': 5
                })
        
        # Financial Stability Factor
        accounts = user_data['accounts']
        total_balance = sum(acc.balance for acc in accounts)
        
        if total_balance >= 10000:
            factors.append({
                'category': 'Financial Stability',
                'status': 'excellent',
                'impact': 'medium',
                'description': f'Strong financial position with {total_balance:.2f} ETB balance',
                'score_impact': 15
            })
        elif total_balance >= 5000:
            factors.append({
                'category': 'Financial Stability',
                'status': 'good',
                'impact': 'low',
                'description': f'Stable financial position with {total_balance:.2f} ETB balance',
                'score_impact': 10
            })
        else:
            factors.append({
                'category': 'Financial Stability',
                'status': 'building',
                'impact': 'low',
                'description': f'Building financial stability - current balance {total_balance:.2f} ETB',
                'score_impact': 0
            })
        
        return factors

    def _get_improvement_recommendations(self, user_data: Dict, final_score: float) -> List[str]:
        """Get personalized recommendations to improve credit score"""
        recommendations = []
        
        loans = user_data['loans']
        repayments = user_data['repayments']
        transactions = user_data['transactions']
        accounts = user_data['accounts']
        
        # Payment history recommendations
        if loans:
            total_loan_amount = sum(loan.amount for loan in loans)
            total_repayments = sum(r.amount for r in repayments if r.status == 'completed')
            repayment_ratio = total_repayments / max(total_loan_amount, 1)
            
            if repayment_ratio < 0.8:
                recommendations.append("Focus on making all loan payments on time to improve your payment history")
                recommendations.append("Consider setting up automatic payments to avoid missing due dates")
        
        # Transaction activity recommendations
        if len(transactions) < 20:
            recommendations.append("Increase your account activity with regular transactions")
            recommendations.append("Use your account for daily financial activities to build transaction history")
        
        # Balance recommendations
        total_balance = sum(acc.balance for acc in accounts)
        if total_balance < 5000:
            recommendations.append("Build your savings to demonstrate financial stability")
            recommendations.append("Maintain a higher account balance to improve your credit profile")
        
        # Deposit recommendations
        deposits = [t for t in transactions if t.transaction_type in ['deposit', 'credit'] and t.amount > 0]
        if len(deposits) < 10:
            recommendations.append("Make regular deposits to show consistent income and savings behavior")
        
        # Loan management recommendations
        active_loans = [l for l in loans if l.loan_status == 'active']
        if len(active_loans) > 3:
            recommendations.append("Consider reducing the number of active loans for better debt management")
        
        # Account age recommendations
        user = user_data['user']
        if user.created_at:
            account_age_days = (datetime.now() - user.created_at).days
            if account_age_days < 180:
                recommendations.append("Continue building your credit history over time")
        
        # Overdraft recommendations
        overdraft_accounts = [acc for acc in accounts if acc.balance < 0]
        if overdraft_accounts:
            recommendations.append("Avoid overdrafts by maintaining positive account balances")
        
        # Default recommendations for good scores
        if final_score >= 700 and not recommendations:
            recommendations = [
                "Maintain your excellent financial habits",
                "Continue making timely payments",
                "Keep your account active with regular transactions",
                "Monitor your credit score regularly"
            ]
        elif not recommendations:
            recommendations = [
                "Focus on building consistent financial habits",
                "Make regular deposits and maintain account activity",
                "Pay all loans on time",
                "Build your savings gradually"
            ]
        
        return recommendations[:6]  # Limit to 6 recommendations

    def _assess_risk_level(self, final_score: float, user_data: Dict) -> Dict:
        """Assess risk level based on score and user data"""
        if final_score >= 750:
            risk_level = 'very_low'
            risk_description = 'Excellent creditworthiness with very low default risk'
        elif final_score >= 700:
            risk_level = 'low'
            risk_description = 'Good creditworthiness with low default risk'
        elif final_score >= 650:
            risk_level = 'moderate'
            risk_description = 'Fair creditworthiness with moderate risk'
        elif final_score >= 600:
            risk_level = 'high'
            risk_description = 'Below average creditworthiness with high risk'
        else:
            risk_level = 'very_high'
            risk_description = 'Poor creditworthiness with very high default risk'
        
        # Additional risk factors
        risk_factors = []
        loans = user_data['loans']
        accounts = user_data['accounts']
        
        # Check for overdue loans
        current_date = datetime.now()
        overdue_loans = [l for l in loans if l.loan_status == 'active' and l.end_date and l.end_date < current_date]
        if overdue_loans:
            risk_factors.append(f"{len(overdue_loans)} overdue loan(s)")
        
        # Check for negative balances
        negative_accounts = [acc for acc in accounts if acc.balance < 0]
        if negative_accounts:
            risk_factors.append(f"{len(negative_accounts)} account(s) with negative balance")
        
        # Check for high loan-to-deposit ratio
        deposits = [t for t in user_data['transactions'] if t.transaction_type in ['deposit', 'credit'] and t.amount > 0]
        total_deposits = sum(t.amount for t in deposits)
        total_loan_amount = sum(loan.amount for loan in loans)
        
        if total_deposits > 0 and (total_loan_amount / total_deposits) > 0.8:
            risk_factors.append("High loan-to-deposit ratio")
        
        return {
            'risk_level': risk_level,
            'risk_description': risk_description,
            'risk_factors': risk_factors,
            'recommended_loan_limit': self._calculate_recommended_loan_limit(final_score, user_data)
        }

    def _calculate_recommended_loan_limit(self, final_score: float, user_data: Dict) -> float:
        """Calculate recommended loan limit based on score and financial data"""
        accounts = user_data['accounts']
        transactions = user_data['transactions']
        
        # Base limit based on credit score
        if final_score >= 750:
            base_multiplier = 5.0
        elif final_score >= 700:
            base_multiplier = 4.0
        elif final_score >= 650:
            base_multiplier = 3.0
        elif final_score >= 600:
            base_multiplier = 2.0
        else:
            base_multiplier = 1.0
        
        # Calculate average monthly deposits
        deposits = [t for t in transactions if t.transaction_type in ['deposit', 'credit'] and t.amount > 0]
        if deposits:
            total_deposits = sum(t.amount for t in deposits)
            oldest_deposit = min(deposits, key=lambda x: x.created_at)
            months_active = max(1, (datetime.now() - oldest_deposit.created_at).days / 30)
            monthly_deposits = total_deposits / months_active
        else:
            monthly_deposits = 0
        
        # Current balance consideration
        total_balance = sum(acc.balance for acc in accounts)
        
        # Calculate recommended limit
        balance_based_limit = total_balance * base_multiplier
        income_based_limit = monthly_deposits * 6 * base_multiplier  # 6 months of deposits
        
        # Take the higher of the two, but cap at reasonable limits
        recommended_limit = max(balance_based_limit, income_based_limit)
        
        # Apply caps based on score
        if final_score >= 750:
            max_limit = 100000
        elif final_score >= 700:
            max_limit = 75000
        elif final_score >= 650:
            max_limit = 50000
        elif final_score >= 600:
            max_limit = 25000
        else:
            max_limit = 10000
        
        return min(recommended_limit, max_limit)

    def _default_score_response(self) -> Dict:
        """Return default score response for new users or errors"""
        return {
            'credit_score': 350,
            'score_rating': 'very_poor',
            'score_breakdown': {
                'payment_history': {'score': 350, 'weight': 0.35, 'contribution': 122},
                'account_age': {'score': 350, 'weight': 0.15, 'contribution': 52},
                'transaction_patterns': {'score': 350, 'weight': 0.20, 'contribution': 70},
                'deposit_behavior': {'score': 350, 'weight': 0.15, 'contribution': 52},
                'loan_management': {'score': 350, 'weight': 0.10, 'contribution': 35},
                'financial_stability': {'score': 350, 'weight': 0.05, 'contribution': 17}
            },
            'detailed_factors': [
                {
                    'category': 'New User',
                    'status': 'building',
                    'impact': 'high',
                    'description': 'New user with limited credit history',
                    'score_impact': 0
                }
            ],
            'recommendations': [
                'Start building your credit history with regular account activity',
                'Make deposits to establish financial stability',
                'Use your account regularly for transactions',
                'Build a positive payment history over time'
            ],
            'risk_assessment': {
                'risk_level': 'very_high',
                'risk_description': 'New user with no established credit history',
                'risk_factors': ['No credit history', 'New account'],
                'recommended_loan_limit': 1000
            },
            'last_updated': datetime.now().isoformat()
        }