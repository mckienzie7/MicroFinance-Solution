import unittest
import inspect
from BackEnd.models.repayment import Repayment
from BackEnd.models.base_model import BaseModel

class TestRepaymentDocs(unittest.TestCase):
    """Tests to check the documentation and style of the Repayment class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.repayment_f = inspect.getmembers(Repayment, inspect.isfunction)

    def test_repayment_module_docstring(self):
        """Test for the repayment.py module docstring"""
        self.assertIsNot(Repayment.__module__.__doc__, None, "repayment.py needs a docstring")
        self.assertTrue(len(Repayment.__module__.__doc__) >= 1, "repayment.py needs a docstring")

    def test_repayment_class_docstring(self):
        """Test for the Repayment class docstring"""
        self.assertIsNot(Repayment.__doc__, None, "Repayment class needs a docstring")
        self.assertTrue(len(Repayment.__doc__) >= 1, "Repayment class needs a docstring")

    def test_repayment_func_docstrings(self):
        """Test for the presence of docstrings in Repayment methods"""
        for func in self.repayment_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")

class TestRepayment(unittest.TestCase):
    """Test the Repayment class"""

    def setUp(self):
        """Set up a test repayment instance"""
        self.repayment = Repayment(
            loan_id="loan123",
            amount=100.00
        )

    def test_is_subclass(self):
        """Test that Repayment is a subclass of BaseModel"""
        self.assertIsInstance(self.repayment, BaseModel)

    def test_loan_id_attr(self):
        """Test that Repayment has a loan_id attribute"""
        self.assertTrue(hasattr(self.repayment, "loan_id"))
        self.assertEqual(self.repayment.loan_id, "loan123")

    def test_amount_attr(self):
        """Test that Repayment has an amount attribute"""
        self.assertTrue(hasattr(self.repayment, "amount"))
        self.assertEqual(self.repayment.amount, 100.00)

    def test_status_attr(self):
        """Test that Repayment has a status attribute with default value"""
        self.assertTrue(hasattr(self.repayment, "status"))
        self.assertEqual(self.repayment.status, "pending")

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[Repayment] ({}) {}".format(self.repayment.id, self.repayment.__dict__)
        self.assertEqual(str(self.repayment), expected_str)

    def test_to_dict(self):
        """Test the to_dict method"""
        repayment_dict = self.repayment.to_dict()
        
        self.assertIsInstance(repayment_dict, dict)
        self.assertIn("id", repayment_dict)
        self.assertIn("loan_id", repayment_dict)
        self.assertIn("amount", repayment_dict)
        self.assertIn("status", repayment_dict)
        self.assertIn("created_at", repayment_dict)
        self.assertIn("updated_at", repayment_dict)
        self.assertIn("__class__", repayment_dict)
        self.assertEqual(repayment_dict["__class__"], "Repayment")

    def test_status_change(self):
        """Test changing repayment status"""
        self.repayment.status = "completed"
        self.assertEqual(self.repayment.status, "completed")

    def test_amount_update(self):
        """Test updating repayment amount"""
        new_amount = 150.00
        self.repayment.amount = new_amount
        self.assertEqual(self.repayment.amount, new_amount)

if __name__ == "__main__":
    unittest.main() 