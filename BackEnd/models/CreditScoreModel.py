from datetime import datetime
import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func, and_, or_
import joblib

import warnings
warnings.filterwarnings('ignore')

class AICredoScoreModel:
    def __init__(self):
        """Initialize the AI Credit Score Model with pre-trained models"""
        self.rf_model = joblib.load('BackEnd/Credit_score/trained_models/random_forest_model.pkl')
        self.xgb_model = joblib.load('BackEnd/Credit_score/trained_models/xgboost_model.pkl')

        self.scaler = StandardScaler()
        self.feature_names = [
            'account_age_days', 'total_balance', 'transaction_count',
            'deposit_count', 'withdrawal_count', 'avg_transaction_amount',
            'total_deposits', 'total_withdrawals', 'loan_count',
            'total_loan_amount', 'avg_loan_amount', 'repaid_loans',
            'outstanding_loans', 'repayment_ratio', 'days_since_last_transaction',
            'balance_volatility', 'loan_to_deposit_ratio', 'account_utilization',
            'payment_consistency', 'overdraft_usage'
        ]

    def extract_user_features(self, user_id, session):
        """Extract comprehensive features for a user from the database"""
        from BackEnd.models.user import User
        from BackEnd.models.Account import Account
        from BackEnd.models.Transaction import Transaction
        from BackEnd.models.Loan import Loan
        from BackEnd.models.Repayment import Repayment
        
        try:
            # Get user and account information
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return None
                
            accounts = session.query(Account).filter(Account.user_id == user_id).all()
            if not accounts:
                return self._default_features()
            
            # Calculate account age - use user creation date for more accurate history
            if user.created_at:
                account_age_days = (datetime.now() - user.created_at).days
            else:
                # Fallback to oldest account if user creation date is missing
                oldest_account = min(accounts, key=lambda x: x.created_at)
                account_age_days = (datetime.now() - oldest_account.created_at).days
            
            # Calculate total balance
            total_balance = sum(account.balance for account in accounts)
            
            # Get all transactions
            account_ids = [acc.id for acc in accounts]
            transactions = session.query(Transaction).filter(
                Transaction.account_id.in_(account_ids)
            ).all()
            
            # Transaction analysis
            transaction_count = len(transactions)
            deposit_count = len([t for t in transactions if t.transaction_type in ['deposit', 'credit']])
            withdrawal_count = len([t for t in transactions if t.transaction_type in ['withdrawal', 'debit']])
            loan_repayment_count = len([t for t in transactions if t.transaction_type == 'loan_repayment'])
            
            if transactions:
                amounts = [abs(t.amount) for t in transactions]
                avg_transaction_amount = np.mean(amounts)
                total_deposits = sum(t.amount for t in transactions if t.amount > 0)
                total_withdrawals = sum(abs(t.amount) for t in transactions if t.amount < 0)
                
                # Calculate balance volatility
                daily_balances = self._calculate_daily_balances(transactions, total_balance)
                balance_volatility = np.std(daily_balances) if len(daily_balances) > 1 else 0
                
                # Days since last transaction  
                last_transaction_date = max(t.created_at for t in transactions)
                days_since_last_transaction = (datetime.now() - last_transaction_date).days
            else:
                avg_transaction_amount = 0
                total_deposits = 0
                total_withdrawals = 0
                balance_volatility = 0
                days_since_last_transaction = 999
            
            # Loan analysis
            loans = session.query(Loan).filter(Loan.account_id.in_(account_ids)).all()
            loan_count = len(loans)
            total_loan_amount = sum(loan.amount for loan in loans)
            avg_loan_amount = total_loan_amount / loan_count if loan_count > 0 else 0
            
            # Repayment analysis - calculate based on actual repayment records
            if loans:
                loan_ids = [loan.id for loan in loans]
                repayments = session.query(Repayment).filter(
                    Repayment.loan_id.in_(loan_ids),
                    Repayment.status == 'completed'
                ).all()
                
                # Calculate total repayments made
                total_repayments = sum(repayment.amount for repayment in repayments)
                
                # Calculate repayment ratio based on actual payments vs total loan amounts
                if total_loan_amount > 0:
                    repayment_ratio = min(1.0, total_repayments / total_loan_amount)
                else:
                    repayment_ratio = 1.0
                
                # Boost ratio for recent activity (active repayment behavior)
                if loan_repayment_count > 0:
                    recent_repayments = len([t for t in transactions 
                                           if t.transaction_type == 'loan_repayment' 
                                           and (datetime.now() - t.created_at).days <= 30])
                    
                    # Small bonus for active repayment behavior (max 10% boost)
                    activity_bonus = min(0.1, recent_repayments * 0.02)
                    repayment_ratio = min(1.0, repayment_ratio + activity_bonus)
                
                # Count loans by status
                repaid_loans = len([loan for loan in loans if loan.loan_status == 'repaid'])
                outstanding_loans = len([loan for loan in loans if loan.loan_status in ['approved', 'active']])
                loan_to_deposit_ratio = total_loan_amount / max(total_deposits, 1)
            else:
                repayment_ratio = 1.0  # No loans is considered good
                outstanding_loans = 0
                loan_to_deposit_ratio = 0
            
            # Account utilization and other metrics
            account_utilization = (total_withdrawals / max(total_deposits, 1)) if total_deposits > 0 else 0
            
            # Payment consistency (based on regular transaction patterns)
            payment_consistency = self._calculate_payment_consistency(transactions)
            
            # Overdraft usage
            overdraft_usage = sum(1 for acc in accounts if acc.balance < 0) / len(accounts)
            
            features = {
                'account_age_days': max(account_age_days, 1),
                'total_balance': max(total_balance, 0),
                'transaction_count': transaction_count,
                'deposit_count': deposit_count,
                'withdrawal_count': withdrawal_count,
                'avg_transaction_amount': avg_transaction_amount,
                'total_deposits': total_deposits,
                'total_withdrawals': total_withdrawals,
                'loan_count': loan_count,
                'total_loan_amount': total_loan_amount,
                'avg_loan_amount': avg_loan_amount,
                'repaid_loans': repaid_loans,
                'outstanding_loans': outstanding_loans,
                'repayment_ratio': min(repayment_ratio, 1.0),
                'days_since_last_transaction': days_since_last_transaction,
                'balance_volatility': balance_volatility,
                'loan_to_deposit_ratio': min(loan_to_deposit_ratio, 2.0),
                'account_utilization': min(account_utilization, 2.0),
                'payment_consistency': payment_consistency,
                'overdraft_usage': min(overdraft_usage, 1.0)
            }
            
            return features
            
        except Exception as e:
            print(f"Error extracting user features: {e}")
            return self._default_features()

    def _default_features(self):
        """Return default features for new users"""
        return {
            'account_age_days': 1,
            'total_balance': 0,
            'transaction_count': 0,
            'deposit_count': 0,
            'withdrawal_count': 0,
            'avg_transaction_amount': 0,
            'total_deposits': 0,
            'total_withdrawals': 0,
            'loan_count': 0,
            'total_loan_amount': 0,
            'avg_loan_amount': 0,
            'repaid_loans': 0,
            'outstanding_loans': 0,
            'repayment_ratio': 1.0,
            'days_since_last_transaction': 0,
            'balance_volatility': 0,
            'loan_to_deposit_ratio': 0,
            'account_utilization': 0,
            'payment_consistency': 0.8,
            'overdraft_usage': 0
        }

    def _calculate_daily_balances(self, transactions, current_balance):
        """Calculate daily balance history"""
        if not transactions:
            return [current_balance]
        
        # Sort transactions by date
        sorted_transactions = sorted(transactions, key=lambda x: x.created_at, reverse=True)
        
        balances = [current_balance]
        running_balance = current_balance
        
        for transaction in sorted_transactions[:30]:  # Last 30 transactions
            if transaction.transaction_type in ['withdrawal', 'debit']:
                running_balance += abs(transaction.amount)
            else:
                running_balance -= transaction.amount
            balances.append(running_balance)
        
        return balances

    def _calculate_payment_consistency(self, transactions):
        """Calculate payment consistency score"""
        if len(transactions) < 3:
            return 0.5
        
        # Sort transactions by date
        sorted_transactions = sorted(transactions, key=lambda x: x.created_at)
        
        # Calculate time intervals between transactions
        intervals = []
        for i in range(1, len(sorted_transactions)):
            interval = (sorted_transactions[i].created_at - sorted_transactions[i-1].created_at).days
            intervals.append(interval)
        
        if not intervals:
            return 0.5
        
        # Calculate consistency based on standard deviation of intervals
        std_interval = np.std(intervals)
        mean_interval = np.mean(intervals)
        
        # Lower standard deviation relative to mean indicates more consistency
        consistency = max(0, 1 - (std_interval / max(mean_interval, 1)))
        return min(consistency, 1.0)

    def predict_credit_score(self, user_id, session):
        """Predict credit score for a user"""

        features = self.extract_user_features(user_id, session)
        if not features:
            return 350  # Default score for new users
        
        # Convert to DataFrame
        X = pd.DataFrame([features])[self.feature_names]
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Ensemble prediction
        rf_pred = self.rf_model.predict(X_scaled)[0]
        xgb_pred = self.xgb_model.predict(X_scaled)[0]
        
        # Since the 2 models capture diffrent risks
        if abs(rf_pred - xgb_pred) > 100:
            # Take safer route when models disagree significantly
            final_score = min(rf_pred, xgb_pred)
        else:
            # weighted sum when models agree
            final_score = 0.7 * rf_pred + 0.3 * xgb_pred 
        
        # Ensure score is within valid range
        final_score = max(300, min(850, final_score))
        
        return round(final_score)

    def get_score_factors(self, user_id, session):
        """Get detailed factors affecting the credit score"""
        features = self.extract_user_features(user_id, session)
        if not features:
            return []
        
        factors = []
        
        # Payment History
        if features['repayment_ratio'] >= 0.9:
            factors.append({
                'name': 'Payment History',
                'status': 'excellent',
                'impact': 'high',
                'description': f"You have repaid {features['repayment_ratio']*100:.0f}% of your loans on time.",
                'score_impact': None
            })
        elif features['repayment_ratio'] >= 0.7:
            factors.append({
                'name': 'Payment History',
                'status': 'good',
                'impact': 'high',
                'description': f"You have repaid {features['repayment_ratio']*100:.0f}% of your loans on time.",
                'score_impact': None
            })
        else:
            factors.append({
                'name': 'Payment History',
                'status': 'needs improvement',
                'impact': 'high',
                'description': f"You have repaid {features['repayment_ratio']*100:.0f}% of your loans on time.",
                'score_impact': None
            })
        
        # Account Balance
        if features['total_balance'] >= 10000:
            factors.append({
                'name': 'Account Balance',
                'status': 'excellent',
                'impact': 'medium',
                'description': f"Your total balance is {features['total_balance']:.2f} ETB.",
                'score_impact': None
            })
        elif features['total_balance'] >= 5000:
            factors.append({
                'name': 'Account Balance',
                'status': 'good',
                'impact': 'medium',
                'description': f"Your total balance is {features['total_balance']:.2f} ETB.",
                'score_impact': None
            })
        else:
            factors.append({
                'name': 'Account Balance',
                'status': 'fair',
                'impact': 'medium',
                'description': f"Your total balance is {features['total_balance']:.2f} ETB.",
                'score_impact': None
            })
        
        # Transaction Activity
        if features['transaction_count'] >= 50:
            factors.append({
                'name': 'Transaction Activity',
                'status': 'excellent',
                'impact': 'medium',
                'description': f"You have made {features['transaction_count']} transactions.",
                'score_impact': None
            })
        elif features['transaction_count'] >= 20:
            factors.append({
                'name': 'Transaction Activity',
                'status': 'good',
                'impact': 'medium',
                'description': f"You have made {features['transaction_count']} transactions.",
                'score_impact': None
            })
        else:
            factors.append({
                'name': 'Transaction Activity',
                'status': 'needs improvement',
                'impact': 'low',
                'description': f"You have made {features['transaction_count']} transactions.",
                'score_impact': None
            })
        
        # Account Age
        if features['account_age_days'] >= 365:
            factors.append({
                'name': 'Credit History Length',
                'status': 'excellent',
                'impact': 'medium',
                'description': f"Your account is {features['account_age_days']} days old.",
                'score_impact': None
            })
        elif features['account_age_days'] >= 180:
            factors.append({
                'name': 'Credit History Length',
                'status': 'good',
                'impact': 'medium',
                'description': f"Your account is {features['account_age_days']} days old.",
                'score_impact': None
            })
        else:
            factors.append({
                'name': 'Credit History Length',
                'status': 'fair',
                'impact': 'low',
                'description': f"Your account is {features['account_age_days']} days old.",
                'score_impact': None
            })
        
        return factors

    def get_improvement_recommendations(self, user_id, session):
        """Get personalized recommendations to improve credit score"""
        features = self.extract_user_features(user_id, session)
        if not features:
            return []
        
        recommendations = []
        
        if features['repayment_ratio'] < 0.9:
            recommendations.append("Make all loan payments on time to improve your payment history")
        
        if features['transaction_count'] < 20:
            recommendations.append("Increase your account activity with regular transactions")
        
        if features['total_balance'] < 5000:
            recommendations.append("Maintain a higher account balance to show financial stability")
        
        if features['days_since_last_transaction'] > 30:
            recommendations.append("Use your account more regularly to show active financial management")
        
        if features['loan_to_deposit_ratio'] > 0.5:
            recommendations.append("Reduce your loan-to-deposit ratio by increasing savings")
        
        if features['overdraft_usage'] > 0:
            recommendations.append("Avoid overdrafts to maintain good account standing")
        
        if features['account_age_days'] < 180:
            recommendations.append("Continue building your credit history over time")
        
        # Default recommendations if score is already good
        if not recommendations:
            recommendations = [
                "Continue your excellent financial habits",
                "Consider diversifying your financial activities",
                "Maintain regular account activity",
                "Keep making timely payments"
            ]
        
        return recommendations