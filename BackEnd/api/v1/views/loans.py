#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Loans """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from BackEnd.models.Loan import Loan
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.LoanController import LoanController
from BackEnd.Controllers.AuthController import AuthController
from BackEnd.models.Account import Account
from sqlalchemy.orm.exc import NoResultFound

@app_views.route('/loans', methods=['GET'], strict_slashes=False)
@swag_from('documentation/loan/all_loans.yml')
def get_loans():
    """
    Retrieves the list of all loan objects
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    controller = LoanController()
    
    # If user is admin, they can see their assigned loans
    if user.admin:
        try:
            loans = controller.get_admin_loans(user.id)
            return jsonify([loan.to_dict() for loan in loans])
        except ValueError as e:
            return make_response(jsonify({"error": str(e)}), 400)
    
    # If user is not admin, they can only see their own loans
    try:
        # Use SQLAlchemy query to get loans with account relationship loaded
        user_loans = storage.session().query(Loan).join(Loan.account).filter(Account.user_id == user.id).all()
        # Convert loans to dict and include account relationship
        loan_dicts = []
        for loan in user_loans:
            loan_dict = loan.to_dict()
            if loan.account:
                loan_dict['account'] = loan.account.to_dict()
            loan_dicts.append(loan_dict)
        return jsonify(loan_dicts)
    except Exception as e:
        print(f"Error fetching user loans: {e}")
        return make_response(jsonify({"error": "Failed to fetch loans"}), 500)

@app_views.route('/loans/<loan_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/loan/get_loan.yml')
def get_loan(loan_id):
    """
    Retrieves a specific loan
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    loan = storage.get(Loan, loan_id)
    if not loan:
        abort(404)

    # Check if user has permission to view this loan
    if not user.admin and loan.account.user_id != user.id:
        return jsonify({"message": "Unauthorized"}), 403

    return jsonify(loan.to_dict())

@app_views.route('/loans', methods=['POST'], strict_slashes=False)
@swag_from('documentation/loan/post_loan.yml')
def post_loan():
    """
    Creates a loan application
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['user_id', 'amount', 'interest_rate', 'repayment_period', 'purpose', 'admin_id']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = LoanController()
    try:
        loan = controller.apply_loan(
            data['user_id'],
            data['amount'],
            data['interest_rate'],
            data['repayment_period'],
            data['purpose'],
            data['admin_id']
        )
        return make_response(jsonify(loan.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/loans/admin/<admin_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/loan/get_admin_loans.yml')
def get_admin_loans(admin_id):
    """
    Gets all loans assigned to a specific admin
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user or not user.admin:
        return jsonify({"message": "Unauthorized. Admin access required"}), 403

    controller = LoanController()
    try:
        loans = controller.get_admin_loans(admin_id)
        return jsonify([loan.to_dict() for loan in loans])
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/loans/unassigned', methods=['GET'], strict_slashes=False)
@swag_from('documentation/loan/get_unassigned_loans.yml')
def get_unassigned_loans():
    """
    Gets all pending loans that haven't been assigned to an admin
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user or not user.admin:
        return jsonify({"message": "Unauthorized. Admin access required"}), 403

    controller = LoanController()
    loans = controller.get_unassigned_loans()
    return jsonify([loan.to_dict() for loan in loans])

@app_views.route('/loans/<loan_id>/approve', methods=['POST'], strict_slashes=False)
@swag_from('documentation/loan/approve_loan.yml')
def approve_loan(loan_id):
    """
    Approves a loan application
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user or not user.admin:
        return jsonify({"message": "Unauthorized. Admin access required"}), 403

    controller = LoanController()
    try:
        loan = controller.approve_loan(loan_id, user.id)
        
        # Get the repayment schedule
        schedule = controller.get_loan_repayment_schedule(loan_id)
        
        response = loan.to_dict()
        response['repayment_schedule'] = schedule
        
        return make_response(jsonify(response), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)

@app_views.route('/loans/<loan_id>/reject', methods=['POST'], strict_slashes=False)
@swag_from('documentation/loan/reject_loan.yml')
def reject_loan(loan_id):
    """
    Rejects a loan application
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user or not user.admin:
        return jsonify({"message": "Unauthorized. Admin access required"}), 403

    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    if 'reason' not in data:
        abort(400, description="Missing reason")

    controller = LoanController()
    try:
        loan = controller.reject_loan(loan_id, user.id, data['reason'])
        return make_response(jsonify(loan.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)

@app_views.route('/loans/<loan_id>/repayments', methods=['GET'], strict_slashes=False)
@swag_from('documentation/loan/get_loan_repayments.yml')
def get_loan_repayments(loan_id):
    """
    Retrieves all repayments for a specific loan
    """
    loan = storage.get(Loan, loan_id)
    if not loan:
        abort(404)

    controller = LoanController()
    repayments = controller.get_loan_repayments(loan)
    return jsonify([repayment.to_dict() for repayment in repayments]) 