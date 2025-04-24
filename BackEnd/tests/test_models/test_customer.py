import unittest
import inspect
from BackEnd.models.customer import Customer
from BackEnd.models.user import User
from BackEnd.models.base_model import BaseModel

class TestCustomerDocs(unittest.TestCase):
    """Tests to check the documentation and style of the Customer class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.customer_f = inspect.getmembers(Customer, inspect.isfunction)

    def test_customer_module_docstring(self):
        """Test for the customer.py module docstring"""
        self.assertIsNot(Customer.__module__.__doc__, None, "customer.py needs a docstring")
        self.assertTrue(len(Customer.__module__.__doc__) >= 1, "customer.py needs a docstring")

    def test_customer_class_docstring(self):
        """Test for the Customer class docstring"""
        self.assertIsNot(Customer.__doc__, None, "Customer class needs a docstring")
        self.assertTrue(len(Customer.__doc__) >= 1, "Customer class needs a docstring")

    def test_customer_func_docstrings(self):
        """Test for the presence of docstrings in Customer methods"""
        for func in self.customer_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")

class TestCustomer(unittest.TestCase):
    """Test the Customer class"""

    def setUp(self):
        """Set up a test customer instance"""
        self.customer = Customer(
            username="testcustomer",
            email="customer@example.com",
            password="password123"
        )

    def test_is_subclass(self):
        """Test that Customer is a subclass of User and BaseModel"""
        self.assertIsInstance(self.customer, User)
        self.assertIsInstance(self.customer, BaseModel)

    def test_id_attr(self):
        """Test that Customer has an id attribute"""
        self.assertTrue(hasattr(self.customer, "id"))
        self.assertIsInstance(self.customer.id, str)
        self.assertTrue(len(self.customer.id) > 0)

    def test_username_attr(self):
        """Test that Customer has a username attribute"""
        self.assertTrue(hasattr(self.customer, "username"))
        self.assertEqual(self.customer.username, "testcustomer")

    def test_email_attr(self):
        """Test that Customer has an email attribute"""
        self.assertTrue(hasattr(self.customer, "email"))
        self.assertEqual(self.customer.email, "customer@example.com")

    def test_password_attr(self):
        """Test that Customer has a password attribute"""
        self.assertTrue(hasattr(self.customer, "password"))
        self.assertNotEqual(self.customer.password, "password123")  # Should be hashed

    def test_account_relationship(self):
        """Test that Customer has the account relationship"""
        self.assertTrue(hasattr(self.customer, "account"))

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[Customer] ({}) {}".format(self.customer.id, self.customer.__dict__)
        self.assertEqual(str(self.customer), expected_str)

    def test_to_dict(self):
        """Test the to_dict method"""
        customer_dict = self.customer.to_dict()
        
        self.assertIsInstance(customer_dict, dict)
        self.assertIn("id", customer_dict)
        self.assertIn("username", customer_dict)
        self.assertIn("email", customer_dict)
        self.assertIn("created_at", customer_dict)
        self.assertIn("updated_at", customer_dict)
        self.assertIn("__class__", customer_dict)
        self.assertEqual(customer_dict["__class__"], "Customer")

    def test_password_hashing(self):
        """Test that password is properly hashed"""
        self.customer.set_password("newpassword123")
        self.assertTrue(self.customer.check_password("newpassword123"))
        self.assertFalse(self.customer.check_password("wrongpassword"))

    def test_account_creation(self):
        """Test that a customer can have an account"""
        from BackEnd.models.account import Account
        account = Account(
            customer_id=self.customer.id,
            account_number="ACC123456789",
            type="savings"
        )
        self.customer.account = account
        self.assertEqual(self.customer.account, account)

if __name__ == "__main__":
    unittest.main() 