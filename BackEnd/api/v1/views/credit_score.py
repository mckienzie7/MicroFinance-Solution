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

@app_views.route('/credit-score/debug', methods=['GET'], strict_slashes=False)
def debug_credit_score_data():
    """Debug endpoint to see raw data used for credit score calculation"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required"}), 401
        
        token = auth_header.split(' ')[1]
        auth_controller = AuthController()
        user = auth_controller.get_user_from_session_id(token)
        
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        
        db_session = storage.session()
        
        # Import models
        from BackEnd.models.Account import Account
        from BackEnd.models.Transaction import Transaction
        from BackEnd.models.Loan import Loan
        
        # Get raw data
        accounts = db_session.query(Account).filter(Account.user_id == user.id).all()
        
        debug_data = {
            "user_info": {
                "user_id": user.id,
                "username": user.username,
                "created_at": user.created_at.isoformat() if user.created_at else None
            },
            "accounts": []
        }
        
        for account in accounts:
            account_data = {
                "account_id": account.id,
                "account_number": account.account_number,
                "balance": float(account.balance),
                "created_at": account.created_at.isoformat() if account.created_at else None,
                "status": account.status
            }
            
            # Get transactions for this account
            transactions = db_session.query(Transaction).filter(Transaction.account_id == account.id).all()
            account_data["transactions"] = []
            
            for tx in transactions:
                account_data["transactions"].append({
                    "id": tx.id,
                    "amount": float(tx.amount),
                    "transaction_type": tx.transaction_type,
                    "description": tx.description,
                    "created_at": tx.created_at.isoformat() if tx.created_at else None
                })
            
            # Get loans for this account
            loans = db_session.query(Loan).filter(Loan.account_id == account.id).all()
            account_data["loans"] = []
            
            for loan in loans:
                account_data["loans"].append({
                    "id": loan.id,
                    "amount": float(loan.amount),
                    "loan_status": loan.loan_status,
                    "created_at": loan.created_at.isoformat() if loan.created_at else None
                })
            
            debug_data["accounts"].append(account_data)
        
        db_session.close()
        return jsonify(debug_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
        
        # Get comprehensive credit score
        score_data = credit_controller.credit_model.calculate_comprehensive_credit_score(user.id, db_session)
        
        db_session.close()
        return jsonify(score_data), 200
        
    except Exception as e:
        print(f"Error getting user credit score: {str(e)}")
        return jsonify({'error': f'Failed to calculate credit score {e}'}), 500

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
        
        # Get current score using comprehensive model
        score_data = credit_controller.credit_model.calculate_comprehensive_credit_score(user.id, db_session)
        current_score = score_data['credit_score']
        
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