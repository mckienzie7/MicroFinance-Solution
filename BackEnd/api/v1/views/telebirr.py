#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Telebirr """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.TelebirrController import TelebirrController
from sqlalchemy.orm.exc import NoResultFound

from BackEnd.models.Telebirr import Telebirr


@app_views.route('/telebirr/payments', methods=['POST'], strict_slashes=False)
@swag_from('documentation/telebirr/initiate_payment.yml')
def initiate_payment():
    """
    Initiate a Telebirr payment
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['account_id', 'amount', 'payment_type']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    try:
        controller = TelebirrController()
        payment, payment_response = controller.initiate_payment(
            data['account_id'],
            float(data['amount']),
            data['payment_type']
        )
        
        response = {
            "payment": payment.to_dict(),
            "payment_response": payment_response,
            "message": "Payment initiated successfully"
        }
        return make_response(jsonify(response), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)

@app_views.route('/telebirr/callback', methods=['POST'], strict_slashes=False)
@swag_from('documentation/telebirr/payment_callback.yml')
def payment_callback():
    """
    Handle Telebirr payment callback
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    signature = request.headers.get('X-Signature')
    
    if not signature:
        abort(400, description="Missing signature")

    try:
        controller = TelebirrController()
        payment, transaction = controller.process_payment_callback(data, signature)
        
        response = {
            "payment": payment.to_dict(),
            "transaction": transaction.to_dict() if transaction else None,
            "message": "Payment callback processed successfully"
        }
        return make_response(jsonify(response), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)

@app_views.route('/telebirr/payments/<payment_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/telebirr/check_payment_status.yml')
def check_payment_status(payment_id):
    """
    Check the status of a Telebirr payment
    """
    try:
        controller = TelebirrController()
        status_data = controller.check_payment_status(payment_id)
        return make_response(jsonify(status_data), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)

@app_views.route('/telebirr/payments/account/<account_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/telebirr/get_payment_history.yml')
def get_payment_history(account_id):
    """
    Get Telebirr payment history for an account
    """
    try:
        controller = TelebirrController()
        payments = controller.get_payment_history(account_id)
        return jsonify([payment.to_dict() for payment in payments])
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)

@app_views.route('/telebirr/payments/<payment_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/telebirr/update_payment.yml')
def update_payment(payment_id):
    """
    Update a Telebirr payment
    """
    payment = storage.get(Telebirr, payment_id)
    if not payment:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'created_at', 'updated_at', 'account_id', 'transaction_id', 'amount']
    data = request.get_json()
    
    try:
        controller = TelebirrController()
        updated_payment = controller.update_payment(payment, data, ignore)
        return make_response(jsonify(updated_payment.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400) 