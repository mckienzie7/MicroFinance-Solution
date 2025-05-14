#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Accounts """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from

from BackEnd.Controllers.TransactionController import TransactionController
from BackEnd.models.Account import Account
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.AccountController import AccountController

@app_views.route('/accounts', methods=['GET'], strict_slashes=False)
@swag_from('documentation/account/all_accounts.yml')
def get_accounts():
    """
    Retrieves the list of all account objects
    """
    all_accounts = storage.all(Account).values()
    list_accounts = []
    for account in all_accounts:
        list_accounts.append(account.to_dict())
    return jsonify(list_accounts)

@app_views.route('/accounts/<account_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/account/get_account.yml')
def get_account(account_id):
    """ Retrieves a specific account """
    account = storage.get(Account, account_id)
    if not account:
        abort(404)
    return jsonify(account.to_dict())

@app_views.route('/accounts', methods=['POST'], strict_slashes=False)
@swag_from('documentation/account/post_account.yml')
def post_account():
    """
    Creates an account
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['customer_id', 'account_type', 'initial_balance']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = AccountController()
    try:
        account = controller.create_account(**data)
        return make_response(jsonify(account.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/accounts/<account_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/account/put_account.yml')
def put_account(account_id):
    """
    Updates an account
    """
    account = storage.get(Account, account_id)
    if not account:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'created_at', 'updated_at', 'customer_id', 'balance']
    data = request.get_json()
    
    controller = AccountController()
    try:
        updated_account = controller.update_account(account, data, ignore)
        return make_response(jsonify(updated_account.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/accounts/<account_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/account/delete_account.yml')
def delete_account(account_id):
    """
    Deletes an account
    """
    account = storage.get(Account, account_id)
    if not account:
        abort(404)

    controller = AccountController()
    controller.delete_account(account)
    return make_response(jsonify({}), 200)

@app_views.route('/accounts/<account_id>/deposit', methods=['POST'], strict_slashes=False)
@swag_from('documentation/account/deposit.yml')
def deposit(account_id):
    """
    Deposits money into an account
    """
    print(f"[DEBUG] deposit called with account_id={account_id}")
    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    amount = data.get('amount')
    print(f"[DEBUG] deposit amount from request: {amount} (type: {type(amount)})")
    if not amount or amount <= 0:
        abort(400, description="Invalid amount")

    account = storage.get(Account, account_id)
    print(f"[DEBUG] storage.get(Account, {account_id}) returned: {account}")
    if not account:
        abort(404)

    controller = AccountController()
    try:
        print(f"[DEBUG] Calling controller.deposit(account.id={account.id}, amount={amount})")
        controller.deposit(account.id, amount)
        updated_account = storage.get(Account, account.id)
        print(f"[DEBUG] Updated account after deposit: {updated_account}")
        return make_response(jsonify(updated_account.to_dict()), 200)
    except Exception as e:
        print(f"[ERROR] Exception in deposit: {e}")
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/accounts/<account_id>/withdraw', methods=['POST'], strict_slashes=False)
@swag_from('documentation/account/withdraw.yml')
def withdraw(account_id):
    """
    Withdraws money from an account
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    amount = data.get('amount')
    if not amount or amount <= 0:
        abort(400, description="Invalid amount")

    account = storage.get(Account, account_id)
    if not account:
        abort(404)

    controller = AccountController()
    try:
        updated_account = controller.withdraw(account, amount)
        return make_response(jsonify(updated_account), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/accounts/<account_id>/transactions', methods=['GET'], strict_slashes=False)
@swag_from('documentation/account/get_account_transactions.yml')
def get_account_transactions(account_id):
    """
    Retrieves all transactions for a specific account
    """
    account = storage.get(Account, account_id)
    if not account:
        abort(404)

    transaction = TransactionController()
    controller = AccountController()
    transactions = transaction.get_transactions_by_account(account)
    return jsonify([transaction.to_dict() for transaction in transactions]) 