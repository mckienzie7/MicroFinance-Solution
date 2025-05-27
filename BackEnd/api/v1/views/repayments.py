#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Repayments """
from idlelib.autocomplete import FORCE
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from

from BackEnd.Controllers.AccountController import AccountController
from BackEnd.Controllers.TransactionController import TransactionController
from BackEnd.Controllers.UserControllers import UserController
from BackEnd.models.Repayment import Repayment
from BackEnd.models.Loan import Loan
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.RepaymentController import RepaymentController
from BackEnd.models.Transaction import Transaction


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
    user_id = data['user_id']
    acc = AccountController()
    account = acc.get_accounts_by_id(user_id)
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
    amount = float(data.get('amount'))

    # For testing purposes, implement a simplified payment process
    try:
        # Get the loan
        loan = storage.get(Loan, loan_id)
        if not loan:
            return make_response(jsonify({"error": "Loan not found"}), 404)

        # Update the loan's remaining balance
        if hasattr(loan, 'amount'):
            # Convert to float to ensure proper calculation
            current_balance = float(loan.amount)
            loan.amount = max(0, current_balance - amount)

            # If fully paid, update status
            if loan.amount <= 0:
                loan.loan_status = "paid"

        # Create a new repayment record
        new_repayment = Repayment(
            loan_id=loan_id,
            amount=amount,
            payment_method=data.get('payment_method', 'bank_transfer'),
            description=data.get('description', 'Loan repayment')
        )


        # Save the changes
        storage.new(new_repayment)
        storage.save()

        acc = AccountController()
        account = acc.get_accounts_by_id(user_id)
        amount_1 = account.balance - amount
        data1 = {"balance" : amount_1}
        acc.update_account(
            account,
            data1

        )

        new_transaction = Transaction(
            account_id=account.id,
            repayment_id=new_repayment.id,
            loan_id=loan_id,
            amount=amount,
            transaction_type="Loan Repayment",
            description="Loan Repayment purpose"
        )
        storage.new(new_transaction)
        storage.save()

        # Return success response
        response_data = {
            "id": new_repayment.id if hasattr(new_repayment, 'id') else None,
            "loan_id": loan_id,
            "amount": amount,
            "payment_method": data.get('payment_method'),
            "description": data.get('description', 'Loan repayment'),
            "status": "success",
            "remaining_balance": loan.remaining_balance if hasattr(loan, 'remaining_balance') else 0
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


@app_views.route('/repayment_transactions', methods=['POST'], strict_slashes=False)
@swag_from('documentation/transaction/repayment_transactions.yml')
def get_repayment_transactions():
    """Retrieves the list of repayment transaction objects"""
    data = request.get_json()
    if not data or 'user_id' not in data:
        return jsonify({"error": "Missing user_id"}), 400

    user_id = data['user_id']
    ucc = UserController()
    user1 = ucc.find_user_by(id=user_id)
    if not user1:
        return jsonify({"error": "User not found"}), 404

    acc = AccountController()
    account = acc.get_accounts_by_id(user_id)
    if not account:
        return jsonify({"error": "Account not found"}), 404

    all_transactions = storage.all(Transaction).values()
    list_transactions = []
    for tr in all_transactions:
        if tr.account_id == account.id and tr.repayment_id:
            list_transactions.append(tr.to_dict())



    return jsonify(list_transactions)


