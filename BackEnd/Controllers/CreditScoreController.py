#!/usr/bin/python3
"""AI Credit Score Controller"""

from flask import jsonify, request
from BackEnd.models.CreditScoreModel import AICredoScoreModel
from BackEnd.models import storage
from BackEnd.models.user import User
import traceback

class CreditScoreController:
    def __init__(self):
        """Initialize the Credit Score Controller"""
        self.ai_model = AICredoScoreModel()

    def _get_authenticated_user(self):
        """Get authenticated user from Authorization header"""
        try:
            auth_header = request.headers.get('Authorization')
            
            if not auth_header or not auth_header.startswith('Bearer '):
                return None, jsonify({"error": "Authentication required"}), 401
            
            token = auth_header.split(' ')[1]
            
            # Use the same pattern as the users.py file
            from BackEnd.Controllers.AuthController import AuthController
            auth_controller = AuthController()
            user = auth_controller.get_user_from_session_id(token)
            
            if not user:
                return None, jsonify({"error": "Authentication required"}), 401
                
            return user, None, None
        except Exception as e:
            print(f"Authentication error: {str(e)}")
            return None, jsonify({"error": "Authentication required"}), 401

    def get_user_credit_score(self):
        """Get credit score for the current user"""
        try:
            user, error_response, status_code = self._get_authenticated_user()
            if error_response:
                return error_response, status_code
                
            db_session = storage.session()
            
            # Get credit score using AI model
            credit_score = self.ai_model.predict_credit_score(user.id, db_session)
            
            # Get factors affecting the score
            factors = self.ai_model.get_score_factors(user.id, db_session)
            
            # Get improvement recommendations
            recommendations = self.ai_model.get_improvement_recommendations(user.id, db_session)
            
            # Get user features for additional insights
            user_features = self.ai_model.extract_user_features(user.id, db_session)
            
            # Calculate score range and rating
            score_rating = self._get_score_rating(credit_score)
            score_range = self._get_score_range(credit_score)
            
            response_data = {
                'credit_score': credit_score,
                'score_rating': score_rating,
                'score_range': score_range,
                'factors': factors,
                'recommendations': recommendations,
                'insights': self._generate_insights(user_features, credit_score),
                'last_updated': 'now'
            }
            
            db_session.close()
            return jsonify(response_data), 200
            
        except Exception as e:
            print(f"Error getting user credit score: {str(e)}")
            print(traceback.format_exc())
            return jsonify({'error': 'Failed to calculate credit score'}), 500

    def get_credit_score_history(self):
        """Get credit score history for the current user"""
        try:
            user, error_response, status_code = self._get_authenticated_user()
            if error_response:
                return error_response, status_code
                
            db_session = storage.session()
            
            # For now, we'll generate a mock history based on current score
            current_score = self.ai_model.predict_credit_score(user.id, db_session)
            
            # Generate historical data (mock for demonstration)
            history = self._generate_score_history(current_score)
            
            db_session.close()
            return jsonify({
                'history': history,
                'current_score': current_score
            }), 200
            
        except Exception as e:
            print(f"Error getting credit score history: {str(e)}")
            return jsonify({'error': 'Failed to get credit score history'}), 500

    def get_all_users_credit_scores(self):
        """Get credit scores for all users (admin only)"""
        try:
            user, error_response, status_code = self._get_authenticated_user()
            if error_response:
                return error_response, status_code
                
            if not user.admin:
                return jsonify({'error': 'Admin privileges required'}), 403
                
            db_session = storage.session()
            
            users = db_session.query(User).all()
            users_scores = []
            
            for user_obj in users:
                try:
                    credit_score = self.ai_model.predict_credit_score(user_obj.id, db_session)
                    score_rating = self._get_score_rating(credit_score)
                    
                    users_scores.append({
                        'user_id': user_obj.id,
                        'username': user_obj.username,
                        'fullname': user_obj.fullname,
                        'email': user_obj.email,
                        'credit_score': credit_score,
                        'score_rating': score_rating,
                        'is_admin': user_obj.admin
                    })
                except Exception as user_error:
                    print(f"Error calculating score for user {user_obj.id}: {user_error}")
                    users_scores.append({
                        'user_id': user_obj.id,
                        'username': user_obj.username,
                        'fullname': user_obj.fullname,
                        'email': user_obj.email,
                        'credit_score': 'N/A',
                        'score_rating': 'N/A',
                        'error': 'Unable to calculate'
                    })
            
            # Sort by credit score (descending)
            users_scores.sort(key=lambda x: x['credit_score'] if isinstance(x['credit_score'], int) else 0, reverse=True)
            
            db_session.close()
            return jsonify({
                'users_scores': users_scores,
                'total_users': len(users_scores)
            }), 200
            
        except Exception as e:
            print(f"Error getting all users credit scores: {str(e)}")
            return jsonify({'error': 'Failed to get users credit scores'}), 500

    def get_user_credit_score_by_id(self, user_id):
        """Get credit score for a specific user (admin only)"""
        try:
            user, error_response, status_code = self._get_authenticated_user()
            if error_response:
                return error_response, status_code
                
            if not user.admin:
                return jsonify({'error': 'Admin privileges required'}), 403
                
            db_session = storage.session()
            
            # Verify user exists
            target_user = storage.get(User, user_id)
            if not target_user:
                return jsonify({'error': 'User not found'}), 404
            
            # Get credit score using AI model
            credit_score = self.ai_model.predict_credit_score(user_id, db_session)
            
            # Get factors affecting the score
            factors = self.ai_model.get_score_factors(user_id, db_session)
            
            # Get improvement recommendations
            recommendations = self.ai_model.get_improvement_recommendations(user_id, db_session)
            
            # Get user features for additional insights
            user_features = self.ai_model.extract_user_features(user_id, db_session)
            
            # Calculate score range and rating
            score_rating = self._get_score_rating(credit_score)
            score_range = self._get_score_range(credit_score)
            
            response_data = {
                'user_info': {
                    'user_id': target_user.id,
                    'username': target_user.username,
                    'fullname': target_user.fullname,
                    'email': target_user.email
                },
                'credit_score': credit_score,
                'score_rating': score_rating,
                'score_range': score_range,
                'factors': factors,
                'recommendations': recommendations,
                'insights': self._generate_insights(user_features, credit_score),
                'user_features': user_features,
                'last_updated': 'now'
            }
            
            db_session.close()
            return jsonify(response_data), 200
            
        except Exception as e:
            print(f"Error getting user credit score by ID: {str(e)}")
            return jsonify({'error': 'Failed to calculate credit score'}), 500

    def get_credit_score_analytics(self):
        """Get credit score analytics for all users (admin only)"""
        try:
            user, error_response, status_code = self._get_authenticated_user()
            if error_response:
                return error_response, status_code
                
            if not user.admin:
                return jsonify({'error': 'Admin privileges required'}), 403
                
            db_session = storage.session()
            
            users = db_session.query(User).all()
            scores = []
            score_ranges = {'excellent': 0, 'good': 0, 'fair': 0, 'poor': 0}
            
            for user_obj in users:
                try:
                    credit_score = self.ai_model.predict_credit_score(user_obj.id, db_session)
                    scores.append(credit_score)
                    
                    # Count score ranges
                    if credit_score >= 750:
                        score_ranges['excellent'] += 1
                    elif credit_score >= 650:
                        score_ranges['good'] += 1
                    elif credit_score >= 550:
                        score_ranges['fair'] += 1
                    else:
                        score_ranges['poor'] += 1
                        
                except Exception:
                    pass
            
            if scores:
                analytics = {
                    'total_users': len(users),
                    'users_with_scores': len(scores),
                    'average_score': round(sum(scores) / len(scores), 2),
                    'highest_score': max(scores),
                    'lowest_score': min(scores),
                    'score_distribution': score_ranges,
                    'score_ranges': {
                        'excellent': {'min': 750, 'max': 850, 'count': score_ranges['excellent']},
                        'good': {'min': 650, 'max': 749, 'count': score_ranges['good']},
                        'fair': {'min': 550, 'max': 649, 'count': score_ranges['fair']},
                        'poor': {'min': 300, 'max': 549, 'count': score_ranges['poor']}
                    }
                }
            else:
                analytics = {
                    'total_users': len(users),
                    'users_with_scores': 0,
                    'message': 'No credit scores available'
                }
            
            db_session.close()
            return jsonify(analytics), 200
            
        except Exception as e:
            print(f"Error getting credit score analytics: {str(e)}")
            return jsonify({'error': 'Failed to get credit score analytics'}), 500

    def retrain_model(self):
        """Retrain the AI model with current data (admin only)"""
        try:
            user, error_response, status_code = self._get_authenticated_user()
            if error_response:
                return error_response, status_code
                
            if not user.admin:
                return jsonify({'error': 'Admin privileges required'}), 403
                
            # This would be implemented to retrain with real data
            # For now, we'll reinitialize with synthetic data
            self.ai_model = AICredoScoreModel()
            
            return jsonify({
                'message': 'AI model retrained successfully',
                'model_status': 'trained' if self.ai_model.is_trained else 'not trained'
            }), 200
            
        except Exception as e:
            print(f"Error retraining model: {str(e)}")
            return jsonify({'error': 'Failed to retrain model'}), 500

    def _get_score_rating(self, score):
        """Get rating based on credit score"""
        if score >= 750:
            return 'Excellent'
        elif score >= 650:
            return 'Good'
        elif score >= 550:
            return 'Fair'
        else:
            return 'Poor'

    def _get_score_range(self, score):
        """Get score range information"""
        if score >= 750:
            return {'min': 750, 'max': 850, 'category': 'excellent'}
        elif score >= 650:
            return {'min': 650, 'max': 749, 'category': 'good'}
        elif score >= 550:
            return {'min': 550, 'max': 649, 'category': 'fair'}
        else:
            return {'min': 300, 'max': 549, 'category': 'poor'}

    def _generate_insights(self, user_features, credit_score):
        """Generate insights based on user features and credit score"""
        if not user_features:
            return []
        
        insights = []
        
        # Account activity insight
        if user_features['transaction_count'] > 50:
            insights.append("High account activity shows good financial engagement")
        elif user_features['transaction_count'] < 10:
            insights.append("Consider increasing account activity for better credit profile")
        
        # Balance insight
        if user_features['total_balance'] > 10000:
            insights.append("Strong account balance indicates financial stability")
        elif user_features['total_balance'] < 1000:
            insights.append("Building account balance can improve your credit score")
        
        # Loan insight
        if user_features['loan_count'] > 0:
            if user_features['repayment_ratio'] >= 0.9:
                insights.append("Excellent loan repayment history strengthens your credit")
            else:
                insights.append("Improving loan repayment consistency can boost your score")
        else:
            insights.append("Consider taking a small loan to build credit history")
        
        # Recent activity
        if user_features['days_since_last_transaction'] <= 7:
            insights.append("Recent account activity shows active financial management")
        elif user_features['days_since_last_transaction'] > 60:
            insights.append("Regular account usage can help maintain good credit standing")
        
        return insights

    def _generate_score_history(self, current_score):
        """Generate mock score history for demonstration"""
        import random
        from datetime import datetime, timedelta
        
        history = []
        base_score = current_score
        
        # Generate 12 months of history
        for i in range(12):
            date = datetime.now() - timedelta(days=30*i)
            # Add some random variation
            variation = random.randint(-20, 20)
            historical_score = max(300, min(850, base_score + variation))
            
            history.append({
                'date': date.strftime('%Y-%m-%d'),
                'score': historical_score,
                'change': variation if i < 11 else 0
            })
        
        return list()
