#!/usr/bin/python3
"""
Comprehensive Credit Score API endpoints
This is a new comprehensive credit scoring system that analyzes:
- User details and account age
- Transaction history and patterns  
- Deposit amounts and frequency
- Loan repayment pace and history
- Account balance trends
- Financial behavior patterns
"""

from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.ComprehensiveCreditScoreController import ComprehensiveCreditScoreController
from BackEnd.Controllers.AuthController import AuthController
from flask import request, jsonify
from BackEnd.models import storage
from BackEnd.models.user import User

# Initialize the comprehensive credit score controller
comprehensive_controller = ComprehensiveCreditScoreController()

@app_views.route('/comprehensive-credit-score', methods=['GET'], strict_slashes=False)
def get_comprehensive_credit_score():
    """Get comprehensive credit score for authenticated user"""
    try:
        response_data, status_code = comprehensive_controller.get_user_comprehensive_score_authenticated()
        return response_data, status_code
    except Exception as e:
        print(f"Error in comprehensive credit score endpoint: {e}")
        return jsonify({'error': f'Failed to get comprehensive credit score: {str(e)}'}), 500

@app_views.route('/comprehensive-credit-score/history', methods=['GET'], strict_slashes=False)
def get_comprehensive_score_history():
    """Get comprehensive credit score history for authenticated user"""
    try:
        # Authenticate user
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required"}), 401
        
        token = auth_header.split(' ')[1]
        auth_controller = AuthController()
        user = auth_controller.get_user_from_session_id(token)
        
        if not user:
            return jsonify({"error": "Invalid session token"}), 401
        
        # Get optional months parameter
        months = request.args.get('months', 12, type=int)
        months = max(1, min(months, 24))  # Limit between 1 and 24 months
        
        response_data, status_code = comprehensive_controller.get_score_history(user.id, months)
        return response_data, status_code
        
    except Exception as e:
        print(f"Error in score history endpoint: {e}")
        return jsonify({'error': f'Failed to get score history: {str(e)}'}), 500

@app_views.route('/comprehensive-credit-score/comparison', methods=['GET'], strict_slashes=False)
def get_comprehensive_score_comparison():
    """Get comprehensive credit score comparison with other users"""
    try:
        # Authenticate user
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required"}), 401
        
        token = auth_header.split(' ')[1]
        auth_controller = AuthController()
        user = auth_controller.get_user_from_session_id(token)
        
        if not user:
            return jsonify({"error": "Invalid session token"}), 401
        
        response_data, status_code = comprehensive_controller.get_score_comparison(user.id)
        return response_data, status_code
        
    except Exception as e:
        print(f"Error in score comparison endpoint: {e}")
        return jsonify({'error': f'Failed to get score comparison: {str(e)}'}), 500

@app_views.route('/comprehensive-credit-score/loan-eligibility', methods=['GET'], strict_slashes=False)
def get_loan_eligibility():
    """Get loan eligibility based on comprehensive credit score"""
    try:
        # Authenticate user
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required"}), 401
        
        token = auth_header.split(' ')[1]
        auth_controller = AuthController()
        user = auth_controller.get_user_from_session_id(token)
        
        if not user:
            return jsonify({"error": "Invalid session token"}), 401
        
        # Get optional requested amount parameter
        requested_amount = request.args.get('amount', type=float)
        
        response_data, status_code = comprehensive_controller.get_loan_eligibility(user.id, requested_amount)
        return response_data, status_code
        
    except Exception as e:
        print(f"Error in loan eligibility endpoint: {e}")
        return jsonify({'error': f'Failed to get loan eligibility: {str(e)}'}), 500

@app_views.route('/comprehensive-credit-score/factors', methods=['GET'], strict_slashes=False)
def get_comprehensive_score_factors():
    """Get detailed breakdown of all factors affecting comprehensive credit score"""
    try:
        # Authenticate user
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required"}), 401
        
        token = auth_header.split(' ')[1]
        auth_controller = AuthController()
        user = auth_controller.get_user_from_session_id(token)
        
        if not user:
            return jsonify({"error": "Invalid session token"}), 401
        
        response_data, status_code = comprehensive_controller.get_score_factors_detailed(user.id)
        return response_data, status_code
        
    except Exception as e:
        print(f"Error in score factors endpoint: {e}")
        return jsonify({'error': f'Failed to get score factors: {str(e)}'}), 500

@app_views.route('/comprehensive-credit-score/test-auth', methods=['GET'], strict_slashes=False)
def test_comprehensive_auth():
    """Test authentication for comprehensive credit score endpoints"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "No authorization token provided"}), 401
        
        token = auth_header.split(' ')[1]
        auth_controller = AuthController()
        user = auth_controller.get_user_from_session_id(token)
        
        if not user:
            return jsonify({"error": "Invalid session token"}), 401
            
        return jsonify({
            "message": "Authentication successful for comprehensive credit score",
            "user_id": user.id,
            "username": user.username,
            "system": "comprehensive_credit_score"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Admin endpoints for comprehensive credit score system
@app_views.route('/admin/comprehensive-credit-score/analytics', methods=['GET'], strict_slashes=False)
def get_comprehensive_admin_analytics():
    """Get comprehensive credit score analytics for admin dashboard"""
    try:
        # TODO: Add admin authentication check
        response_data, status_code = comprehensive_controller.get_admin_analytics()
        return response_data, status_code
        
    except Exception as e:
        print(f"Error in admin analytics endpoint: {e}")
        return jsonify({'error': f'Failed to get admin analytics: {str(e)}'}), 500

@app_views.route('/admin/comprehensive-credit-score/user/<user_id>', methods=['GET'], strict_slashes=False)
def get_user_comprehensive_score_admin(user_id):
    """Get comprehensive credit score for specific user (admin only)"""
    try:
        # TODO: Add admin authentication check
        response_data, status_code = comprehensive_controller.get_comprehensive_credit_score(user_id)
        return response_data, status_code
        
    except Exception as e:
        print(f"Error in admin user score endpoint: {e}")
        return jsonify({'error': f'Failed to get user comprehensive score: {str(e)}'}), 500

@app_views.route('/admin/comprehensive-credit-score/user/<user_id>/factors', methods=['GET'], strict_slashes=False)
def get_user_comprehensive_factors_admin(user_id):
    """Get detailed factors for specific user (admin only)"""
    try:
        # TODO: Add admin authentication check
        response_data, status_code = comprehensive_controller.get_score_factors_detailed(user_id)
        return response_data, status_code
        
    except Exception as e:
        print(f"Error in admin user factors endpoint: {e}")
        return jsonify({'error': f'Failed to get user factors: {str(e)}'}), 500

@app_views.route('/admin/comprehensive-credit-score/user/<user_id>/loan-eligibility', methods=['GET'], strict_slashes=False)
def get_user_loan_eligibility_admin(user_id):
    """Get loan eligibility for specific user (admin only)"""
    try:
        # TODO: Add admin authentication check
        requested_amount = request.args.get('amount', type=float)
        response_data, status_code = comprehensive_controller.get_loan_eligibility(user_id, requested_amount)
        return response_data, status_code
        
    except Exception as e:
        print(f"Error in admin loan eligibility endpoint: {e}")
        return jsonify({'error': f'Failed to get loan eligibility: {str(e)}'}), 500

@app_views.route('/comprehensive-credit-score/debug/<user_id>', methods=['GET'], strict_slashes=False)
def debug_comprehensive_credit_data(user_id):
    """Debug endpoint to see raw data used for comprehensive credit score calculation"""
    try:
        # Get user
        user = storage.get(User, user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        db_session = storage.session()
        
        # Import models
        from BackEnd.models.Account import Account
        from BackEnd.models.Transaction import Transaction
        from BackEnd.models.Loan import Loan
        from BackEnd.models.Repayment import Repayment
        
        # Get raw data
        accounts = db_session.query(Account).filter(Account.user_id == user_id).all()
        
        debug_data = {
            "user_info": {
                "user_id": user.id,
                "username": user.username,
                "fullname": user.fullname,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "account_age_days": (datetime.now() - user.created_at).days if user.created_at else 0
            },
            "accounts": [],
            "comprehensive_analysis": "This endpoint shows raw data used by the comprehensive credit scoring system"
        }
        
        for account in accounts:
            account_data = {
                "account_id": account.id,
                "account_number": account.account_number,
                "balance": float(account.balance),
                "type": account.type,
                "status": account.status,
                "created_at": account.created_at.isoformat() if account.created_at else None
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
                loan_data = {
                    "id": loan.id,
                    "amount": float(loan.amount),
                    "interest_rate": float(loan.interest_rate),
                    "loan_status": loan.loan_status,
                    "repayment_period": loan.repayment_period,
                    "end_date": loan.end_date.isoformat() if loan.end_date else None,
                    "created_at": loan.created_at.isoformat() if loan.created_at else None
                }
                
                # Get repayments for this loan
                repayments = db_session.query(Repayment).filter(Repayment.loan_id == loan.id).all()
                loan_data["repayments"] = []
                
                for repayment in repayments:
                    loan_data["repayments"].append({
                        "id": repayment.id,
                        "amount": float(repayment.amount),
                        "status": repayment.status,
                        "created_at": repayment.created_at.isoformat() if repayment.created_at else None
                    })
                
                account_data["loans"].append(loan_data)
            
            debug_data["accounts"].append(account_data)
        
        # Add comprehensive score calculation
        from datetime import datetime
        score_data = comprehensive_controller.model.calculate_comprehensive_credit_score(user_id, db_session)
        debug_data["comprehensive_score"] = score_data
        
        db_session.close()
        return jsonify(debug_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500