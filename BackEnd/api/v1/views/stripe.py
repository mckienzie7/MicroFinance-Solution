from flask import Blueprint, jsonify, request
from BackEnd.Controllers.StripeController import StripeController

stripe_views = Blueprint('stripe_views', __name__)
stripe_controller = StripeController()

@stripe_views.route('/stripe/deposit', methods=['POST'])
def deposit():
    return stripe_controller.deposit()

@stripe_views.route('/stripe/withdraw', methods=['POST'])
def withdraw():
    return stripe_controller.withdraw()

@stripe_views.route('/stripe/repay_loan', methods=['POST'])
def repay_loan():
    return stripe_controller.repay_loan()
