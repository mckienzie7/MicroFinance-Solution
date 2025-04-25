#!/usr/bin/python3
"""
Contains the class OTP Controller
"""
from BackEnd.models import storage
from BackEnd.models.OTP import OTP
from BackEnd.models.Account import Account
from sqlalchemy.orm.exc import NoResultFound
import random
import string
from datetime import datetime, timedelta
import pytz


class OTPController:
    """
    Handles OTP generation, validation, and management
    """

    def __init__(self):
        """Initialize OTPController"""
        self.db = storage
        self.otp_length = 6
        self.otp_expiry_minutes = 5

    def generate_otp(self, account_id: str, purpose: str) -> OTP:
        """
        Generate a new OTP for an account
        Args:
            account_id: The account ID
            purpose: Purpose of the OTP (e.g., 'login', 'transaction')
        Returns:
            OTP: The generated OTP object
        """
        # Check if account exists
        account = self.db.get(Account, account_id)
        if not account:
            raise NoResultFound("Account not found")

        # Generate random OTP
        otp_code = ''.join(random.choices(string.digits, k=self.otp_length))
        
        # Calculate expiry time
        expiry_time = datetime.now(pytz.UTC) + timedelta(minutes=self.otp_expiry_minutes)

        # Create OTP record
        otp = OTP(
            account_id=account_id,
            code=otp_code,
            purpose=purpose,
            expiry_time=expiry_time
        )
        
        self.db.new(otp)
        self.db.save()
        
        return otp

    def validate_otp(self, account_id: str, otp_code: str, purpose: str) -> bool:
        """
        Validate an OTP
        Args:
            account_id: The account ID
            otp_code: The OTP code to validate
            purpose: Purpose of the OTP
        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Get the most recent OTP for the account and purpose
            otp = self.db.get_latest_otp(account_id, purpose)
            if not otp:
                return False

            # Check if OTP is expired
            if datetime.now(pytz.UTC) > otp.expiry_time:
                return False

            # Check if OTP code matches
            if otp.code != otp_code:
                return False

            # Mark OTP as used
            otp.used = True
            self.db.save()
            
            return True
        except NoResultFound:
            return False

    def get_otp_status(self, account_id: str, purpose: str) -> dict:
        """
        Get the status of the latest OTP for an account
        Args:
            account_id: The account ID
            purpose: Purpose of the OTP
        Returns:
            dict: OTP status information
        """
        try:
            otp = self.db.get_latest_otp(account_id, purpose)
            if not otp:
                return {"status": "no_otp"}

            current_time = datetime.now(pytz.UTC)
            if current_time > otp.expiry_time:
                return {"status": "expired"}
            elif otp.used:
                return {"status": "used"}
            else:
                return {
                    "status": "active",
                    "expires_in": (otp.expiry_time - current_time).total_seconds()
                }
        except NoResultFound:
            return {"status": "no_otp"}

    def resend_otp(self, account_id: str, purpose: str) -> OTP:
        """
        Resend OTP for an account
        Args:
            account_id: The account ID
            purpose: Purpose of the OTP
        Returns:
            OTP: The new OTP object
        """
        # Invalidate any existing OTPs
        self.invalidate_otps(account_id, purpose)
        
        # Generate new OTP
        return self.generate_otp(account_id, purpose)

    def invalidate_otps(self, account_id: str, purpose: str) -> None:
        """
        Invalidate all active OTPs for an account
        Args:
            account_id: The account ID
            purpose: Purpose of the OTP
        """
        try:
            otps = self.db.get_active_otps(account_id, purpose)
            for otp in otps:
                otp.used = True
            self.db.save()
        except NoResultFound:
            pass 