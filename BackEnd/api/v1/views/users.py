#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Users """
from typing import Any

from werkzeug import Response

from BackEnd.models.user import User
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from flask import abort, jsonify, make_response, request, redirect, send_file, render_template
from flasgger.utils import swag_from
from BackEnd.Controllers.AuthController import AuthController
from BackEnd.Controllers.EmailVerificationController import verify_email
from BackEnd.Controllers.PasswordResetController import send_password_reset_email
from BackEnd.Controllers.UserControllers import UserController
import os
from werkzeug.utils import secure_filename
import re

@app_views.route('/users', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user/all_users.yml')
def get_users():
    """
    Retrieves the list of all user objects
    or a specific user
    -- This can be access only by Admin
    """
    # Check for admin role in session
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user or not user.admin:
        return jsonify({"message": "Unauthorized. Admin access required"}), 403
    
    all_users = storage.all(User).values()
    list_users = [user.to_dict() for user in all_users]
    return jsonify(list_users)


@app_views.route('/users/<user_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user/get_user.yml', methods=['GET'])
def get_user(user_id):
    """ Retrieves a user """
    # For GET requests, use request.args instead of get_json()
    admin = request.args.get("admin")
    # Any value of admin parameter means it's an admin request
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

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401

    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    requesting_user = auth_controller.get_user_from_session_id(token)

    if not requesting_user or not requesting_user.admin:
        return jsonify({"message": "Unauthorized. Admin access required"}), 403

    user_controller = UserController()
    if user_controller.delete_user(user_id):
        return make_response(jsonify({'message': 'User and associated accounts deleted successfully'}), 200)
    else:
        return make_response(jsonify({'error': 'Failed to delete user'}), 400)


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


@app_views.route('/users/verify-email', methods=['GET'], strict_slashes=False)
def verify_user_email():
    """
    Verifies a user's email address.
    """
    token = request.args.get('token')
    if not token:
        abort(400, description="Missing verification token")

    user = verify_email(token)

    if not user:
        abort(400, description="Invalid or expired verification token")

    # Redirect to a frontend page indicating successful verification
    return redirect("http://localhost:5173/email-verified")


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


@app_views.route('/users/<user_id>/change-password', methods=['PUT'], strict_slashes=False)
def change_password(user_id):
    """
    Changes a user's password
    """
    user = storage.get(User, user_id)

    if not user:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        abort(400, description="Missing current_password or new_password")

    if not user.check_password(current_password):
        abort(401, description="Incorrect current password")

    user.set_password(new_password)
    storage.save()

    return make_response(jsonify({"message": "Password changed successfully"}), 200)


@app_views.route('/users/register', methods=['POST'], strict_slashes=False)
@swag_from('documentation/user/Register.yml', methods=['POST'])
def register():
    """ Register a new user """
    try:
        # Handle both JSON and multipart form data
        if request.is_json:
            data = request.get_json()
            if not data:
                return jsonify({'message': 'No input data provided'}), 400
        else:
            data = request.form.to_dict()
            if not data:
                return jsonify({'message': 'No input data provided'}), 400

        # Extract required fields
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        fullname = data.get("fullName")
        phone_number = data.get("phoneNumber")
        admin = data.get("admin", "False")
        
        # Convert admin to boolean
        admin = admin.lower() == "true"

        # Validate required fields
        if not all([username, email, password, fullname, phone_number]):
            return jsonify({"message": "Missing required fields"}), 400

        # Validate email format
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({"message": "Invalid email format"}), 400

        # Validate password strength
        if len(password) < 6:
            return jsonify({"message": "Password must be at least 6 characters"}), 400

        # Handle file uploads if present
        id_card_front = request.files.get('idCardFront')
        id_card_back = request.files.get('idCardBack')
        fayda_document = request.files.get('idPicture')  # Legacy support
        
        # Validate file types
        allowed_extensions = {'jpg', 'jpeg', 'png'}
        
        if id_card_front and id_card_front.filename:
            if '.' not in id_card_front.filename or \
               id_card_front.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
                return jsonify({"message": "Invalid file type for ID card front. Allowed types: JPG, JPEG, PNG"}), 400
        
        if id_card_back and id_card_back.filename:
            if '.' not in id_card_back.filename or \
               id_card_back.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
                return jsonify({"message": "Invalid file type for ID card back. Allowed types: JPG, JPEG, PNG"}), 400
        
        if fayda_document and fayda_document.filename:
            # Legacy support - allow PDF for old uploads
            legacy_extensions = {'pdf', 'jpg', 'jpeg', 'png'}
            if '.' not in fayda_document.filename or \
               fayda_document.filename.rsplit('.', 1)[1].lower() not in legacy_extensions:
                return jsonify({"message": "Invalid file type. Allowed types: PDF, JPG, JPEG, PNG"}), 400
        
        auth = AuthController()
        try:
            new_user = auth.register_user(
                username=username,
                email=email,
                password=password,
                admin=admin,
                fullname=fullname,
                phone_number=phone_number,
                fayda_document=fayda_document,
                id_card_front=id_card_front,
                id_card_back=id_card_back
            )
            
            return jsonify({
                "username": new_user.username,
                "email": new_user.email,
                "fullname": new_user.fullname,
                "phone_number": new_user.phone_number,
                "message": "User created successfully"
            }), 201
            
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
            
    except Exception as e:
        return jsonify({"message": str(e)}), 500


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
        return jsonify({'message': 'Invalid email or password. Please check your credentials.'}), 401
    session_id = auth.create_session(email)
    
    # Get the user's username from the database using the AuthController
    try:
        # Find the user by email
        user = auth._userC.find_user_by(email=email)
        
        # Print debug information
        print(f"DEBUG - Found user: ID={user.id}, Username={user.username}, Email={user.email}")
        print(f"DEBUG - Session ID created: {session_id}")
        
        # Always use the actual username from the database
        # This is what the user entered during registration
        username = user.username
        admin = user.admin
        user_id = user.id
        
        # If username is None or empty, use a fallback
        if not username:
            username = email.split('@')[0]
            print(f"DEBUG - Username was empty, using email prefix as fallback: {username}")
        else:
            print(f"DEBUG - Using actual username from database: {username}")
    except Exception as e:
        print(f"DEBUG - Error retrieving user: {e}")
        username = email.split('@')[0]
        admin = False
        user_id = None
        print(f"DEBUG - Using email name as fallback: {username}")
    
    resp = jsonify({
        "email": email, 
        "username": username,
        "admin": admin,
        "id": user_id,
        "session_id": session_id,  # Include session_id in response body
        "message": "logged in"
    })
    # Set cookie with proper attributes for CORS
    resp.set_cookie(
        "session_id", 
        session_id,
        httponly=False,    # Allow JavaScript to access the cookie
        samesite="Lax",   # More permissive for same-site requests
        secure=False,     # Set to True in production with HTTPS
        path="/"
    )
    # Set CORS headers explicitly
    resp.headers.add('Access-Control-Allow-Credentials', 'true')
    resp.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
    return resp


@app_views.route('/users/logout', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/user/logout.yml', methods=['DELETE'])
def logout() -> Response:
    """
    - logout user
    """
    session_id = request.cookies.get("session_id")
    auth = AuthController()
    user = auth.get_user_from_session_id(session_id)
    
    if user is None:
        abort(403)
    auth.destroy_session(user.id)
    
    # Create a response that clears the session cookie
    resp = jsonify({"message": "Logged out successfully"})
    resp.set_cookie('session_id', '', expires=0)  # Clear the cookie
    return resp

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
    
    if send_password_reset_email(email):

        return make_response(jsonify({'message': 'Password reset link has been sent to your email'}), 200)
    else:
        return make_response(jsonify({'error': 'User not found'}), 404)

@app_views.route('/reset-password', methods=['POST'], strict_slashes=False)
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
    
    auth = AuthController()
    try:
        if auth.update_password(token, new_password):
            return make_response(jsonify({'message': 'Password has been reset successfully'}), 200)
        else:
            return make_response(jsonify({'error': 'Invalid or expired token'}), 400)
    except ValueError as e:
        return make_response(jsonify({'error': str(e)}), 400)

@app_views.route('/reset-password/<token>', methods=['GET'], strict_slashes=False)
def reset_password_form(token):
    # Redirect user to your React frontend
    url = os.getenv('FRONTEND_URL')
    frontend_url = f"{url}/reset-password/{token}"
    return redirect(frontend_url, code=302)

@app_views.route('/users/<user_id>/profile-picture', methods=['POST'], strict_slashes=False)
@swag_from('documentation/user/upload_profile_picture.yml')
def upload_profile_picture(user_id):
    """
    Upload or update user's profile picture
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    if 'profile_picture' not in request.files:
        return make_response(jsonify({'error': 'No file provided'}), 400)

    file = request.files['profile_picture']
    if file.filename == '':
        return make_response(jsonify({'error': 'No file selected'}), 400)

    # Check if file is an image
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if '.' not in file.filename or \
       file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return make_response(jsonify({'error': 'Invalid file type'}), 400)

    try:
        if user.update_profile_picture(file):
            return make_response(jsonify({
                'message': 'Profile picture updated successfully',
                'profile_picture_url': user.get_profile_picture_url()
            }), 200)
        return make_response(jsonify({'error': 'Failed to update profile picture'}), 400)
    except Exception as e:
        return make_response(jsonify({'error': str(e)}), 500)

@app_views.route('/users/<user_id>/fayda-document', methods=['POST'], strict_slashes=False)
@swag_from('documentation/user/upload_fayda_document.yml')
def upload_fayda_document(user_id):
    """
    Upload or update user's Fayda document
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    if 'fayda_document' not in request.files:
        return make_response(jsonify({'error': 'No file provided'}), 400)

    file = request.files['fayda_document']
    if file.filename == '':
        return make_response(jsonify({'error': 'No file selected'}), 400)

    # Check if file is a document
    allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png'}
    if '.' not in file.filename or \
       file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return make_response(jsonify({'error': 'Invalid file type'}), 400)

    try:
        if user.update_fayda_document(file):
            return make_response(jsonify({
                'message': 'Fayda document updated successfully',
                'fayda_document_url': user.get_fayda_document_url()
            }), 200)
        return make_response(jsonify({'error': 'Failed to update Fayda document'}), 400)
    except Exception as e:
        return make_response(jsonify({'error': str(e)}), 500)

@app_views.route('/users/<user_id>/profile', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user/get_user_profile.yml')
def get_user_profile(user_id):
    """
    Get user's profile information including profile picture and Fayda document URLs
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    profile_data = user.to_dict()
    profile_data.update({
        'profile_picture_url': user.get_profile_picture_url(),
        'fayda_document_url': user.get_fayda_document_url(),
        'id_card_front_url': user.get_id_card_front_url(),
        'id_card_back_url': user.get_id_card_back_url()
    })
    
    return jsonify(profile_data)

@app_views.route('/users/<user_id>/profile-picture/download', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user/download_profile_picture.yml')
def download_profile_picture(user_id):
    """
    Download user's profile picture
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    if not user.profile_picture_path:
        return make_response(jsonify({'error': 'No profile picture found'}), 404)

    try:
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                                 'static', user.profile_picture_path)

        if not os.path.exists(file_path):
            return make_response(jsonify({'error': 'Profile picture file not found'}), 404)

        # Get the original filename from the path
        original_filename = os.path.basename(user.profile_picture_path)
        # Remove the user ID prefix from the filename
        original_filename = '_'.join(original_filename.split('_')[1:])

        return send_file(
            file_path,
            download_name=original_filename,
            mimetype='image/jpeg'  # Adjust based on file type
        )
    except Exception as e:
        return make_response(jsonify({'error': str(e)}), 500)

@app_views.route('/users/<user_id>/fayda-document/download', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user/download_fayda_document.yml')
def download_fayda_document(user_id):
    """
    Download user's Fayda document
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    if not user.fayda_document_path:
        return make_response(jsonify({'error': 'No Fayda document found'}), 404)

    try:
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                                 'static', user.fayda_document_path)

        if not os.path.exists(file_path):
            return make_response(jsonify({'error': 'Fayda document file not found'}), 404)

        # Get the original filename from the path
        original_filename = os.path.basename(user.fayda_document_path)
        # Remove the user ID prefix from the filename
        original_filename = '_'.join(original_filename.split('_')[1:])

        # Determine the correct mimetype based on file extension
        file_extension = os.path.splitext(original_filename)[1].lower()
        mimetype = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        }.get(file_extension, 'application/octet-stream')

        return send_file(
            file_path,
            download_name=original_filename,
            mimetype=mimetype
        )
    except Exception as e:
        return make_response(jsonify({'error': str(e)}), 500)

@app_views.route('/users/<user_id>/id-card-front/download', methods=['GET'], strict_slashes=False)
def download_id_card_front(user_id):
    """
    Download user's ID card front image
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    if not user.id_card_front_path:
        return make_response(jsonify({'error': 'No ID card front image found'}), 404)

    try:
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                                 'static', user.id_card_front_path)

        if not os.path.exists(file_path):
            return make_response(jsonify({'error': 'ID card front image file not found'}), 404)

        # Get the original filename from the path
        original_filename = os.path.basename(user.id_card_front_path)

        # Determine the correct mimetype based on file extension
        file_extension = os.path.splitext(original_filename)[1].lower()
        mimetype = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        }.get(file_extension, 'image/jpeg')

        return send_file(
            file_path,
            download_name=original_filename,
            mimetype=mimetype
        )
    except Exception as e:
        return make_response(jsonify({'error': str(e)}), 500)

@app_views.route('/users/<user_id>/id-card-back/download', methods=['GET'], strict_slashes=False)
def download_id_card_back(user_id):
    """
    Download user's ID card back image
    """
    user = storage.get(User, user_id)
    if not user:
        abort(404)

    if not user.id_card_back_path:
        return make_response(jsonify({'error': 'No ID card back image found'}), 404)

    try:
        file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                                 'static', user.id_card_back_path)

        if not os.path.exists(file_path):
            return make_response(jsonify({'error': 'ID card back image file not found'}), 404)

        # Get the original filename from the path
        original_filename = os.path.basename(user.id_card_back_path)

        # Determine the correct mimetype based on file extension
        file_extension = os.path.splitext(original_filename)[1].lower()
        mimetype = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        }.get(file_extension, 'image/jpeg')

        return send_file(
            file_path,
            download_name=original_filename,
            mimetype=mimetype
        )
    except Exception as e:
        return make_response(jsonify({'error': str(e)}), 500)

@app_views.route('/users/admins', methods=['GET'], strict_slashes=False)
@swag_from('documentation/user/get_admins.yml')
def get_admins():
    """
    Retrieves the list of all admin users
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    # Get all admin users
    admin_users = storage.session().query(User).filter(User.admin == True).all()
    return jsonify([admin.to_dict() for admin in admin_users])