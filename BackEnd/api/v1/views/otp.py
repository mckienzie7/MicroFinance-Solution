#!/usr/bin/python3
""" objects that handle all default RestFul API actions for OTP """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from BackEnd.models.otp import OTP
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.OTPController import OTPController

@app_views.route('/otp/generate', methods=['POST'], strict_slashes=False)
@swag_from('documentation/otp/generate_otp.yml')
def generate_otp():
    """
    Generates a new OTP for a user
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['user_id', 'purpose']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = OTPController()
    try:
        otp = controller.generate_otp(**data)
        return make_response(jsonify(otp.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/otp/verify', methods=['POST'], strict_slashes=False)
@swag_from('documentation/otp/verify_otp.yml')
def verify_otp():
    """
    Verifies an OTP
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['user_id', 'otp_code', 'purpose']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = OTPController()
    try:
        is_valid = controller.verify_otp(**data)
        return make_response(jsonify({"valid": is_valid}), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/otp/resend', methods=['POST'], strict_slashes=False)
@swag_from('documentation/otp/resend_otp.yml')
def resend_otp():
    """
    Resends an OTP
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['user_id', 'purpose']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = OTPController()
    try:
        otp = controller.resend_otp(**data)
        return make_response(jsonify(otp.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/otp/status/<user_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/otp/get_otp_status.yml')
def get_otp_status(user_id):
    """
    Gets the status of the latest OTP for a user
    """
    controller = OTPController()
    try:
        status = controller.get_otp_status(user_id)
        return make_response(jsonify(status), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/otp/expire/<otp_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/otp/expire_otp.yml')
def expire_otp(otp_id):
    """
    Manually expires an OTP
    """
    otp = storage.get(OTP, otp_id)
    if not otp:
        abort(404)

    controller = OTPController()
    try:
        expired_otp = controller.expire_otp(otp)
        return make_response(jsonify(expired_otp.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400) 