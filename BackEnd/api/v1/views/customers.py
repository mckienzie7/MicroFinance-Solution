#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Customers """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from BackEnd.models.customer import Customer
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.CustomerController import CustomerController

@app_views.route('/customers', methods=['GET'], strict_slashes=False)
@swag_from('documentation/customer/all_customers.yml')
def get_customers():
    """
    Retrieves the list of all customer objects
    or a specific customer
    """
    all_customers = storage.all(Customer).values()
    list_customers = []
    for customer in all_customers:
        list_customers.append(customer.to_dict())
    return jsonify(list_customers)

@app_views.route('/customers/<customer_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/customer/get_customer.yml')
def get_customer(customer_id):
    """ Retrieves a specific customer """
    customer = storage.get(Customer, customer_id)
    if not customer:
        abort(404)
    return jsonify(customer.to_dict())

@app_views.route('/customers', methods=['POST'], strict_slashes=False)
@swag_from('documentation/customer/post_customer.yml')
def post_customer():
    """
    Creates a customer
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['first_name', 'last_name', 'email', 'phone_number', 'address']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = CustomerController()
    try:
        customer = controller.create_customer(**data)
        return make_response(jsonify(customer.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/customers/<customer_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/customer/put_customer.yml')
def put_customer(customer_id):
    """
    Updates a customer
    """
    customer = storage.get(Customer, customer_id)
    if not customer:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'created_at', 'updated_at']
    data = request.get_json()
    
    controller = CustomerController()
    try:
        updated_customer = controller.update_customer(customer, data, ignore)
        return make_response(jsonify(updated_customer.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/customers/<customer_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/customer/delete_customer.yml')
def delete_customer(customer_id):
    """
    Deletes a customer
    """
    customer = storage.get(Customer, customer_id)
    if not customer:
        abort(404)

    controller = CustomerController()
    controller.delete_customer(customer)
    return make_response(jsonify({}), 200)

@app_views.route('/customers/<customer_id>/loans', methods=['GET'], strict_slashes=False)
@swag_from('documentation/customer/get_customer_loans.yml')
def get_customer_loans(customer_id):
    """
    Retrieves all loans for a specific customer
    """
    customer = storage.get(Customer, customer_id)
    if not customer:
        abort(404)

    controller = CustomerController()
    loans = controller.get_customer_loans(customer)
    return jsonify([loan.to_dict() for loan in loans])

@app_views.route('/customers/<customer_id>/accounts', methods=['GET'], strict_slashes=False)
@swag_from('documentation/customer/get_customer_accounts.yml')
def get_customer_accounts(customer_id):
    """
    Retrieves all accounts for a specific customer
    """
    customer = storage.get(Customer, customer_id)
    if not customer:
        abort(404)

    controller = CustomerController()
    accounts = controller.get_customer_accounts(customer)
    return jsonify([account.to_dict() for account in accounts]) 