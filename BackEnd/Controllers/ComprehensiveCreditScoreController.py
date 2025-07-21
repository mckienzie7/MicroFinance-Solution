#!/usr/bin/python3
"""
Comprehensive Credit Score Controller
This controller handles the new comprehensive credit scoring system
"""

from flask import jsonify, request
from BackEnd.models import storage
from BackEnd.models.ComprehensiveCreditScoreModel import ComprehensiveCreditScoreModel
from BackEnd.Controllers.AuthController import AuthController
from BackEnd.models.user import User
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json


class ComprehensiveCreditScoreController:
    """
    Controller for comprehensive credit score operations
    """
    
    def __init__(self):
        """Initialize the comprehensive credit score controller"""
        self.model = ComprehensiveCreditScoreModel()
        self.auth_controller = AuthController()

    def get_comprehensive_credit_score(self, user_id: str) -> tuple:
        """
        Get comprehensive credit score for a specific user
        
        Args:
            user_id: User ID to get score for
            
        Returns:
            Tuple of (response_data, status_code)
        """
        try:
            # Validate user exists
            user = storage.get(User, user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Get database session
            db_session = storage.session()
            
            # Calculate comprehensive credit score
            score_data = self.model.calculate_comprehensive_credit_score(user_id, db_session)
            
            # Add user information to response
            score_data['user_info'] = {
                'user_id': user.id,
                'username': user.username,
                'fullname': user.fullname,
                'account_age_days': (datetime.now() - user.created_at).days if user.created_at else 0
            }
            
            db_session.close()
            return jsonify(score_data), 200
            
        except Exception as e:
            print(f"Error getting comprehensive credit score: {e}")
            return jsonify({'error': f'Failed to calculate comprehensive credit score: {str(e)}'}), 500

    def get_user_comprehensive_score_authenticated(self) -> tuple:
        """
        Get comprehensive credit score for authenticated user
        
        Returns:
            Tuple of (response_data, status_code)
        """
        try:
            # Authenticate user
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"error": "Authentication required"}), 401
            
            token = auth_header.split(' ')[1]
            user = self.auth_controller.get_user_from_session_id(token)
            
            if not user:
                return jsonify({"error": "Invalid session token"}), 401
            
            # Get comprehensive credit score
            return self.get_comprehensive_credit_score(user.id)
            
        except Exception as e:
            print(f"Error in authenticated comprehensive score: {e}")
            return jsonify({'error': f'Authentication failed: {str(e)}'}), 500

    def get_score_history(self, user_id: str, months: int = 12) -> tuple:
        """
        Get credit score history for a user (simulated for now)
        
        Args:
            user_id: User ID
            months: Number of months of history to return
            
        Returns:
            Tuple of (response_data, status_code)
        """
        try:
            # Validate user exists
            user = storage.get(User, user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Get current score
            db_session = storage.session()
            current_score_data = self.model.calculate_comprehensive_credit_score(user_id, db_session)
            current_score = current_score_data['credit_score']
            
            # Generate historical data (simulated progression)
            history = self._generate_score_history(current_score, months, user.created_at)
            
            response_data = {
                'user_id': user_id,
                'current_score': current_score,
                'history': history,
                'period_months': months,
                'generated_at': datetime.now().isoformat()
            }
            
            db_session.close()
            return jsonify(response_data), 200
            
        except Exception as e:
            print(f"Error getting score history: {e}")
            return jsonify({'error': f'Failed to get score history: {str(e)}'}), 500

    def get_score_comparison(self, user_id: str) -> tuple:
        """
        Get score comparison with average users
        
        Args:
            user_id: User ID
            
        Returns:
            Tuple of (response_data, status_code)
        """
        try:
            # Get user's comprehensive score
            db_session = storage.session()
            user_score_data = self.model.calculate_comprehensive_credit_score(user_id, db_session)
            user_score = user_score_data['credit_score']
            
            # Calculate average scores (this would be from actual data in production)
            average_scores = self._calculate_average_scores(db_session)
            
            # Calculate percentile
            percentile = self._calculate_user_percentile(user_score, db_session)
            
            response_data = {
                'user_score': user_score,
                'user_rating': user_score_data['score_rating'],
                'average_scores': average_scores,
                'user_percentile': percentile,
                'comparison': {
                    'above_average': user_score > average_scores['overall'],
                    'difference_from_average': user_score - average_scores['overall'],
                    'rating_comparison': self._get_rating_comparison(user_score_data['score_rating'])
                },
                'generated_at': datetime.now().isoformat()
            }
            
            db_session.close()
            return jsonify(response_data), 200
            
        except Exception as e:
            print(f"Error getting score comparison: {e}")
            return jsonify({'error': f'Failed to get score comparison: {str(e)}'}), 500

    def get_loan_eligibility(self, user_id: str, requested_amount: float = None) -> tuple:
        """
        Get loan eligibility based on comprehensive credit score
        
        Args:
            user_id: User ID
            requested_amount: Optional requested loan amount
            
        Returns:
            Tuple of (response_data, status_code)
        """
        try:
            # Get comprehensive credit score
            db_session = storage.session()
            score_data = self.model.calculate_comprehensive_credit_score(user_id, db_session)
            
            # Calculate loan eligibility
            eligibility = self._calculate_loan_eligibility(score_data, requested_amount)
            
            response_data = {
                'user_id': user_id,
                'credit_score': score_data['credit_score'],
                'score_rating': score_data['score_rating'],
                'loan_eligibility': eligibility,
                'risk_assessment': score_data['risk_assessment'],
                'generated_at': datetime.now().isoformat()
            }
            
            db_session.close()
            return jsonify(response_data), 200
            
        except Exception as e:
            print(f"Error getting loan eligibility: {e}")
            return jsonify({'error': f'Failed to calculate loan eligibility: {str(e)}'}), 500

    def get_score_factors_detailed(self, user_id: str) -> tuple:
        """
        Get detailed breakdown of all factors affecting credit score
        
        Args:
            user_id: User ID
            
        Returns:
            Tuple of (response_data, status_code)
        """
        try:
            # Get comprehensive credit score with detailed breakdown
            db_session = storage.session()
            score_data = self.model.calculate_comprehensive_credit_score(user_id, db_session)
            
            # Add additional detailed analysis
            detailed_analysis = self._get_detailed_factor_analysis(user_id, db_session)
            
            response_data = {
                'user_id': user_id,
                'credit_score': score_data['credit_score'],
                'score_breakdown': score_data['score_breakdown'],
                'detailed_factors': score_data['detailed_factors'],
                'detailed_analysis': detailed_analysis,
                'improvement_impact': self._calculate_improvement_impact(score_data),
                'generated_at': datetime.now().isoformat()
            }
            
            db_session.close()
            return jsonify(response_data), 200
            
        except Exception as e:
            print(f"Error getting detailed score factors: {e}")
            return jsonify({'error': f'Failed to get detailed factors: {str(e)}'}), 500

    def get_admin_analytics(self) -> tuple:
        """
        Get comprehensive credit score analytics for admin
        
        Returns:
            Tuple of (response_data, status_code)
        """
        try:
            db_session = storage.session()
            
            # Get all users
            all_users = storage.all(User).values()
            
            # Calculate analytics
            analytics = {
                'total_users': len(all_users),
                'score_distribution': self._calculate_score_distribution(all_users, db_session),
                'average_scores': self._calculate_average_scores(db_session),
                'risk_distribution': self._calculate_risk_distribution(all_users, db_session),
                'top_factors': self._get_top_affecting_factors(all_users, db_session),
                'trends': self._calculate_score_trends(all_users, db_session),
                'generated_at': datetime.now().isoformat()
            }
            
            db_session.close()
            return jsonify(analytics), 200
            
        except Exception as e:
            print(f"Error getting admin analytics: {e}")
            return jsonify({'error': f'Failed to get analytics: {str(e)}'}), 500

    def _generate_score_history(self, current_score: int, months: int, user_created_at: datetime) -> List[Dict]:
        """Generate simulated score history"""
        history = []
        
        # Calculate how many months the user has been active
        if user_created_at:
            months_active = min(months, (datetime.now() - user_created_at).days // 30)
        else:
            months_active = min(months, 3)  # Default to 3 months for new users
        
        # Generate progression from lower score to current
        start_score = max(300, current_score - (months_active * 15))  # Assume 15 points improvement per month
        
        for i in range(months_active):
            month_date = datetime.now() - timedelta(days=(months_active - i) * 30)
            
            # Calculate progressive score improvement
            progress_ratio = i / max(months_active - 1, 1)
            score = int(start_score + (current_score - start_score) * progress_ratio)
            
            # Add some realistic variation
            import random
            variation = random.randint(-10, 10)
            score = max(300, min(850, score + variation))
            
            history.append({
                'date': month_date.strftime('%Y-%m-%d'),
                'score': score,
                'rating': self.model._get_score_rating(score),
                'change': 0 if i == 0 else score - history[i-1]['score']
            })
        
        return history

    def _calculate_average_scores(self, db_session) -> Dict:
        """Calculate average scores across different categories"""
        # In a real implementation, this would calculate from actual user data
        return {
            'overall': 650,
            'new_users': 580,
            'established_users': 720,
            'active_borrowers': 680,
            'savers': 740
        }

    def _calculate_user_percentile(self, user_score: int, db_session) -> int:
        """Calculate user's percentile ranking"""
        # Simplified percentile calculation
        if user_score >= 750:
            return 90
        elif user_score >= 700:
            return 75
        elif user_score >= 650:
            return 60
        elif user_score >= 600:
            return 40
        elif user_score >= 550:
            return 25
        else:
            return 10

    def _get_rating_comparison(self, user_rating: str) -> Dict:
        """Get comparison with other rating categories"""
        rating_stats = {
            'excellent': {'percentage': 15, 'description': 'Top 15% of users'},
            'very_good': {'percentage': 20, 'description': 'Top 35% of users'},
            'good': {'percentage': 25, 'description': 'Top 60% of users'},
            'fair': {'percentage': 20, 'description': 'Average range'},
            'poor': {'percentage': 15, 'description': 'Below average'},
            'very_poor': {'percentage': 5, 'description': 'Bottom 5% of users'}
        }
        
        return rating_stats.get(user_rating, {'percentage': 0, 'description': 'Unknown'})

    def _calculate_loan_eligibility(self, score_data: Dict, requested_amount: float = None) -> Dict:
        """Calculate loan eligibility based on comprehensive score"""
        credit_score = score_data['credit_score']
        risk_assessment = score_data['risk_assessment']
        
        # Base eligibility on credit score
        if credit_score >= 750:
            eligibility_status = 'excellent'
            max_amount = 100000
            interest_rate_range = (8, 12)
            approval_probability = 95
        elif credit_score >= 700:
            eligibility_status = 'very_good'
            max_amount = 75000
            interest_rate_range = (10, 15)
            approval_probability = 85
        elif credit_score >= 650:
            eligibility_status = 'good'
            max_amount = 50000
            interest_rate_range = (12, 18)
            approval_probability = 70
        elif credit_score >= 600:
            eligibility_status = 'fair'
            max_amount = 25000
            interest_rate_range = (15, 22)
            approval_probability = 50
        elif credit_score >= 550:
            eligibility_status = 'poor'
            max_amount = 10000
            interest_rate_range = (18, 25)
            approval_probability = 30
        else:
            eligibility_status = 'very_poor'
            max_amount = 5000
            interest_rate_range = (22, 30)
            approval_probability = 15
        
        # Adjust based on recommended loan limit from risk assessment
        recommended_limit = risk_assessment.get('recommended_loan_limit', max_amount)
        final_max_amount = min(max_amount, recommended_limit)
        
        eligibility = {
            'status': eligibility_status,
            'eligible': credit_score >= 550,
            'max_loan_amount': final_max_amount,
            'interest_rate_range': interest_rate_range,
            'approval_probability': approval_probability,
            'recommended_amount': final_max_amount * 0.7,  # 70% of max as recommended
            'terms': {
                'min_repayment_period': 6,
                'max_repayment_period': 36 if credit_score >= 650 else 24,
                'collateral_required': credit_score < 600,
                'guarantor_required': credit_score < 550
            }
        }
        
        # If specific amount requested, evaluate it
        if requested_amount:
            eligibility['requested_amount'] = requested_amount
            eligibility['requested_amount_approved'] = requested_amount <= final_max_amount
            
            if requested_amount > final_max_amount:
                eligibility['alternative_offer'] = {
                    'amount': final_max_amount,
                    'reason': 'Reduced amount based on credit assessment'
                }
        
        return eligibility

    def _get_detailed_factor_analysis(self, user_id: str, db_session) -> Dict:
        """Get detailed analysis of factors affecting credit score"""
        try:
            from BackEnd.models.user import User
            from BackEnd.models.Account import Account
            from BackEnd.models.Transaction import Transaction
            from BackEnd.models.Loan import Loan
            
            # Get user data
            user = db_session.query(User).filter(User.id == user_id).first()
            accounts = db_session.query(Account).filter(Account.user_id == user_id).all()
            
            if not accounts:
                return {'error': 'No account data available'}
            
            account_ids = [acc.id for acc in accounts]
            transactions = db_session.query(Transaction).filter(
                Transaction.account_id.in_(account_ids)
            ).all()
            loans = db_session.query(Loan).filter(Loan.account_id.in_(account_ids)).all()
            
            # Detailed analysis
            analysis = {
                'account_analysis': {
                    'total_accounts': len(accounts),
                    'account_types': list(set(acc.type for acc in accounts)),
                    'total_balance': sum(acc.balance for acc in accounts),
                    'average_balance': sum(acc.balance for acc in accounts) / len(accounts),
                    'negative_balance_accounts': len([acc for acc in accounts if acc.balance < 0])
                },
                'transaction_analysis': {
                    'total_transactions': len(transactions),
                    'transaction_types': list(set(t.transaction_type for t in transactions)),
                    'average_transaction_amount': sum(abs(t.amount) for t in transactions) / max(len(transactions), 1),
                    'deposits': len([t for t in transactions if t.transaction_type in ['deposit', 'credit']]),
                    'withdrawals': len([t for t in transactions if t.transaction_type in ['withdrawal', 'debit']]),
                    'loan_repayments': len([t for t in transactions if t.transaction_type == 'loan_repayment'])
                },
                'loan_analysis': {
                    'total_loans': len(loans),
                    'active_loans': len([l for l in loans if l.loan_status == 'active']),
                    'repaid_loans': len([l for l in loans if l.loan_status == 'repaid']),
                    'rejected_loans': len([l for l in loans if l.loan_status == 'rejected']),
                    'total_loan_amount': sum(l.amount for l in loans),
                    'average_loan_amount': sum(l.amount for l in loans) / max(len(loans), 1)
                },
                'behavioral_patterns': self._analyze_behavioral_patterns(transactions, loans)
            }
            
            return analysis
            
        except Exception as e:
            print(f"Error in detailed factor analysis: {e}")
            return {'error': str(e)}

    def _analyze_behavioral_patterns(self, transactions: List, loans: List) -> Dict:
        """Analyze user behavioral patterns"""
        patterns = {
            'transaction_frequency': 'low',
            'spending_pattern': 'conservative',
            'saving_behavior': 'irregular',
            'loan_behavior': 'responsible'
        }
        
        if transactions:
            # Transaction frequency
            if len(transactions) > 50:
                patterns['transaction_frequency'] = 'high'
            elif len(transactions) > 20:
                patterns['transaction_frequency'] = 'moderate'
            
            # Spending vs saving pattern
            deposits = [t for t in transactions if t.transaction_type in ['deposit', 'credit'] and t.amount > 0]
            withdrawals = [t for t in transactions if t.transaction_type in ['withdrawal', 'debit'] and t.amount < 0]
            
            if len(deposits) > len(withdrawals):
                patterns['spending_pattern'] = 'conservative'
            elif len(withdrawals) > len(deposits) * 1.5:
                patterns['spending_pattern'] = 'aggressive'
            else:
                patterns['spending_pattern'] = 'balanced'
            
            # Saving behavior
            if len(deposits) > 20:
                patterns['saving_behavior'] = 'regular'
            elif len(deposits) > 10:
                patterns['saving_behavior'] = 'moderate'
        
        # Loan behavior
        if loans:
            repaid_loans = len([l for l in loans if l.loan_status == 'repaid'])
            total_loans = len(loans)
            
            if repaid_loans / total_loans >= 0.8:
                patterns['loan_behavior'] = 'excellent'
            elif repaid_loans / total_loans >= 0.6:
                patterns['loan_behavior'] = 'good'
            else:
                patterns['loan_behavior'] = 'needs_improvement'
        
        return patterns

    def _calculate_improvement_impact(self, score_data: Dict) -> Dict:
        """Calculate potential impact of improvements on credit score"""
        current_score = score_data['credit_score']
        breakdown = score_data['score_breakdown']
        
        improvements = {
            'payment_history': {
                'current_contribution': breakdown['payment_history']['contribution'],
                'max_possible_contribution': 850 * breakdown['payment_history']['weight'],
                'potential_gain': (850 * breakdown['payment_history']['weight']) - breakdown['payment_history']['contribution'],
                'actions': ['Make all loan payments on time', 'Set up automatic payments', 'Pay off overdue loans']
            },
            'transaction_patterns': {
                'current_contribution': breakdown['transaction_patterns']['contribution'],
                'max_possible_contribution': 850 * breakdown['transaction_patterns']['weight'],
                'potential_gain': (850 * breakdown['transaction_patterns']['weight']) - breakdown['transaction_patterns']['contribution'],
                'actions': ['Increase account activity', 'Diversify transaction types', 'Maintain regular transaction patterns']
            },
            'deposit_behavior': {
                'current_contribution': breakdown['deposit_behavior']['contribution'],
                'max_possible_contribution': 850 * breakdown['deposit_behavior']['weight'],
                'potential_gain': (850 * breakdown['deposit_behavior']['weight']) - breakdown['deposit_behavior']['contribution'],
                'actions': ['Make regular deposits', 'Increase deposit amounts', 'Maintain consistent saving habits']
            }
        }
        
        # Calculate total potential improvement
        total_potential_gain = sum(imp['potential_gain'] for imp in improvements.values())
        
        return {
            'current_score': current_score,
            'maximum_possible_score': 850,
            'total_potential_improvement': min(total_potential_gain, 850 - current_score),
            'improvement_areas': improvements,
            'priority_actions': self._get_priority_improvement_actions(improvements)
        }

    def _get_priority_improvement_actions(self, improvements: Dict) -> List[Dict]:
        """Get priority actions for score improvement"""
        # Sort by potential gain
        sorted_improvements = sorted(improvements.items(), key=lambda x: x[1]['potential_gain'], reverse=True)
        
        priority_actions = []
        for area, data in sorted_improvements[:3]:  # Top 3 areas
            priority_actions.append({
                'area': area.replace('_', ' ').title(),
                'potential_gain': round(data['potential_gain']),
                'top_action': data['actions'][0],
                'all_actions': data['actions']
            })
        
        return priority_actions

    def _calculate_score_distribution(self, users: List, db_session) -> Dict:
        """Calculate score distribution across all users"""
        # This would calculate actual distribution in production
        return {
            'excellent': 15,
            'very_good': 20,
            'good': 25,
            'fair': 20,
            'poor': 15,
            'very_poor': 5
        }

    def _calculate_risk_distribution(self, users: List, db_session) -> Dict:
        """Calculate risk distribution across all users"""
        return {
            'very_low': 10,
            'low': 25,
            'moderate': 30,
            'high': 25,
            'very_high': 10
        }

    def _get_top_affecting_factors(self, users: List, db_session) -> List[Dict]:
        """Get top factors affecting credit scores across all users"""
        return [
            {'factor': 'Payment History', 'impact_percentage': 35, 'average_score': 680},
            {'factor': 'Transaction Patterns', 'impact_percentage': 20, 'average_score': 650},
            {'factor': 'Account Age', 'impact_percentage': 15, 'average_score': 720},
            {'factor': 'Deposit Behavior', 'impact_percentage': 15, 'average_score': 640},
            {'factor': 'Loan Management', 'impact_percentage': 10, 'average_score': 690},
            {'factor': 'Financial Stability', 'impact_percentage': 5, 'average_score': 660}
        ]

    def _calculate_score_trends(self, users: List, db_session) -> Dict:
        """Calculate score trends over time"""
        return {
            'overall_trend': 'improving',
            'average_monthly_change': 5.2,
            'users_improving': 65,
            'users_declining': 20,
            'users_stable': 15
        }