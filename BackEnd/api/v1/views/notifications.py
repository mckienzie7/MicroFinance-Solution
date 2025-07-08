#!/usr/bin/python3
"""
Notification routes
"""
from flask import jsonify, abort, request
from api.v1.views import app_views
from models import storage
from models.notification import Notification


@app_views.route('/users/<user_id>/notifications', methods=['GET'],
                 strict_slashes=False)
def get_notifications(user_id):
    """
    Retrieves the list of all Notification objects for a user
    """
    user = storage.get("User", user_id)
    if not user:
        abort(404)
    notifications = []
    for notification in user.notifications:
        notifications.append(notification.to_dict())
    return jsonify(notifications)


@app_views.route('/notifications/<notification_id>', methods=['PUT'],
                 strict_slashes=False)
def mark_notification_as_read(notification_id):
    """
    Marks a notification as read
    """
    notification = storage.get(Notification, notification_id)
    if not notification:
        abort(404)
    setattr(notification, 'is_read', True)
    storage.save()
    return jsonify(notification.to_dict()), 200

