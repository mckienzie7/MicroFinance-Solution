import stripe
from flask import request, jsonify
from BackEnd.models import storage
from BackEnd.models.Stripe import StripePayment
from BackEnd.models.user import User
from os import getenv
from BackEnd.Controllers.AccountController import AccountController
from BackEnd.Controllers.TransactionController import TransactionController
from BackEnd.Controllers.NotificationController import NotificationController
from BackEnd.models.Loan import Loan

stripe.api_key = getenv('STRIPE_SECRET_KEY')

class StripeController:
    """
    Handles Stripe payment processing for deposits, withdrawals, and loan repayments.
    """
    def __init__(self):
        self.account_controller = AccountController()
        self.transaction_controller = TransactionController()
        self.notification_controller = NotificationController()

    def _create_charge(self, amount, payment_method_id, description):
        """
        Creates a new charge using Stripe.
        """
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,  # amount in cents for USD
                currency='usd',  # Use USD for Stripe processing (ETB not fully supported)
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

        # Use the exact amount submitted by user (treat as USD cents for Stripe)
        amount_for_stripe = int(data['amount'])  # Use amount directly as cents
        description = f"Deposit for user {data['user_id']}"
        intent = self._create_charge(amount_for_stripe, data['payment_method_id'], description)

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

            account = self.account_controller.get_accounts_by_id(data['user_id'])
            if account:
                self.transaction_controller.deposit(
                    account_id=account.id,
                    amount=data['amount'],
                    description=description
                )
                # Create success notification
                self.notification_controller.notify_deposit(
                    user_id=data['user_id'],
                    amount=data['amount'],
                    account_number=account.account_number
                )
            
            return jsonify({'status': 'success', 'payment_intent_id': intent.id})
        else:
            # Create failure notification
            self.notification_controller.notify_payment_failure(
                user_id=data['user_id'],
                amount=data['amount'],
                payment_type='deposit',
                reason=intent.status
            )
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

        account = self.account_controller.get_accounts_by_id(data['user_id'])
        if not account:
            return jsonify({"error": "Account not found"}), 404

        if account.balance < data['amount']:
            return jsonify({"error": "Insufficient funds"}), 400

        # Use the exact amount submitted by user (treat as USD cents for Stripe)
        amount_for_stripe = int(data['amount'])  # Use amount directly as cents
        description = f"Withdrawal for user {data['user_id']}"

        # For withdrawals, we might need a payout to the user's bank account.
        # This example assumes a charge, which might not be the correct Stripe flow
        # for paying out to users. This should be reviewed for production.
        intent = self._create_charge(amount_for_stripe, data['payment_method_id'], description)

        if isinstance(intent, dict) and 'error' in intent:
            return jsonify(intent), 400

        if intent.status == 'succeeded':
            new_payment = StripePayment(
                user_id=data['user_id'],
                amount=-data['amount'],  # Negative amount for withdrawal
                description=description,
                stripe_charge_id=intent.id
            )
            storage.new(new_payment)
            storage.save()

            self.transaction_controller.withdraw(
                account_id=account.id,
                amount=data['amount'],
                description=description
            )
            
            # Create success notification
            self.notification_controller.notify_withdrawal(
                user_id=data['user_id'],
                amount=data['amount'],
                account_number=account.account_number
            )
            
            return jsonify({'status': 'success', 'payment_intent_id': intent.id})
        else:
            # Create failure notification
            self.notification_controller.notify_payment_failure(
                user_id=data['user_id'],
                amount=data['amount'],
                payment_type='withdrawal',
                reason=intent.status
            )
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
        if not loan:
            return jsonify({"error": "Loan not found"}), 404
        
        # Get the account to verify ownership
        account = self.account_controller.get_accounts_by_id(data['user_id'])
        if not account or loan.account_id != account.id:
            return jsonify({"error": "Loan not found or access denied"}), 404

        # Use the exact amount submitted by user (treat as USD cents for Stripe)
        amount_for_stripe = int(data['amount'])  # Use amount directly as cents
        description = f"Loan repayment for loan {data['loan_id']}"
        intent = self._create_charge(amount_for_stripe, data['payment_method_id'], description)

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

            # Create transaction record (account was already retrieved above)
            self.transaction_controller.create_transaction(
                account_id=account.id,
                amount=data['amount'],
                transaction_type='loan_repayment',
                description=description
            )

            # Create success notification
            self.notification_controller.notify_loan_repayment(
                user_id=data['user_id'],
                amount=data['amount'],
                loan_id=data['loan_id']
            )

            return jsonify({'status': 'success', 'payment_intent_id': intent.id})
        else:
            # Create failure notification
            self.notification_controller.notify_payment_failure(
                user_id=data['user_id'],
                amount=data['amount'],
                payment_type='loan repayment',
                reason=intent.status
            )
            return jsonify({'error': 'Payment failed', 'status': intent.status}), 400
