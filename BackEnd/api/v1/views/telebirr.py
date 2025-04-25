#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Telebirr """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from BackEnd.models.telebirr import Telebirr
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.TelebirrController import TelebirrController

@app_views.route('/telebirr/initiate-payment', methods=['POST'], strict_slashes=False)
@swag_from('documentation/telebirr/initiate_payment.yml')
def initiate_payment():
    """
    Initiates a payment through Telebirr
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['amount', 'customer_phone', 'description']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = TelebirrController()
    try:
        payment = controller.initiate_payment(**data)
        return make_response(jsonify(payment.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/telebirr/check-payment/<payment_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/telebirr/check_payment.yml')
def check_payment(payment_id):
    """
    Checks the status of a payment
    """
    payment = storage.get(Telebirr, payment_id)
    if not payment:
        abort(404)

    controller = TelebirrController()
    try:
        status = controller.check_payment_status(payment)
        return make_response(jsonify(status), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/telebirr/callback', methods=['POST'], strict_slashes=False)
@swag_from('documentation/telebirr/payment_callback.yml')
def payment_callback():
    """
    Handles Telebirr payment callback
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    controller = TelebirrController()
    try:
        result = controller.handle_callback(request.get_json())
        return make_response(jsonify(result), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/telebirr/refund', methods=['POST'], strict_slashes=False)
@swag_from('documentation/telebirr/refund_payment.yml')
def refund_payment():
    """
    Initiates a refund through Telebirr
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['payment_id', 'amount', 'reason']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = TelebirrController()
    try:
        refund = controller.initiate_refund(**data)
        return make_response(jsonify(refund.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/telebirr/transactions', methods=['GET'], strict_slashes=False)
@swag_from('documentation/telebirr/get_transactions.yml')
def get_transactions():
    """
    Retrieves Telebirr transactions
    """
    controller = TelebirrController()
    try:
        transactions = controller.get_transactions()
        return make_response(jsonify([t.to_dict() for t in transactions]), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/telebirr/balance', methods=['GET'], strict_slashes=False)
@swag_from('documentation/telebirr/get_balance.yml')
def get_balance():
    """
    Gets the current balance in Telebirr account
    """
    controller = TelebirrController()
    try:
        balance = controller.get_balance()
        return make_response(jsonify({"balance": balance}), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400) 