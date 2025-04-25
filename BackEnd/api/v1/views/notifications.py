#!/usr/bin/python3
""" objects that handle all default RestFul API actions for Notifications """
from typing import Any
from flask import abort, jsonify, make_response, request
from flasgger.utils import swag_from
from BackEnd.models.notification import Notification
from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.NotificationController import NotificationController

@app_views.route('/notifications', methods=['GET'], strict_slashes=False)
@swag_from('documentation/notification/all_notifications.yml')
def get_notifications():
    """
    Retrieves the list of all notification objects
    """
    all_notifications = storage.all(Notification).values()
    list_notifications = []
    for notification in all_notifications:
        list_notifications.append(notification.to_dict())
    return jsonify(list_notifications)

@app_views.route('/notifications/<notification_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/notification/get_notification.yml')
def get_notification(notification_id):
    """ Retrieves a specific notification """
    notification = storage.get(Notification, notification_id)
    if not notification:
        abort(404)
    return jsonify(notification.to_dict())

@app_views.route('/notifications', methods=['POST'], strict_slashes=False)
@swag_from('documentation/notification/post_notification.yml')
def post_notification():
    """
    Creates a notification
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    required_fields = ['user_id', 'message', 'notification_type']
    data = request.get_json()
    
    for field in required_fields:
        if field not in data:
            abort(400, description=f"Missing {field}")

    controller = NotificationController()
    try:
        notification = controller.create_notification(**data)
        return make_response(jsonify(notification.to_dict()), 201)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/notifications/<notification_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/notification/put_notification.yml')
def put_notification(notification_id):
    """
    Updates a notification
    """
    notification = storage.get(Notification, notification_id)
    if not notification:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'created_at', 'updated_at', 'user_id']
    data = request.get_json()
    
    controller = NotificationController()
    try:
        updated_notification = controller.update_notification(notification, data, ignore)
        return make_response(jsonify(updated_notification.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/notifications/<notification_id>', methods=['DELETE'], strict_slashes=False)
@swag_from('documentation/notification/delete_notification.yml')
def delete_notification(notification_id):
    """
    Deletes a notification
    """
    notification = storage.get(Notification, notification_id)
    if not notification:
        abort(404)

    controller = NotificationController()
    controller.delete_notification(notification)
    return make_response(jsonify({}), 200)

@app_views.route('/notifications/user/<user_id>', methods=['GET'], strict_slashes=False)
@swag_from('documentation/notification/get_user_notifications.yml')
def get_user_notifications(user_id):
    """
    Retrieves all notifications for a specific user
    """
    controller = NotificationController()
    notifications = controller.get_user_notifications(user_id)
    return jsonify([notification.to_dict() for notification in notifications])

@app_views.route('/notifications/mark-read/<notification_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/notification/mark_notification_read.yml')
def mark_notification_read(notification_id):
    """
    Marks a notification as read
    """
    notification = storage.get(Notification, notification_id)
    if not notification:
        abort(404)

    controller = NotificationController()
    try:
        updated_notification = controller.mark_notification_read(notification)
        return make_response(jsonify(updated_notification.to_dict()), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400)

@app_views.route('/notifications/mark-all-read/<user_id>', methods=['PUT'], strict_slashes=False)
@swag_from('documentation/notification/mark_all_notifications_read.yml')
def mark_all_notifications_read(user_id):
    """
    Marks all notifications as read for a user
    """
    controller = NotificationController()
    try:
        notifications = controller.mark_all_notifications_read(user_id)
        return make_response(jsonify([n.to_dict() for n in notifications]), 200)
    except ValueError as e:
        return make_response(jsonify({"error": str(e)}), 400) 