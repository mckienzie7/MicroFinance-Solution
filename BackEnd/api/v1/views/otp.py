#!/usr/bin/python3
""" objects that handle all default RestFul API actions for OTP """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from BackEnd.models.otp import OTP
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.OTPController import OTPController
from sqlalchemy.orm.exc import NoResultFound

@app_views.route('/otp/generate', methods=['POST'], strict_slashes=False)
@swag_from('documentation/otp/generate_otp.yml')
def generate_otp():
    """
    Generate a new OTP
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['account_id', 'purpose']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    try:
        controller = OTPController()
        otp = controller.generate_otp(data['account_id'], data['purpose'])
        
        response = {
            "otp": otp.to_dict(),
            "message": "OTP generated successfully"
        }
        return make_response(jsonify(response), 201)
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)

@app_views.route('/otp/validate', methods=['POST'], strict_slashes=False)
@swag_from('documentation/otp/validate_otp.yml')
def validate_otp():
    """
    Validate an OTP
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['account_id', 'otp_code', 'purpose']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    try:
        controller = OTPController()
        is_valid = controller.validate_otp(
            data['account_id'],
            data['otp_code'],
            data['purpose']
        )
        
        if is_valid:
            return make_response(jsonify({
                "message": "OTP validated successfully",
                "status": "valid"
            }), 200)
        else:
            return make_response(jsonify({
                "message": "Invalid OTP",
                "status": "invalid"
            }), 400)
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)

@app_views.route('/otp/status/<account_id>/<purpose>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/otp/get_otp_status.yml')
def get_otp_status(account_id, purpose):
    """
    Get the status of the latest OTP for an account
    """
    try:
        controller = OTPController()
        status = controller.get_otp_status(account_id, purpose)
        return make_response(jsonify(status), 200)
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)

@app_views.route('/otp/resend', methods=['POST'], strict_slashes=False)
@swag_from('documentation/otp/resend_otp.yml')
def resend_otp():
    """
    Resend OTP for an account
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['account_id', 'purpose']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    try:
        controller = OTPController()
        otp = controller.resend_otp(data['account_id'], data['purpose'])
        
        response = {
            "otp": otp.to_dict(),
            "message": "OTP resent successfully"
        }
        return make_response(jsonify(response), 201)
    except NoResultFound as e:
        return make_response(jsonify({"error": str(e)}), 404)

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