#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Repayments """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from BackEnd.models.repayment import Repayment
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.RepaymentController import RepaymentController

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

@app_views.route('/repayments', methods=['POST'], strict_slashes=False)
@swag_from('documentation/repayment/post_repayment.yml')
def post_repayment():
    """
    Creates a repayment
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['loan_id', 'amount', 'payment_method']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = RepaymentController()
    try:
        repayment = controller.create_repayment(**data)
        return make_response(jsonify(repayment.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

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
        updated_repayment = controller.update_repayment(repayment, data, ignore)
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
    controller.delete_repayment(repayment)
    return make_response(jsonify({}), 200)

@app_views.route('/repayments/loan/<loan_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/repayment/get_loan_repayments.yml')
def get_loan_repayments(loan_id):
    """
    Retrieves all repayments for a specific loan
    """
    controller = RepaymentController()
    repayments = controller.get_loan_repayments(loan_id)
    return jsonify([repayment.to_dict() for repayment in repayments])

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

    controller = RepaymentController()
    try:
        repayment = controller.make_payment(**data)
        return make_response(jsonify(repayment.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400) 