import stripe
from flask import request, jsonify
from BackEnd.models import storage
from BackEnd.models.Stripe import StripePayment
from BackEnd.models.user import User
from os import getenv
from BackEnd.Controllers.AccountController import AccountController
from BackEnd.Controllers.TransactionController import TransactionController
from BackEnd.models.Loan import Loan

stripe.api_key = getenv('STRIPE_SECRET_KEY')

class StripeController:
    """
    Handles Stripe payment processing for deposits, withdrawals, and loan repayments.
    """
    def __init__(self):
        self.account_controller = AccountController()
        self.transaction_controller = TransactionController()

    def _create_charge(self, amount, payment_method_id, description):
        """
        Creates a new charge using Stripe.
        """
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,  # amount is in cents
                currency='usd',
                payment_method=payment_method_id,
                description=description,
                confirm=True,
                automatic_payment_methods={
                    'enabled': True,
                    'allow_redirects': 'never'
                }
            )
            return intent
        except stripe.error.StripeError as e:
            return {'error': str(e)}

    def deposit(self):
        """
        Handles a deposit request.
        """
        data = request.get_json()
        if not data:
            return jsonify({"error": "Not a JSON"}), 400

        required_fields = ['amount', 'payment_method_id', 'user_id']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing data"}), 400

        amount_cents = int(data['amount'] * 100)
        description = f"Deposit for user {data['user_id']}"
        intent = self._create_charge(amount_cents, data['payment_method_id'], description)

        if isinstance(intent, dict) and 'error' in intent:
            return jsonify(intent), 400

        if intent.status == 'succeeded':
            new_payment = StripePayment(
                user_id=data['user_id'],
                amount=data['amount'],
                description=description,
                stripe_charge_id=intent.id
            )
            storage.new(new_payment)
            storage.save()

            account = self.account_controller.get_accounts_by_user_id(data['user_id'])
            if account:
                self.account_controller.update_account_balance(account.account_number, data['amount'])
                self.transaction_controller.create_transaction(
                    account_id=account.id,
                    amount=data['amount'],
                    transaction_type='deposit',
                    description=description
                )
            return jsonify({'status': 'success', 'payment_intent_id': intent.id})
        else:
            return jsonify({'error': 'Payment failed', 'status': intent.status}), 400

    def withdraw(self):
        """
        Handles a withdrawal request.
        """
        data = request.get_json()
        if not data:
            return jsonify({"error": "Not a JSON"}), 400

        required_fields = ['amount', 'payment_method_id', 'user_id']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing data"}), 400

        amount_cents = int(data['amount'] * 100)
        description = f"Withdrawal for user {data['user_id']}"

        # Note: Stripe is used for payments, so "withdrawal" here means the user is paying the service
        # for a cash withdrawal, which is an unusual use case.
        # This logic assumes the user's account balance is being reduced.

        account = self.account_controller.get_accounts_by_user_id(data['user_id'])
        if not account or account.balance < data['amount']:
            return jsonify({"error": "Insufficient funds"}), 400

        intent = self._create_charge(amount_cents, data['payment_method_id'], description)

        if isinstance(intent, dict) and 'error' in intent:
            return jsonify(intent), 400

        if intent.status == 'succeeded':
            new_payment = StripePayment(
                user_id=data['user_id'],
                amount=data['amount'],
                description=description,
                stripe_charge_id=intent.id
            )
            storage.new(new_payment)
            storage.save()

            self.account_controller.update_account_balance(account.account_number, -data['amount'])
            self.transaction_controller.create_transaction(
                account_id=account.id,
                amount=data['amount'],
                transaction_type='withdrawal',
                description=description
            )
            return jsonify({'status': 'success', 'payment_intent_id': intent.id})
        else:
            return jsonify({'error': 'Payment failed', 'status': intent.status}), 400

    def repay_loan(self):
        """
        Handles a loan repayment request.
        """
        data = request.get_json()
        if not data:
            return jsonify({"error": "Not a JSON"}), 400

        required_fields = ['amount', 'payment_method_id', 'user_id', 'loan_id']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing data"}), 400

        loan = storage.get(Loan, data['loan_id'])
        if not loan or loan.user_id != data['user_id']:
            return jsonify({"error": "Loan not found or access denied"}), 404

        amount_cents = int(data['amount'] * 100)
        description = f"Loan repayment for loan {data['loan_id']}"
        intent = self._create_charge(amount_cents, data['payment_method_id'], description)

        if isinstance(intent, dict) and 'error' in intent:
            return jsonify(intent), 400

        if intent.status == 'succeeded':
            new_payment = StripePayment(
                user_id=data['user_id'],
                amount=data['amount'],
                description=description,
                stripe_charge_id=intent.id
            )
            storage.new(new_payment)

            # Update loan and create transaction
            loan.amount -= data['amount']
            storage.save()

            account = self.account_controller.get_accounts_by_user_id(data['user_id'])
            if account:
                self.transaction_controller.create_transaction(
                    account_id=account.id,
                    amount=data['amount'],
                    transaction_type='loan_repayment',
                    description=description
                )

            return jsonify({'status': 'success', 'payment_intent_id': intent.id})
        else:
            return jsonify({'error': 'Payment failed', 'status': intent.status}), 400
