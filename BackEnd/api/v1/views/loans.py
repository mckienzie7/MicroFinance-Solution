#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Loans """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from BackEnd.models.Loan import Loan
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.LoanController import LoanController

@app_views.route('/loans', methods=['GET'], strict_slashes=False)
@swag_from('documentation/loan/all_loans.yml')
def get_loans():
    """
    Retrieves the list of all loan objects
    """
    all_loans = storage.all(Loan).values()
    list_loans = []
    for loan in all_loans:
        list_loans.append(loan.to_dict())
    return jsonify(list_loans)

@app_views.route('/loans/<loan_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/loan/get_loan.yml')
def get_loan(loan_id):
    """ Retrieves a specific loan """
    loan = storage.get(Loan, loan_id)
    if not loan:
        abort(404)
    return jsonify(loan.to_dict())

@app_views.route('/loans', methods=['POST'], strict_slashes=False)
@swag_from('documentation/loan/post_loan.yml')
def post_loan():
    """
    Creates a loan
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['customer_id', 'amount', 'interest_rate', 'term_months', 'purpose']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = LoanController()
    try:
        loan = controller.apply_loan(**data)
        return make_response(jsonify(loan.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/loans/<loan_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/loan/put_loan.yml')
def put_loan(loan_id):
    """
    Updates a loan
    """
    loan = storage.get(Loan, loan_id)
    if not loan:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'created_at', 'updated_at', 'customer_id']
    data = request.get_json()
    
    controller = LoanController()
    try:
        updated_loan = controller.update_loan(loan, **data)
        return make_response(jsonify(updated_loan.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/loans/<loan_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/loan/delete_loan.yml')
def delete_loan(loan_id):
    """
    Deletes a loan
    """
    loan = storage.get(Loan, loan_id)
    if not loan:
        abort(404)

    controller = LoanController()
    controller.cancel_loan(loan)
    return make_response(jsonify({}), 200)

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

@app_views.route('/loans/<loan_id>/approve', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/loan/approve_loan.yml')
def approve_loan(loan_id):
    """
    Approves a loan
    """
    loan = storage.get(Loan, loan_id)
    if not loan:
        abort(404)

    controller = LoanController()
    try:
        approved_loan = controller.approve_loan(loan)
        return make_response(jsonify(approved_loan.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/loans/<loan_id>/reject', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/loan/reject_loan.yml')
def reject_loan(loan_id):
    """
    Rejects a loan
    """
    loan = storage.get(Loan, loan_id)
    if not loan:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    reason = data.get('reason', 'No reason provided')

    controller = LoanController()
    try:
        rejected_loan = controller.reject_loan(loan, reason)
        return make_response(jsonify(rejected_loan.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400) 