import unittest
import inspect
from datetime import datetime
from BackEnd.models.telebirr import Telebirr
from BackEnd.models.base_model import BaseModel

class TestTelebirrDocs(unittest.TestCase):
    """Tests to check the documentation and style of the Telebirr class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.telebirr_f = inspect.getmembers(Telebirr, inspect.isfunction)

    def test_telebirr_module_docstring(self):
        """Test for the telebirr.py module docstring"""
        self.assertIsNot(Telebirr.__module__.__doc__, None, "telebirr.py needs a docstring")
        self.assertTrue(len(Telebirr.__module__.__doc__) >= 1, "telebirr.py needs a docstring")

    def test_telebirr_class_docstring(self):
        """Test for the Telebirr class docstring"""
        self.assertIsNot(Telebirr.__doc__, None, "Telebirr class needs a docstring")
        self.assertTrue(len(Telebirr.__doc__) >= 1, "Telebirr class needs a docstring")

    def test_telebirr_func_docstrings(self):
        """Test for the presence of docstrings in Telebirr methods"""
        for func in self.telebirr_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")

class TestTelebirr(unittest.TestCase):
    """Test the Telebirr class"""

    def setUp(self):
        """Set up a test telebirr instance"""
        self.telebirr = Telebirr(
            user_id="user123",
            account_id="acc123",
            transaction_id="TXN123456789",
            amount=100.00,
            payment_type="deposit"
        )

    def test_is_subclass(self):
        """Test that Telebirr is a subclass of BaseModel"""
        self.assertIsInstance(self.telebirr, BaseModel)

    def test_user_id_attr(self):
        """Test that Telebirr has a user_id attribute"""
        self.assertTrue(hasattr(self.telebirr, "user_id"))
        self.assertEqual(self.telebirr.user_id, "user123")

    def test_account_id_attr(self):
        """Test that Telebirr has an account_id attribute"""
        self.assertTrue(hasattr(self.telebirr, "account_id"))
        self.assertEqual(self.telebirr.account_id, "acc123")

    def test_transaction_id_attr(self):
        """Test that Telebirr has a transaction_id attribute"""
        self.assertTrue(hasattr(self.telebirr, "transaction_id"))
        self.assertEqual(self.telebirr.transaction_id, "TXN123456789")

    def test_amount_attr(self):
        """Test that Telebirr has an amount attribute"""
        self.assertTrue(hasattr(self.telebirr, "amount"))
        self.assertEqual(self.telebirr.amount, 100.00)

    def test_status_attr(self):
        """Test that Telebirr has a status attribute with default value"""
        self.assertTrue(hasattr(self.telebirr, "status"))
        self.assertEqual(self.telebirr.status, "pending")

    def test_payment_type_attr(self):
        """Test that Telebirr has a payment_type attribute"""
        self.assertTrue(hasattr(self.telebirr, "payment_type"))
        self.assertEqual(self.telebirr.payment_type, "deposit")

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[Telebirr] ({}) {}".format(self.telebirr.id, self.telebirr.__dict__)
        self.assertEqual(str(self.telebirr), expected_str)

    def test_to_dict(self):
        """Test the to_dict method"""
        telebirr_dict = self.telebirr.to_dict()
        
        self.assertIsInstance(telebirr_dict, dict)
        self.assertIn("id", telebirr_dict)
        self.assertIn("user_id", telebirr_dict)
        self.assertIn("account_id", telebirr_dict)
        self.assertIn("transaction_id", telebirr_dict)
        self.assertIn("amount", telebirr_dict)
        self.assertIn("status", telebirr_dict)
        self.assertIn("payment_type", telebirr_dict)
        self.assertIn("created_at", telebirr_dict)
        self.assertIn("updated_at", telebirr_dict)
        self.assertIn("__class__", telebirr_dict)
        self.assertEqual(telebirr_dict["__class__"], "Telebirr")

    def test_status_change(self):
        """Test changing transaction status"""
        self.telebirr.status = "completed"
        self.assertEqual(self.telebirr.status, "completed")

    def test_payment_type_change(self):
        """Test changing payment type"""
        self.telebirr.payment_type = "withdrawal"
        self.assertEqual(self.telebirr.payment_type, "withdrawal")

    def test_amount_update(self):
        """Test updating transaction amount"""
        new_amount = 200.00
        self.telebirr.amount = new_amount
        self.assertEqual(self.telebirr.amount, new_amount)

    def test_transaction_id_uniqueness(self):
        """Test that transaction_id is unique"""
        with self.assertRaises(Exception):
            Telebirr(
                user_id="user123",
                account_id="acc123",
                transaction_id="TXN123456789",  # Same as existing
                amount=100.00,
                payment_type="deposit"
            )

if __name__ == "__main__":
    unittest.main() 