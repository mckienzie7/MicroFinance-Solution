#!/usr/bin/python3
""" Flask Application """

from BackEnd.models import storage
from BackEnd.api.v1.views import app_views
from BackEnd.api.v1.views.stripe import stripe_views
from BackEnd.api.v1.views.company_balance import company_balance_bp
from os import environ
from flask import Flask, make_response, jsonify
from flask_cors import CORS
from flasgger import Swagger

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

app.register_blueprint(app_views, url_prefix='/api/v1')
app.register_blueprint(stripe_views, url_prefix='/api/v1')
app.register_blueprint(company_balance_bp, url_prefix='/api/v1/company')

# Configure CORS to allow requests from any origin
# More permissive CORS configuration for file uploads
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # Allow all origins in development
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})


@app.teardown_appcontext
def close_db(error):
    """ Close Storage """
    storage.close()


@app.errorhandler(404)
def not_found(error):
    """ 404 Error
    ---
    responses:
      404:
        description: a resource was not found hhh
    """
    return make_response(jsonify({'error': "Not found"}), 404)

app.config['SWAGGER'] = {
    'title': 'UniLove App Restful API',
    'uiversion': 3
}

Swagger(app)


if __name__ == "__main__":
    """ Main Function """
    host = environ.get('MFS_API_HOST')
    port = environ.get('MFS_API_PORT')
    if not host:
        host = '0.0.0.0'
    if not port:
        port = '5000'
    app.run(host=host, port=port, threaded=True)
