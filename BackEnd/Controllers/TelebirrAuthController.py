#!/usr/bin/python3
"""
Contains the class Telebirr Authentication Controller
"""
from BackEnd.models import storage
from BackEnd.models.Telebirr import Telebirr
from BackEnd.models.Account import Account
from BackEnd.models.Transaction import Transaction
from sqlalchemy.orm.exc import NoResultFound
import hashlib
import hmac
import json
from datetime import datetime


class TelebirrAuthController:
    """
    Handles authentication and validation for Telebirr payments
    """

    def __init__(self):
        """Initialize TelebirrAuthController"""
        self.db = storage
        self.api_key = "YOUR_TELEBIRR_API_KEY"  # Should be stored in environment variables
        self.api_secret = "YOUR_TELEBIRR_API_SECRET"  # Should be stored in environment variables
        self.merchant_id = "YOUR_MERCHANT_ID"  # Should be stored in environment variables

    def verify_payment_request(self, account_id: str, amount: float, payment_type: str) -> bool:
        """
        Verify if a payment request is valid
        Args:
            account_id: The account ID making the payment
            amount: The payment amount
            payment_type: Type of payment (deposit/withdrawal)
        Returns:
            bool: True if valid, False otherwise
        """
        account = self.db.get(Account, account_id)
        if not account:
            raise NoResultFound("Account not found")

        if payment_type == "withdrawal" and account.balance < amount:
            raise ValueError("Insufficient funds for withdrawal")

        return True

    def generate_payment_signature(self, data: dict) -> str:
        """
        Generate HMAC signature for Telebirr API
        Args:
            data: Payment data to sign
        Returns:
            str: Generated signature
        """
        message = json.dumps(data, sort_keys=True)
        signature = hmac.new(
            self.api_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature

    def verify_payment_response(self, response_data: dict, signature: str) -> bool:
        """
        Verify the authenticity of a payment response
        Args:
            response_data: Response data from Telebirr
            signature: Signature to verify
        Returns:
            bool: True if valid, False otherwise
        """
        expected_signature = self.generate_payment_signature(response_data)
        return hmac.compare_digest(signature, expected_signature)

    def validate_payment_status(self, payment_id: str) -> str:
        """
        Validate the status of a payment
        Args:
            payment_id: The Telebirr payment ID
        Returns:
            str: Payment status
        """
        payment = self.db.get(Telebirr, payment_id)
        if not payment:
            raise NoResultFound("Payment not found")

        return payment.status

    def check_duplicate_payment(self, transaction_id: str) -> bool:
        """
        Check for duplicate payment attempts
        Args:
            transaction_id: The transaction ID to check
        Returns:
            bool: True if duplicate exists, False otherwise
        """
        try:
            payment = self.db.get_by_transaction_id(Telebirr, transaction_id)
            return payment is not None
        except NoResultFound:
            return False 