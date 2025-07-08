#!/usr/bin/python3
"""
Static pages routes
"""
from flask import jsonify, abort, request
from api.v1.views import app_views
from models import storage
from models.static_page import StaticPage


@app_views.route('/static_pages', methods=['GET'], strict_slashes=False)
def get_static_pages():
    """
    Retrieves the list of all StaticPage objects
    """
    all_pages = storage.all(StaticPage).values()
    list_pages = []
    for page in all_pages:
        list_pages.append(page.to_dict())
    return jsonify(list_pages)


@app_views.route('/static_pages/<page_name>', methods=['GET'],
                 strict_slashes=False)
def get_static_page(page_name):
    """
    Retrieves a StaticPage object
    """
    page = storage.get(StaticPage, "name", page_name)
    if not page:
        abort(404)
    return jsonify(page.to_dict())


@app_views.route('/static_pages', methods=['POST'], strict_slashes=False)
def post_static_page():
    """
    Creates a StaticPage
    """
    if not request.get_json():
        abort(400, description="Not a JSON")

    if 'name' not in request.get_json():
        abort(400, description="Missing name")
    if 'content' not in request.get_json():
        abort(400, description="Missing content")

    data = request.get_json()
    instance = StaticPage(**data)
    instance.new()
    instance.save()
    return jsonify(instance.to_dict()), 201


@app_views.route('/static_pages/<page_name>', methods=['PUT'],
                 strict_slashes=False)
def put_static_page(page_name):
    """
    Updates a StaticPage object
    """
    page = storage.get(StaticPage, "name", page_name)

    if not page:
        abort(404)

    if not request.get_json():
        abort(400, description="Not a JSON")

    ignore = ['id', 'created_at', 'updated_at']

    data = request.get_json()
    for key, value in data.items():
        if key not in ignore:
            setattr(page, key, value)
    storage.save()
    return jsonify(page.to_dict()), 200

