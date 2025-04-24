import unittest
import inspect
from datetime import datetime
from BackEnd.models.transaction import Transaction
from BackEnd.models.base_model import BaseModel

class TestTransactionDocs(unittest.TestCase):
    """Tests to check the documentation and style of the Transaction class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.transaction_f = inspect.getmembers(Transaction, inspect.isfunction)

    def test_transaction_module_docstring(self):
        """Test for the transaction.py module docstring"""
        self.assertIsNot(Transaction.__module__.__doc__, None, "transaction.py needs a docstring")
        self.assertTrue(len(Transaction.__module__.__doc__) >= 1, "transaction.py needs a docstring")

    def test_transaction_class_docstring(self):
        """Test for the Transaction class docstring"""
        self.assertIsNot(Transaction.__doc__, None, "Transaction class needs a docstring")
        self.assertTrue(len(Transaction.__doc__) >= 1, "Transaction class needs a docstring")

    def test_transaction_func_docstrings(self):
        """Test for the presence of docstrings in Transaction methods"""
        for func in self.transaction_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")

class TestTransaction(unittest.TestCase):
    """Test the Transaction class"""

    def setUp(self):
        """Set up a test transaction instance"""
        self.transaction = Transaction(
            account_id="acc123",
            amount=100.00,
            transaction_type="deposit",
            description="Initial deposit"
        )

    def test_is_subclass(self):
        """Test that Transaction is a subclass of BaseModel"""
        self.assertIsInstance(self.transaction, BaseModel)

    def test_account_id_attr(self):
        """Test that Transaction has an account_id attribute"""
        self.assertTrue(hasattr(self.transaction, "account_id"))
        self.assertEqual(self.transaction.account_id, "acc123")

    def test_amount_attr(self):
        """Test that Transaction has an amount attribute"""
        self.assertTrue(hasattr(self.transaction, "amount"))
        self.assertEqual(self.transaction.amount, 100.00)

    def test_transaction_type_attr(self):
        """Test that Transaction has a transaction_type attribute"""
        self.assertTrue(hasattr(self.transaction, "transaction_type"))
        self.assertEqual(self.transaction.transaction_type, "deposit")

    def test_description_attr(self):
        """Test that Transaction has a description attribute"""
        self.assertTrue(hasattr(self.transaction, "description"))
        self.assertEqual(self.transaction.description, "Initial deposit")

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[Transaction] ({}) {}".format(self.transaction.id, self.transaction.__dict__)
        self.assertEqual(str(self.transaction), expected_str)

    def test_to_dict(self):
        """Test the to_dict method"""
        transaction_dict = self.transaction.to_dict()
        
        self.assertIsInstance(transaction_dict, dict)
        self.assertIn("id", transaction_dict)
        self.assertIn("account_id", transaction_dict)
        self.assertIn("amount", transaction_dict)
        self.assertIn("transaction_type", transaction_dict)
        self.assertIn("description", transaction_dict)
        self.assertIn("created_at", transaction_dict)
        self.assertIn("updated_at", transaction_dict)
        self.assertIn("__class__", transaction_dict)
        self.assertEqual(transaction_dict["__class__"], "Transaction")

    def test_transaction_type_change(self):
        """Test changing transaction type"""
        self.transaction.transaction_type = "withdrawal"
        self.assertEqual(self.transaction.transaction_type, "withdrawal")

    def test_description_update(self):
        """Test updating transaction description"""
        new_description = "Monthly withdrawal"
        self.transaction.description = new_description
        self.assertEqual(self.transaction.description, new_description)

    def test_amount_update(self):
        """Test updating transaction amount"""
        new_amount = 200.00
        self.transaction.amount = new_amount
        self.assertEqual(self.transaction.amount, new_amount)

if __name__ == "__main__":
    unittest.main() 