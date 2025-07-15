#!/usr/bin/python3
"""Credit Score API endpoints"""

from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.CreditScoreController import CreditScoreController
from flask import request, jsonify
from BackEnd.Controllers.AuthController import AuthController
from BackEnd.models import storage
from BackEnd.models.user import User

# Initialize the controller
credit_controller = CreditScoreController()

@app_views.route('/credit-score/test', methods=['GET'], strict_slashes=False)
def test_credit_score_auth():
    """Test authentication for credit score endpoints"""
    try:
        # Use the exact same authentication pattern as users.py
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No authorization token provided", "debug": "no_header"}), 401
        
        token = auth_header.split(' ')[1]
        auth_controller = AuthController()
        user = auth_controller.get_user_from_session_id(token)
        
        if not user:
            return jsonify({"error": "Invalid session token", "debug": "no_user", "token": token[:10] + "..."}), 401
            
        return jsonify({
            "message": "Authentication successful",
            "user_id": user.id,
            "username": user.username,
            "token": token[:10] + "..."
        }), 200
    except Exception as e:
        return jsonify({"error": str(e), "debug": "exception"}), 500

@app_views.route('/credit-score', methods=['GET'], strict_slashes=False)
def get_user_credit_score():
    """Get credit score for current user"""
    # Use direct authentication like users.py instead of controller method
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authentication required"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    # Now call the controller method with the authenticated user
    try:
        db_session = storage.session()
        
        # Get credit score using AI model
        credit_score = credit_controller.ai_model.predict_credit_score(user.id, db_session)
        
        # Get factors affecting the score
        factors = credit_controller.ai_model.get_score_factors(user.id, db_session)
        
        # Get improvement recommendations
        recommendations = credit_controller.ai_model.get_improvement_recommendations(user.id, db_session)
        
        # Get user features for additional insights
        user_features = credit_controller.ai_model.extract_user_features(user.id, db_session)
        
        # Calculate score range and rating
        score_rating = credit_controller._get_score_rating(credit_score)
        score_range = credit_controller._get_score_range(credit_score)
        
        response_data = {
            'credit_score': credit_score,
            'score_rating': score_rating,
            'score_range': score_range,
            'factors': factors,
            'recommendations': recommendations,
            'insights': credit_controller._generate_insights(user_features, credit_score),
            'last_updated': 'now'
        }
        
        db_session.close()
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error getting user credit score: {str(e)}")
        return jsonify({'error': 'Failed to calculate credit score'}), 500

@app_views.route('/credit-score/history', methods=['GET'], strict_slashes=False)
def get_credit_score_history():
    """Get credit score history for current user"""
    # Use direct authentication like users.py
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authentication required"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        db_session = storage.session()
        
        # For now, we'll generate a mock history based on current score
        current_score = credit_controller.ai_model.predict_credit_score(user.id, db_session)
        
        # Generate historical data (mock for demonstration)
        history = credit_controller._generate_score_history(current_score)
        
        db_session.close()
        return jsonify({
            'history': history,
            'current_score': current_score
        }), 200
        
    except Exception as e:
        print(f"Error getting credit score history: {str(e)}")
        return jsonify({'error': 'Failed to get credit score history'}), 500

@app_views.route('/admin/credit-scores', methods=['GET'], strict_slashes=False)
def get_all_users_credit_scores():
    """Get credit scores for all users (admin only)"""
    return credit_controller.get_all_users_credit_scores()

@app_views.route('/admin/credit-score/<user_id>', methods=['GET'], strict_slashes=False)
def get_user_credit_score_by_id(user_id):
    """Get credit score for specific user (admin only)"""
    return credit_controller.get_user_credit_score_by_id(user_id)

@app_views.route('/admin/credit-score/analytics', methods=['GET'], strict_slashes=False)
def get_credit_score_analytics():
    """Get credit score analytics (admin only)"""
    return credit_controller.get_credit_score_analytics()

@app_views.route('/admin/credit-score/retrain', methods=['POST'], strict_slashes=False)
def retrain_credit_score_model():
    """Retrain the AI credit score model (admin only)"""
    return credit_controller.retrain_model() 