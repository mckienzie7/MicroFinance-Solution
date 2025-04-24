import unittest
import inspect
from BackEnd.models.account import Account
from BackEnd.models.base_model import BaseModel

class TestAccountDocs(unittest.TestCase):
    """Tests to check the documentation and style of the Account class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.account_f = inspect.getmembers(Account, inspect.isfunction)

    def test_account_module_docstring(self):
        """Test for the account.py module docstring"""
        self.assertIsNot(Account.__module__.__doc__, None, "account.py needs a docstring")
        self.assertTrue(len(Account.__module__.__doc__) >= 1, "account.py needs a docstring")

    def test_account_class_docstring(self):
        """Test for the Account class docstring"""
        self.assertIsNot(Account.__doc__, None, "Account class needs a docstring")
        self.assertTrue(len(Account.__doc__) >= 1, "Account class needs a docstring")

    def test_account_func_docstrings(self):
        """Test for the presence of docstrings in Account methods"""
        for func in self.account_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")

class TestAccount(unittest.TestCase):
    """Test the Account class"""

    def setUp(self):
        """Set up a test account instance"""
        self.account = Account(
            customer_id="test_customer_123",
            account_number="ACC123456789",
            type="savings"
        )

    def test_is_subclass(self):
        """Test that Account is a subclass of BaseModel"""
        self.assertIsInstance(self.account, BaseModel)

    def test_customer_id_attr(self):
        """Test that Account has a customer_id attribute"""
        self.assertTrue(hasattr(self.account, "customer_id"))
        self.assertEqual(self.account.customer_id, "test_customer_123")

    def test_account_number_attr(self):
        """Test that Account has an account_number attribute"""
        self.assertTrue(hasattr(self.account, "account_number"))
        self.assertEqual(self.account.account_number, "ACC123456789")

    def test_balance_attr(self):
        """Test that Account has a balance attribute with default value"""
        self.assertTrue(hasattr(self.account, "balance"))
        self.assertEqual(self.account.balance, 0.00)

    def test_type_attr(self):
        """Test that Account has a type attribute"""
        self.assertTrue(hasattr(self.account, "type"))
        self.assertEqual(self.account.type, "savings")

    def test_currency_attr(self):
        """Test that Account has a currency attribute with default value"""
        self.assertTrue(hasattr(self.account, "currency"))
        self.assertEqual(self.account.currency, "USD")

    def test_status_attr(self):
        """Test that Account has a status attribute with default value"""
        self.assertTrue(hasattr(self.account, "status"))
        self.assertEqual(self.account.status, "active")

    def test_overdraft_limit_attr(self):
        """Test that Account has an overdraft_limit attribute with default value"""
        self.assertTrue(hasattr(self.account, "overdraft_limit"))
        self.assertEqual(self.account.overdraft_limit, 0.00)

    def test_relationships(self):
        """Test that Account has the correct relationships"""
        self.assertTrue(hasattr(self.account, "transactions"))
        self.assertTrue(hasattr(self.account, "loans"))
        self.assertTrue(hasattr(self.account, "telebirr"))

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[Account] ({}) {}".format(self.account.id, self.account.__dict__)
        self.assertEqual(str(self.account), expected_str)

    def test_to_dict(self):
        """Test the to_dict method"""
        account_dict = self.account.to_dict()
        
        self.assertIsInstance(account_dict, dict)
        self.assertIn("id", account_dict)
        self.assertIn("customer_id", account_dict)
        self.assertIn("account_number", account_dict)
        self.assertIn("balance", account_dict)
        self.assertIn("type", account_dict)
        self.assertIn("currency", account_dict)
        self.assertIn("status", account_dict)
        self.assertIn("overdraft_limit", account_dict)
        self.assertIn("created_at", account_dict)
        self.assertIn("updated_at", account_dict)
        self.assertIn("__class__", account_dict)
        self.assertEqual(account_dict["__class__"], "Account")

    def test_update_balance(self):
        """Test updating account balance"""
        initial_balance = self.account.balance
        deposit_amount = 100.00
        self.account.balance += deposit_amount
        self.assertEqual(self.account.balance, initial_balance + deposit_amount)

    def test_status_change(self):
        """Test changing account status"""
        self.account.status = "frozen"
        self.assertEqual(self.account.status, "frozen")

    def test_currency_change(self):
        """Test changing account currency"""
        self.account.currency = "EUR"
        self.assertEqual(self.account.currency, "EUR")

    def test_overdraft_limit_change(self):
        """Test changing overdraft limit"""
        self.account.overdraft_limit = 500.00
        self.assertEqual(self.account.overdraft_limit, 500.00)

if __name__ == "__main__":
    unittest.main() 