#!/usr/bin/python3
"""
Contains the class Telebirr Controller
"""
from BackEnd.models import storage
from BackEnd.models.Telebirr import Telebirr
from BackEnd.models.Account import Account
from BackEnd.models.Transaction import Transaction
from BackEnd.Controllers.TelebirrAuthController import TelebirrAuthController
from sqlalchemy.orm.exc import NoResultFound
import requests
import json
from datetime import datetime
from typing import Tuple


class TelebirrController:
    """
    Handles Telebirr payment operations
    """

    def __init__(self):
        """Initialize TelebirrController"""
        self.db = storage
        self.auth = TelebirrAuthController()
        self.base_url = "https://api.telebirr.com/v1"  # Replace with actual Telebirr API URL

    def initiate_payment(self, account_id: str, amount: float, payment_type: str) -> Tuple[Telebirr, dict]:
        """
        Initiate a payment through Telebirr
        Args:
            account_id: The account ID making the payment
            amount: The payment amount
            payment_type: Type of payment (deposit/withdrawal)
        Returns:
            Tuple of (Telebirr payment record, payment initiation response)
        """
        # Validate payment request
        self.auth.verify_payment_request(account_id, amount, payment_type)

        # Generate unique transaction ID
        transaction_id = f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Check for duplicate payment
        if self.auth.check_duplicate_payment(transaction_id):
            raise ValueError("Duplicate payment attempt detected")

        # Prepare payment data
        payment_data = {
            "merchant_id": self.auth.merchant_id,
            "transaction_id": transaction_id,
            "amount": amount,
            "payment_type": payment_type,
            "timestamp": datetime.now().isoformat()
        }

        # Generate signature
        signature = self.auth.generate_payment_signature(payment_data)

        # Add signature to headers
        headers = {
            "Authorization": f"Bearer {self.auth.api_key}",
            "X-Signature": signature,
            "Content-Type": "application/json"
        }

        # Make API request to Telebirr
        try:
            response = requests.post(
                f"{self.base_url}/payments/initiate",
                headers=headers,
                json=payment_data
            )
            response.raise_for_status()
            payment_response = response.json()

            # Create Telebirr payment record
            payment = Telebirr(
                account_id=account_id,
                transaction_id=transaction_id,
                amount=amount,
                status="pending",
                payment_type=payment_type,
                payment_response=json.dumps(payment_response)
            )
            self.db.new(payment)
            self.db.save()

            return payment, payment_response

        except requests.exceptions.RequestException as e:
            raise ValueError(f"Payment initiation failed: {str(e)}")

    def process_payment_callback(self, callback_data: dict, signature: str) -> Tuple[Telebirr, Transaction]:
        """
        Process payment callback from Telebirr
        Args:
            callback_data: Callback data from Telebirr
            signature: Signature to verify callback authenticity
        Returns:
            Tuple of (Telebirr payment record, created transaction)
        """
        # Verify callback signature
        if not self.auth.verify_payment_response(callback_data, signature):
            raise ValueError("Invalid callback signature")

        # Get payment record
        payment = self.db.get_by_transaction_id(Telebirr, callback_data["transaction_id"])
        if not payment:
            raise NoResultFound("Payment record not found")

        # Update payment status
        payment.status = callback_data["status"]
        payment.payment_response = json.dumps(callback_data)

        # If payment successful, create transaction
        if callback_data["status"] == "completed":
            account = self.db.get(Account, payment.account_id)
            if not account:
                raise NoResultFound("Account not found")

            # Create transaction
            transaction = Transaction(
                account_id=payment.account_id,
                amount=payment.amount if payment.payment_type == "deposit" else -payment.amount,
                transaction_type=f"telebirr_{payment.payment_type}",
                description=f"Telebirr {payment.payment_type} - {payment.transaction_id}"
            )
            self.db.new(transaction)

            # Update account balance
            if payment.payment_type == "deposit":
                account.balance += payment.amount
            else:  # withdrawal
                account.balance -= payment.amount

            self.db.save()
            return payment, transaction

        self.db.save()
        return payment, None

    def check_payment_status(self, payment_id: str) -> dict:
        """
        Check the status of a payment
        Args:
            payment_id: The Telebirr payment ID
        Returns:
            dict: Payment status information
        """
        payment = self.db.get(Telebirr, payment_id)
        if not payment:
            raise NoResultFound("Payment not found")

        # Prepare request data
        request_data = {
            "merchant_id": self.auth.merchant_id,
            "payment_id": payment_id,
            "timestamp": datetime.now().isoformat()
        }

        # Generate signature
        signature = self.auth.generate_payment_signature(request_data)

        # Add signature to headers
        headers = {
            "Authorization": f"Bearer {self.auth.api_key}",
            "X-Signature": signature,
            "Content-Type": "application/json"
        }

        try:
            response = requests.get(
                f"{self.base_url}/payments/{payment_id}",
                headers=headers
            )
            response.raise_for_status()
            status_data = response.json()

            # Update payment status if changed
            if status_data["status"] != payment.status:
                payment.status = status_data["status"]
                payment.payment_response = json.dumps(status_data)
                self.db.save()

            return status_data

        except requests.exceptions.RequestException as e:
            raise ValueError(f"Failed to check payment status: {str(e)}")

    def get_payment_history(self, account_id: str) -> list:
        """
        Get payment history for an account
        Args:
            account_id: The account ID
        Returns:
            list: List of payment records
        """
        return self.db.get_all_by_account_id(Telebirr, account_id) 