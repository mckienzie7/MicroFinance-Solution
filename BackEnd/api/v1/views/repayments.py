#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Repayments """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from BackEnd.models.Repayment import Repayment
from BackEnd.models.Loan import Loan
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.RepaymentController import RepaymentController
from datetime import datetime

@app_views.route('/repayments', methods=['GET'], strict_slashes=False)
@swag_from('documentation/repayment/all_repayments.yml')
def get_repayments():
    """
    Retrieves the list of all repayment objects
    """
    all_repayments = storage.all(Repayment).values()
    list_repayments = []
    for repayment in all_repayments:
        list_repayments.append(repayment.to_dict())
    return jsonify(list_repayments)

@app_views.route('/repayments/<repayment_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/repayment/get_repayment.yml')
def get_repayment(repayment_id):
    """ Retrieves a specific repayment """
    repayment = storage.get(Repayment, repayment_id)
    if not repayment:
        abort(404)
    return jsonify(repayment.to_dict())


@app_views.route('/repayments/make-payment', methods=['POST'], strict_slashes=False)
@swag_from('documentation/repayment/make_payment.yml')
def make_payment():
    """
    Makes a payment for a loan
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['loan_id', 'amount', 'payment_method']
    data = request.get_json()

    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")
    
    # Extract user_id from the request data or use a default for testing
    user_id = data.get('user_id')
    if not user_id:
        # For testing purposes, we'll use the account_id from the loan
        # In production, you would get this from the session or token
        # First, get the loan to find the associated account_id
        loan_id = data.get('loan_id')
        try:
            loan = storage.get(Loan, loan_id)
            if loan and hasattr(loan, 'account_id'):
                # Use the account_id from the loan as the user_id
                user_id = loan.account_id
            else:
                # Fallback to a default user ID
                user_id = 1
        except Exception:
            # If loan lookup fails, use a default user ID
            user_id = 1
    
    # Extract the required fields for the controller
    loan_id = data.get('loan_id')
    payment_amount = float(data.get('amount'))
    
    try:
        # Get the loan
        loan = storage.get(Loan, loan_id)
        if not loan:
            return make_response(jsonify({"error": "Loan not found"}), 404)
        
        # Get the original loan amount (principal)
        original_principal = float(loan.amount)
        
        # Get all repayments for this loan
        repayments = [r for r in loan.repayments] if hasattr(loan, 'repayments') else []
        total_repaid = sum(float(r.amount) for r in repayments) if repayments else 0
        
        # SIMPLIFIED APPROACH: Directly reduce the loan amount by the payment amount
        # This ensures the UI always displays the updated loan amount
        new_amount = max(0, original_principal - payment_amount)
        
        # Update the loan amount directly
        loan.amount = new_amount
        
        # Update loan status if fully paid (amount is 0 or very close to 0)
        if loan.amount <= 0.01:  # Allow for small rounding errors
            loan.amount = 0
            loan.loan_status = "paid"
        
        # Create a new repayment record
        new_repayment = Repayment(
            loan_id=loan_id,
            amount=payment_amount,
            payment_method=data.get('payment_method', 'bank_transfer'),
            description=data.get('description', 'Loan repayment')
        )
        
        # Save the new repayment and loan changes
        storage.new(new_repayment)
        storage.save()
        
        # Log the payment details for debugging
        print(f"=== LOAN PAYMENT PROCESSED ===")
        print(f"Loan ID: {loan_id}")
        print(f"Original principal: {original_principal}")
        print(f"Payment amount: {payment_amount}")
        print(f"New loan amount: {loan.amount}")
        print(f"Loan status: {loan.loan_status}")
        print(f"Total paid to date: {total_repaid + payment_amount}")
        print(f"==============================")
        
        # Return success response with payment details and updated balance
        response_data = {
            "id": new_repayment.id if hasattr(new_repayment, 'id') else None,
            "loan_id": loan_id,
            "amount": payment_amount,
            "payment_method": data.get('payment_method'),
            "description": data.get('description', 'Loan repayment'),
            "status": "success",
            "previous_amount": original_principal,
            "updated_loan_amount": loan.amount,
            "total_paid": total_repaid + payment_amount
        }
        
        return make_response(jsonify(response_data), 201)
    except Exception as e:
        # Add better error handling to catch and log other exceptions
        import traceback
        print(f"Error in make_payment: {str(e)}")
        print(traceback.format_exc())
        return make_response(jsonify({"error": str(e)}), 500)

@app_views.route('/repayments/<repayment_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/repayment/put_repayment.yml')
def put_repayment(repayment_id):
    """
    Updates a repayment
    """
    repayment = storage.get(Repayment, repayment_id)
    if not repayment:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'created_at', 'updated_at', 'loan_id', 'amount']
    data = request.get_json()
    
    controller = RepaymentController()
    try:
        updated_repayment = controller.update_repayment(repayment, **data)
        return make_response(jsonify(updated_repayment.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/repayments/<repayment_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/repayment/delete_repayment.yml')
def delete_repayment(repayment_id):
    """
    Deletes a repayment
    """
    repayment = storage.get(Repayment, repayment_id)
    if not repayment:
        abort(404)

    controller = RepaymentController()
    controller.cancel_repayment(repayment)
    return make_response(jsonify({}), 200)


@app_views.route('/repayments/schedule/<loan_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/repayment/get_repayment_schedule.yml')
def get_repayment_schedule(loan_id):
    """
    Retrieves the repayment schedule for a loan
    """
    controller = RepaymentController()
    try:
        schedule = controller.get_repayment_schedule(loan_id)
        return jsonify(schedule)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

