import unittest
import inspect
from datetime import datetime, timedelta
from BackEnd.models.otp import OTP
from BackEnd.models.base_model import BaseModel

class TestOTPDocs(unittest.TestCase):
    """Tests to check the documentation and style of the OTP class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.otp_f = inspect.getmembers(OTP, inspect.isfunction)

    def test_otp_module_docstring(self):
        """Test for the otp.py module docstring"""
        self.assertIsNot(OTP.__module__.__doc__, None, "otp.py needs a docstring")
        self.assertTrue(len(OTP.__module__.__doc__) >= 1, "otp.py needs a docstring")

    def test_otp_class_docstring(self):
        """Test for the OTP class docstring"""
        self.assertIsNot(OTP.__doc__, None, "OTP class needs a docstring")
        self.assertTrue(len(OTP.__doc__) >= 1, "OTP class needs a docstring")

    def test_otp_func_docstrings(self):
        """Test for the presence of docstrings in OTP methods"""
        for func in self.otp_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")

class TestOTP(unittest.TestCase):
    """Test the OTP class"""

    def setUp(self):
        """Set up a test OTP instance"""
        self.otp = OTP(
            user_id="user123",
            otp_code="123456"
        )

    def test_is_subclass(self):
        """Test that OTP is a subclass of BaseModel"""
        self.assertIsInstance(self.otp, BaseModel)

    def test_user_id_attr(self):
        """Test that OTP has a user_id attribute"""
        self.assertTrue(hasattr(self.otp, "user_id"))
        self.assertEqual(self.otp.user_id, "user123")

    def test_otp_code_attr(self):
        """Test that OTP has an otp_code attribute"""
        self.assertTrue(hasattr(self.otp, "otp_code"))
        self.assertEqual(self.otp.otp_code, "123456")

    def test_expires_at_attr(self):
        """Test that OTP has an expires_at attribute"""
        self.assertTrue(hasattr(self.otp, "expires_at"))
        self.assertIsInstance(self.otp.expires_at, datetime)
        # Check if expires_at is set to 5 minutes from now
        expected_expiry = datetime.utcnow() + timedelta(minutes=5)
        self.assertAlmostEqual(
            self.otp.expires_at.timestamp(),
            expected_expiry.timestamp(),
            delta=1  # Allow 1 second difference
        )

    def test_is_verified_attr(self):
        """Test that OTP has an is_verified attribute with default value"""
        self.assertTrue(hasattr(self.otp, "is_verified"))
        self.assertFalse(self.otp.is_verified)

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[OTP] ({}) {}".format(self.otp.id, self.otp.__dict__)
        self.assertEqual(str(self.otp), expected_str)

    def test_to_dict(self):
        """Test the to_dict method"""
        otp_dict = self.otp.to_dict()
        
        self.assertIsInstance(otp_dict, dict)
        self.assertIn("id", otp_dict)
        self.assertIn("user_id", otp_dict)
        self.assertIn("otp_code", otp_dict)
        self.assertIn("expires_at", otp_dict)
        self.assertIn("is_verified", otp_dict)
        self.assertIn("created_at", otp_dict)
        self.assertIn("updated_at", otp_dict)
        self.assertIn("__class__", otp_dict)
        self.assertEqual(otp_dict["__class__"], "OTP")

    def test_verify_otp(self):
        """Test verifying OTP"""
        self.otp.is_verified = True
        self.assertTrue(self.otp.is_verified)

    def test_otp_expiry(self):
        """Test OTP expiry"""
        # Set expiry to 1 minute ago
        self.otp.expires_at = datetime.utcnow() - timedelta(minutes=1)
        self.assertTrue(self.otp.expires_at < datetime.utcnow())

    def test_otp_code_length(self):
        """Test that OTP code is 6 digits"""
        self.assertEqual(len(self.otp.otp_code), 6)
        self.assertTrue(self.otp.otp_code.isdigit())

    def test_otp_code_update(self):
        """Test updating OTP code"""
        new_code = "654321"
        self.otp.otp_code = new_code
        self.assertEqual(self.otp.otp_code, new_code)

if __name__ == "__main__":
    unittest.main() 