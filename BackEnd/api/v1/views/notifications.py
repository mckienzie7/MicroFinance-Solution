#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Notifications """
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from

from BackEnd.models.Notification import Notification
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.NotificationController import NotificationController
from BackEnd.Controllers.AuthController import AuthController


@app_views.route('/notifications', methods=['GET'], strict_slashes=False)
@swag_from('documentation/notification/get_notifications.yml')
def get_user_notifications():
    """
    Retrieves notifications for the authenticated user
    """
    # Check for authentication
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"message": "Unauthorized"}), 401
    
    # Get query parameters
    limit = request.args.get('limit', 50, type=int)
    
    notification_controller = NotificationController()
    notifications = notification_controller.get_user_notifications(user.id, limit)
    
    # Convert to dictionaries
    notification_list = []
    for notification in notifications:
        notification_dict = {
            'id': notification.id,
            'message': notification.message,
            'is_read': notification.is_read,
            'created_at': notification.created_at.isoformat() if notification.created_at else None,
            'updated_at': notification.updated_at.isoformat() if notification.updated_at else None
        }
        notification_list.append(notification_dict)
    
    return jsonify(notification_list)


@app_views.route('/notifications/unread-count', methods=['GET'], strict_slashes=False)
@swag_from('documentation/notification/get_unread_count.yml')
def get_unread_count():
    """
    Get the count of unread notifications for the authenticated user
    """
    # Check for authentication
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"message": "Unauthorized"}), 401
    
    notification_controller = NotificationController()
    unread_count = notification_controller.get_unread_count(user.id)
    
    return jsonify({"unread_count": unread_count})


@app_views.route('/notifications/<notification_id>/mark-read', methods=['POST'], strict_slashes=False)
@swag_from('documentation/notification/mark_read.yml')
def mark_notification_read(notification_id):
    """
    Mark a specific notification as read
    """
    # Check for authentication
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"message": "Unauthorized"}), 401
    
    # Verify the notification belongs to the user
    notification = storage.get(Notification, notification_id)
    if not notification:
        return jsonify({"message": "Notification not found"}), 404
    
    if notification.user_id != user.id:
        return jsonify({"message": "Unauthorized to access this notification"}), 403
    
    notification_controller = NotificationController()
    if notification_controller.mark_as_read(notification_id):
        return jsonify({"message": "Notification marked as read"})
    else:
        return jsonify({"message": "Failed to mark notification as read"}), 400


@app_views.route('/notifications/mark-all-read', methods=['POST'], strict_slashes=False)
@swag_from('documentation/notification/mark_all_read.yml')
def mark_all_notifications_read():
    """
    Mark all notifications as read for the authenticated user
    """
    # Check for authentication
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"message": "Unauthorized"}), 401
    
    notification_controller = NotificationController()
    if notification_controller.mark_all_as_read(user.id):
        return jsonify({"message": "All notifications marked as read"})
    else:
        return jsonify({"message": "Failed to mark notifications as read"}), 400


@app_views.route('/notifications/<notification_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/notification/delete_notification.yml')
def delete_notification(notification_id):
    """
    Delete a specific notification
    """
    # Check for authentication
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user:
        return jsonify({"message": "Unauthorized"}), 401
    
    # Verify the notification belongs to the user
    notification = storage.get(Notification, notification_id)
    if not notification:
        return jsonify({"message": "Notification not found"}), 404
    
    if notification.user_id != user.id:
        return jsonify({"message": "Unauthorized to access this notification"}), 403
    
    notification_controller = NotificationController()
    if notification_controller.delete_notification(notification_id):
        return jsonify({"message": "Notification deleted successfully"})
    else:
        return jsonify({"message": "Failed to delete notification"}), 400


@app_views.route('/notifications/admin', methods=['GET'], strict_slashes=False)
@swag_from('documentation/notification/get_all_notifications.yml')
def get_all_notifications():
    """
    Get all notifications (Admin only)
    """
    # Check for admin authentication
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user or not user.admin:
        return jsonify({"message": "Unauthorized. Admin access required"}), 403
    
    # Get query parameters
    limit = request.args.get('limit', 100, type=int)
    user_id = request.args.get('user_id')
    
    if user_id:
        # Get notifications for a specific user
        notification_controller = NotificationController()
        notifications = notification_controller.get_user_notifications(user_id, limit)
    else:
        # Get all notifications
        notifications = storage.session().query(Notification).order_by(
            Notification.created_at.desc()
        ).limit(limit).all()
    
    # Convert to dictionaries
    notification_list = []
    for notification in notifications:
        notification_dict = {
            'id': notification.id,
            'user_id': notification.user_id,
            'message': notification.message,
            'is_read': notification.is_read,
            'created_at': notification.created_at.isoformat() if notification.created_at else None,
            'updated_at': notification.updated_at.isoformat() if notification.updated_at else None
        }
        notification_list.append(notification_dict)
    
    return jsonify(notification_list)


@app_views.route('/notifications', methods=['POST'], strict_slashes=False)
@swag_from('documentation/notification/create_notification.yml')
def create_notification():
    """
    Create a new notification (Admin only)
    """
    # Check for admin authentication
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "No authorization token provided"}), 401
    
    token = auth_header.split(' ')[1]
    auth_controller = AuthController()
    user = auth_controller.get_user_from_session_id(token)
    
    if not user or not user.admin:
        return jsonify({"message": "Unauthorized. Admin access required"}), 403
    
    if not request.get_json():
        return jsonify({"error": "Not a JSON"}), 400
    
    data = request.get_json()
    user_id = data.get('user_id')
    message = data.get('message')
    
    if not user_id or not message:
        return jsonify({"error": "Missing user_id or message"}), 400
    
    notification_controller = NotificationController()
    try:
        notification = notification_controller.create_notification(user_id, message)
        return jsonify({
            'id': notification.id,
            'user_id': notification.user_id,
            'message': notification.message,
            'is_read': notification.is_read,
            'created_at': notification.created_at.isoformat() if notification.created_at else None
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400