#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Users """
from typing import Any

from werkzeug import Response

from BackEnd.models.user import User
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from flask import abort, jsonify, make_response, request, redirect
from flasgger.utils import swag_from
from BackEnd.Controllers.AuthController import AuthController
@app_views.route('/users', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user/all_users.yml')
def get_users():
    """
    Retrieves the list of all user objects
    or a specific user
    -- This can be access only by Admin
    """
    data = request.get_json()
    admin = data.get("admin")
    if admin == "False":
        admin = False
    elif admin == "True":
        admin = True
    if admin:
        all_users = storage.all(User).values()
        list_users = []
        for user in all_users:
            list_users.append(user.to_dict())
        return jsonify(list_users)
    else:
        return jsonify({"message" : "UnAuthorized"}), 401


@app_views.route('/users/<user_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user/get_user.yml', methods=['GET'])
def get_user(user_id):
    """ Retrieves an user """
    data = request.get_json()
    admin = data.get("admin")
    if admin == "False":
        admin = False
    elif admin == "True":
        admin = True
    if admin:
        user = storage.get(User, user_id)
        if not user:
            abort(404)

        return jsonify(user.to_dict())
    else:
        return jsonify({"message" : "UnAuthorized"}), 401



@app_views.route('/users/<user_id>', methods=['DELETE'],
                 strict_slashes=False)
@swag_from('documentation/user/delete_user.yml', methods=['DELETE'])
def delete_user(user_id):
    """
    Deletes a user Object
    """

    user = storage.get(User, user_id)

    if not user:
        abort(404)

    storage.delete(user)
    storage.save()

    return make_response(jsonify({}), 200)


@app_views.route('/users', methods=['POST'], strict_slashes=False)
@swag_from('documentation/user/post_user.yml', methods=['POST'])
def post_user():
    """
    Creates a user
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    if 'email' not in request.get_json():
        abort(400, description="Missing email")
    if 'password' not in request.get_json():
        abort(400, description="Missing password")

    data = request.get_json()
    instance = User(**data)
    instance.save()
    return make_response(jsonify(instance.to_dict()), 201)


@app_views.route('/users/<user_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/user/put_user.yml', methods=['PUT'])
def put_user(user_id):
    """
    Updates a user
    """
    user = storage.get(User, user_id)

    if not user:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'email', 'created_at', 'updated_at']

    data = request.get_json()
    for key, value in data.items():
        if key not in ignore:
            setattr(user, key, value)
    storage.save()
    return make_response(jsonify(user.to_dict()), 200)

@app_views.route('/users/Register', methods=['POST'], strict_slashes=False)
@swag_from('documentation/user/Register.yml', methods=['POST'])
def Register():
    """ Register a new user
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided'}), 400
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    admin = data.get("admin")
    if admin == "False":
        admin = False
    elif admin == "True":
        admin = True
    print(f"Username: {username}, Email: {email}, Password: {password}")

    if not username or not email or not password:
        return jsonify({"message": "Missing username, email or password"}), 400
    auth = AuthController()
    try:
        new_user = auth.register_user(username, email, password, admin)
        return jsonify({"username": new_user.username, "email": new_user.email, "message": "user created"})
    except ValueError:
        return jsonify({"message": "email already registered"}), 400


@app_views.route('/users/login', methods=['POST'], strict_slashes=False)
@swag_from('documentation/user/login.yml', methods=['POST'])
def login() -> tuple[Any, int] | Any:
    """
    - POST login user
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided'}), 400
    email = data.get("email")
    password = data.get("password")
    auth = AuthController()
    if not auth.valid_login(email, password):
        abort(401)
    session_id = auth.create_session(email)
    resp = jsonify({"email": email, "message": "logged in"})
    resp.set_cookie("session_id", session_id)
    return resp


@app_views.route('/users/logout', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/user/logout.yml', methods=['DELETE'])
def logout() -> Response:
    """
    - logout user
    """
    session_id = request.cookies.get("session_id")
    user = AuthController.get_user_from_session_id(session_id)
    if user is None:
        abort(403)
    AuthController.destroy_session(user.id)
    return redirect("/")

@app_views.route('/users/forgot-password', methods=['POST'], strict_slashes=False)
@swag_from('documentation/user/forgot_password.yml', methods=['POST'])
def forgot_password():
    """
    Request password reset
    """
    if not request.get_json():
        return make_response(jsonify({'error': 'Not a JSON'}), 400)
    
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return make_response(jsonify({'error': 'Email is required'}), 400)
    
    # Find user by email
    users = storage.all(User).values()
    user = None
    for u in users:
        if u.email == email:
            user = u
            break
    
    if not user:
        return make_response(jsonify({'error': 'User not found'}), 404)
    
    # Generate reset token (you can use a more secure method)
    import secrets
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    storage.save()
    
    # TODO: Send email with reset link
    # For now, we'll just return the token (in production, send via email)
    reset_link = f"http://your-frontend-url/reset-password?token={reset_token}"
    
    return make_response(jsonify({
        'message': 'Password reset link has been sent to your email',
        'reset_link': reset_link  # Remove this in production
    }), 200)

@app_views.route('/users/reset-password', methods=['POST'], strict_slashes=False)
@swag_from('documentation/user/reset_password.yml', methods=['POST'])
def reset_password():
    """
    Reset password using token
    ---
    """
    if not request.get_json():
        return make_response(jsonify({'error': 'Not a JSON'}), 400)
    
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')
    
    if not token or not new_password:
        return make_response(jsonify({'error': 'Token and new password are required'}), 400)
    
    # Find user by reset token
    users = storage.all(User).values()
    user = None
    for u in users:
        if u.reset_token == token:
            user = u
            break
    
    if not user:
        return make_response(jsonify({'error': 'Invalid or expired reset token'}), 404)
    
    # Update password and clear reset token
    user.set_password(new_password)
    user.reset_token = None
    storage.save()
    
    return make_response(jsonify({'message': 'Password has been reset successfully'}), 200)
