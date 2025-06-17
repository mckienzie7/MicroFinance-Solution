#!/usr/bin/python3
"""AI Credit Score Model"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from datetime import datetime, timedelta
from sqlalchemy.orm import sessionmaker
from sqlalchemy import func, and_, or_
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

class AICredoScoreModel:
    def __init__(self):
        """Initialize the AI Credit Score Model with pre-trained models"""
        self.rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.gb_model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = [
            'account_age_days', 'total_balance', 'transaction_count',
            'deposit_count', 'withdrawal_count', 'avg_transaction_amount',
            'total_deposits', 'total_withdrawals', 'loan_count',
            'total_loan_amount', 'avg_loan_amount', 'repaid_loans',
            'outstanding_loans', 'repayment_ratio', 'days_since_last_transaction',
            'balance_volatility', 'loan_to_deposit_ratio', 'account_utilization',
            'payment_consistency', 'overdraft_usage'
        ]
        
        # Load pre-trained model if exists
        self._load_model()
        
        # If no pre-trained model exists, create synthetic training data
        if not self.is_trained:
            self._create_synthetic_training_data()

    def _load_model(self):
        """Load pre-trained model from file"""
        try:
            model_dir = os.path.join(os.path.dirname(__file__), '..', 'trained_models')
            if os.path.exists(os.path.join(model_dir, 'credit_score_rf.joblib')):
                self.rf_model = joblib.load(os.path.join(model_dir, 'credit_score_rf.joblib'))
                self.gb_model = joblib.load(os.path.join(model_dir, 'credit_score_gb.joblib'))
                self.scaler = joblib.load(os.path.join(model_dir, 'credit_score_scaler.joblib'))
                self.is_trained = True
                print("Pre-trained model loaded successfully")
        except Exception as e:
            print(f"Error loading pre-trained model: {e}")
            self.is_trained = False

    def _save_model(self):
        """Save trained model to file"""
        try:
            model_dir = os.path.join(os.path.dirname(__file__), '..', 'trained_models')
            os.makedirs(model_dir, exist_ok=True)
            
            joblib.dump(self.rf_model, os.path.join(model_dir, 'credit_score_rf.joblib'))
            joblib.dump(self.gb_model, os.path.join(model_dir, 'credit_score_gb.joblib'))
            joblib.dump(self.scaler, os.path.join(model_dir, 'credit_score_scaler.joblib'))
            print("Model saved successfully")
        except Exception as e:
            print(f"Error saving model: {e}")

    def _create_synthetic_training_data(self):
        """Create synthetic training data for initial model training"""
        print("Creating synthetic training data...")
        
        np.random.seed(42)
        n_samples = 1000
        
        # Generate synthetic features
        data = {
            'account_age_days': np.random.normal(365, 200, n_samples),
            'total_balance': np.random.lognormal(7, 1.5, n_samples),
            'transaction_count': np.random.poisson(50, n_samples),
            'deposit_count': np.random.poisson(25, n_samples),
            'withdrawal_count': np.random.poisson(25, n_samples),
            'avg_transaction_amount': np.random.lognormal(5, 1, n_samples),
            'total_deposits': np.random.lognormal(8, 1.5, n_samples),
            'total_withdrawals': np.random.lognormal(8, 1.5, n_samples),
            'loan_count': np.random.poisson(2, n_samples),
            'total_loan_amount': np.random.lognormal(8, 2, n_samples),
            'avg_loan_amount': np.random.lognormal(7, 1.5, n_samples),
            'repaid_loans': np.random.binomial(5, 0.8, n_samples),
            'outstanding_loans': np.random.poisson(1, n_samples),
            'repayment_ratio': np.random.beta(8, 2, n_samples),
            'days_since_last_transaction': np.random.exponential(7, n_samples),
            'balance_volatility': np.random.gamma(2, 0.5, n_samples),
            'loan_to_deposit_ratio': np.random.beta(2, 5, n_samples),
            'account_utilization': np.random.beta(3, 7, n_samples),
            'payment_consistency': np.random.beta(8, 2, n_samples),
            'overdraft_usage': np.random.beta(1, 9, n_samples)
        }
        
        # Ensure positive values and reasonable ranges
        for feature in data:
            data[feature] = np.abs(data[feature])
            if feature in ['repayment_ratio', 'loan_to_deposit_ratio', 'account_utilization', 
                          'payment_consistency', 'overdraft_usage']:
                data[feature] = np.clip(data[feature], 0, 1)
        
        # Create target credit scores based on feature combinations
        credit_scores = self._calculate_synthetic_credit_scores(data)
        
        # Create DataFrame
        X = pd.DataFrame(data)
        y = np.array(credit_scores)
        
        # Train the model
        self._train_models(X, y)

    def _calculate_synthetic_credit_scores(self, data):
        """Calculate synthetic credit scores based on feature importance"""
        scores = []
        
        for i in range(len(data['account_age_days'])):
            score = 300  # Base score
            
            # Account age factor (10% weight)
            score += min(data['account_age_days'][i] / 10, 50)
            
            # Balance factor (15% weight)
            score += min(np.log1p(data['total_balance'][i]) * 8, 75)
            
            # Transaction activity (10% weight)
            score += min(data['transaction_count'][i] * 0.5, 50)
            
            # Repayment history (25% weight - most important)
            score += data['repayment_ratio'][i] * 125
            
            # Loan management (15% weight)
            if data['loan_count'][i] > 0:
                loan_score = (data['repaid_loans'][i] / max(data['loan_count'][i], 1)) * 75
                score += loan_score
            else:
                score += 30  # Having no loans is neutral
            
            # Payment consistency (15% weight)
            score += data['payment_consistency'][i] * 75
            
            # Account utilization (5% weight)
            utilization_score = (1 - min(data['account_utilization'][i], 0.8)) * 25
            score += utilization_score
            
            # Overdraft penalty (5% weight)
            score -= data['overdraft_usage'][i] * 25
            
            # Recent activity bonus
            if data['days_since_last_transaction'][i] <= 7:
                score += 10
            elif data['days_since_last_transaction'][i] <= 30:
                score += 5
            
            # Ensure score is within valid range
            score = max(300, min(850, score))
            scores.append(score)
        
        return scores

    def _train_models(self, X, y):
        """Train the ensemble models"""
        print("Training credit score models...")
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        # Train Random Forest
        self.rf_model.fit(X_train, y_train)
        
        # Train Gradient Boosting
        self.gb_model.fit(X_train, y_train)
        
        # Evaluate models
        rf_pred = self.rf_model.predict(X_test)
        gb_pred = self.gb_model.predict(X_test)
        
        rf_r2 = r2_score(y_test, rf_pred)
        gb_r2 = r2_score(y_test, gb_pred)
        
        print(f"Random Forest R²: {rf_r2:.3f}")
        print(f"Gradient Boosting R²: {gb_r2:.3f}")
        
        self.is_trained = True
        self._save_model()

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
            
            # Calculate account age
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
            
            # Repayment analysis
            if loans:
                loan_ids = [loan.id for loan in loans]
                repayments = session.query(Repayment).filter(
                    Repayment.loan_id.in_(loan_ids)
                ).all()
            else:
                repayments = []
            
            repaid_loans = len([loan for loan in loans if loan.loan_status == 'repaid'])
            outstanding_loans = len([loan for loan in loans if loan.loan_status in ['approved', 'active']])
            
            if loans:
                repayment_ratio = repaid_loans / loan_count
                loan_to_deposit_ratio = total_loan_amount / max(total_deposits, 1)
            else:
                repayment_ratio = 1.0  # No loans is considered good
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
        if not self.is_trained:
            print("Model not trained. Using default scoring.")
            return self._calculate_default_score(user_id, session)
        
        features = self.extract_user_features(user_id, session)
        if not features:
            return 350  # Default score for new users
        
        # Convert to DataFrame
        X = pd.DataFrame([features])[self.feature_names]
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Ensemble prediction
        rf_pred = self.rf_model.predict(X_scaled)[0]
        gb_pred = self.gb_model.predict(X_scaled)[0]
        
        # Weighted ensemble (Random Forest 60%, Gradient Boosting 40%)
        final_score = 0.6 * rf_pred + 0.4 * gb_pred
        
        # Ensure score is within valid range
        final_score = max(300, min(850, final_score))
        
        return round(final_score)

    def _calculate_default_score(self, user_id, session):
        """Calculate credit score using rule-based approach when ML model is not available"""
        features = self.extract_user_features(user_id, session)
        if not features:
            return 350
        
        score = 300  # Base score
        
        # Account age factor
        score += min(features['account_age_days'] / 10, 50)
        
        # Balance factor
        score += min(np.log1p(features['total_balance']) * 8, 75)
        
        # Transaction activity
        score += min(features['transaction_count'] * 0.5, 50)
        
        # Repayment history
        score += features['repayment_ratio'] * 125
        
        # Loan management
        if features['loan_count'] > 0:
            loan_score = (features['repaid_loans'] / max(features['loan_count'], 1)) * 75
            score += loan_score
        else:
            score += 30
        
        # Payment consistency
        score += features['payment_consistency'] * 75
        
        # Account utilization
        utilization_score = (1 - min(features['account_utilization'], 0.8)) * 25
        score += utilization_score
        
        # Overdraft penalty
        score -= features['overdraft_usage'] * 25
        
        # Recent activity bonus
        if features['days_since_last_transaction'] <= 7:
            score += 10
        elif features['days_since_last_transaction'] <= 30:
            score += 5
        
        return max(300, min(850, round(score)))

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
                'score_impact': 25
            })
        elif features['repayment_ratio'] >= 0.7:
            factors.append({
                'name': 'Payment History',
                'status': 'good',
                'impact': 'high',
                'description': f"You have repaid {features['repayment_ratio']*100:.0f}% of your loans on time.",
                'score_impact': 15
            })
        else:
            factors.append({
                'name': 'Payment History',
                'status': 'needs improvement',
                'impact': 'high',
                'description': f"You have repaid {features['repayment_ratio']*100:.0f}% of your loans on time.",
                'score_impact': -10
            })
        
        # Account Balance
        if features['total_balance'] >= 10000:
            factors.append({
                'name': 'Account Balance',
                'status': 'excellent',
                'impact': 'medium',
                'description': f"Your total balance is {features['total_balance']:.2f} ETB.",
                'score_impact': 20
            })
        elif features['total_balance'] >= 5000:
            factors.append({
                'name': 'Account Balance',
                'status': 'good',
                'impact': 'medium',
                'description': f"Your total balance is {features['total_balance']:.2f} ETB.",
                'score_impact': 10
            })
        else:
            factors.append({
                'name': 'Account Balance',
                'status': 'fair',
                'impact': 'medium',
                'description': f"Your total balance is {features['total_balance']:.2f} ETB.",
                'score_impact': 0
            })
        
        # Transaction Activity
        if features['transaction_count'] >= 50:
            factors.append({
                'name': 'Transaction Activity',
                'status': 'excellent',
                'impact': 'medium',
                'description': f"You have made {features['transaction_count']} transactions.",
                'score_impact': 15
            })
        elif features['transaction_count'] >= 20:
            factors.append({
                'name': 'Transaction Activity',
                'status': 'good',
                'impact': 'medium',
                'description': f"You have made {features['transaction_count']} transactions.",
                'score_impact': 10
            })
        else:
            factors.append({
                'name': 'Transaction Activity',
                'status': 'needs improvement',
                'impact': 'low',
                'description': f"You have made {features['transaction_count']} transactions.",
                'score_impact': 0
            })
        
        # Account Age
        if features['account_age_days'] >= 365:
            factors.append({
                'name': 'Credit History Length',
                'status': 'excellent',
                'impact': 'medium',
                'description': f"Your account is {features['account_age_days']} days old.",
                'score_impact': 15
            })
        elif features['account_age_days'] >= 180:
            factors.append({
                'name': 'Credit History Length',
                'status': 'good',
                'impact': 'medium',
                'description': f"Your account is {features['account_age_days']} days old.",
                'score_impact': 10
            })
        else:
            factors.append({
                'name': 'Credit History Length',
                'status': 'fair',
                'impact': 'low',
                'description': f"Your account is {features['account_age_days']} days old.",
                'score_impact': 5
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