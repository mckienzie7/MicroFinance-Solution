#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Transactions """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from

from BackEnd.Controllers.AccountController import AccountController
from BackEnd.models.Transaction import Transaction
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.TransactionController import TransactionController
from sqlalchemy.orm.exc import NoResultFound

@app_views.route('/transactions', methods=['GET'], strict_slashes=False)
@swag_from('documentation/transaction/all_transactions.yml')
def get_transactions():
    """
    Retrieves the list of all transaction objects
    """
    all_transactions = storage.all(Transaction).values()
    list_transactions = []
    for transaction in all_transactions:
        list_transactions.append(transaction.to_dict())
    return jsonify(list_transactions)

@app_views.route('/transactions/<transaction_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/transaction/get_transaction.yml')
def get_transaction(transaction_id):
    """ Retrieves a specific transaction """
    transaction = storage.get(Transaction, transaction_id)
    if not transaction:
        abort(404)
    return jsonify(transaction.to_dict())

@app_views.route('/transactions', methods=['POST'], strict_slashes=False)
@swag_from('documentation/transaction/post_transaction.yml')
def post_transaction():
    """
    Creates a transaction
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['account_id', 'amount', 'transaction_type', 'description']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = TransactionController()
    try:
        transaction = controller.create_transaction(**data)
        return make_response(jsonify(transaction.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/transactions/<transaction_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/transaction/put_transaction.yml')
def put_transaction(transaction_id):
    """
    Updates a transaction
    """
    transaction = storage.get(Transaction, transaction_id)
    if not transaction:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'created_at', 'updated_at', 'account_id', 'amount']
    data = request.get_json()
    
    controller = TransactionController()
    try:
        updated_transaction = controller.update_transaction(transaction, data, ignore)
        return make_response(jsonify(updated_transaction.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/transactions/<transaction_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/transaction/delete_transaction.yml')
def delete_transaction(transaction_id):
    """
    Deletes a transaction
    """
    transaction = storage.get(Transaction, transaction_id)
    if not transaction:
        abort(404)

    controller = TransactionController()
    controller.delete_transaction(transaction)
    return make_response(jsonify({}), 200)

@app_views.route('/transactions/transfer', methods=['POST'], strict_slashes=False)
@swag_from('documentation/transaction/transfer.yml')
def transfer():
    """
    Transfers money between accounts
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['from_account_id', 'to_account_id', 'amount', 'description']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    try:
        controller = TransactionController()
        debit_transaction, credit_transaction = controller.transfer(
            data['from_account_id'],
            data['to_account_id'],
            float(data['amount']),
            data['description']
        )
        
        response = {
            "debit_transaction": debit_transaction.to_dict(),
            "credit_transaction": credit_transaction.to_dict(),
            "message": "Transfer completed successfully"
        }
        return make_response(jsonify(response), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)
    except Exception as e:
        return make_response(jsonify({"error": "An unexpected error occurred"}), 500)

@app_views.route('/transactions/account/<account_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/transaction/get_account_transactions.yml')
def get_account_transactions_for_account(account_id):
    """
    Retrieves all transactions for a specific account
    """
    controller = TransactionController()
    transactions = controller.get_transactions_by_account(account_id)
    return jsonify([transaction.to_dict() for transaction in transactions])

@app_views.route('/transactions/date-range', methods=['GET'], strict_slashes=False)
@swag_from('documentation/transaction/get_transactions_by_date.yml')
def get_transactions_by_date():
    """
    Retrieves transactions within a date range
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        abort(400, description="Missing start_date or end_date")

    controller = TransactionController()
    try:
        transactions = controller.get_transactions_by_date(start_date, end_date)
        return jsonify([transaction.to_dict() for transaction in transactions])
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400) 