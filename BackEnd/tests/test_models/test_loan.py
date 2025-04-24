import unittest
import inspect
from datetime import datetime
from BackEnd.models.Loan import Loan
from BackEnd.models.base_model import BaseModel

class TestLoanDocs(unittest.TestCase):
    """Tests to check the documentation and style of the Loan class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.loan_f = inspect.getmembers(Loan, inspect.isfunction)

    def test_loan_module_docstring(self):
        """Test for the loan.py module docstring"""
        self.assertIsNot(Loan.__module__.__doc__, None, "loan.py needs a docstring")
        self.assertTrue(len(Loan.__module__.__doc__) >= 1, "loan.py needs a docstring")

    def test_loan_class_docstring(self):
        """Test for the Loan class docstring"""
        self.assertIsNot(Loan.__doc__, None, "Loan class needs a docstring")
        self.assertTrue(len(Loan.__doc__) >= 1, "Loan class needs a docstring")

    def test_loan_func_docstrings(self):
        """Test for the presence of docstrings in Loan methods"""
        for func in self.loan_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")

class TestLoan(unittest.TestCase):
    """Test the Loan class"""

    def setUp(self):
        """Set up a test loan instance"""
        self.loan = Loan(
            admin_id="admin123",
            account_id="acc123",
            amount=1000.00,
            interest_rate=5.0,
            repayment_period=12
        )

    def test_is_subclass(self):
        """Test that Loan is a subclass of BaseModel"""
        self.assertIsInstance(self.loan, BaseModel)

    def test_admin_id_attr(self):
        """Test that Loan has an admin_id attribute"""
        self.assertTrue(hasattr(self.loan, "admin_id"))
        self.assertEqual(self.loan.admin_id, "admin123")

    def test_account_id_attr(self):
        """Test that Loan has an account_id attribute"""
        self.assertTrue(hasattr(self.loan, "account_id"))
        self.assertEqual(self.loan.account_id, "acc123")

    def test_amount_attr(self):
        """Test that Loan has an amount attribute"""
        self.assertTrue(hasattr(self.loan, "amount"))
        self.assertEqual(self.loan.amount, 1000.00)

    def test_interest_rate_attr(self):
        """Test that Loan has an interest_rate attribute"""
        self.assertTrue(hasattr(self.loan, "interest_rate"))
        self.assertEqual(self.loan.interest_rate, 5.0)

    def test_loan_status_attr(self):
        """Test that Loan has a loan_status attribute with default value"""
        self.assertTrue(hasattr(self.loan, "loan_status"))
        self.assertEqual(self.loan.loan_status, "pending")

    def test_repayment_period_attr(self):
        """Test that Loan has a repayment_period attribute"""
        self.assertTrue(hasattr(self.loan, "repayment_period"))
        self.assertEqual(self.loan.repayment_period, 12)

    def test_start_date_attr(self):
        """Test that Loan has a start_date attribute"""
        self.assertTrue(hasattr(self.loan, "start_date"))
        self.assertIsInstance(self.loan.start_date, datetime)

    def test_end_date_attr(self):
        """Test that Loan has an end_date attribute"""
        self.assertTrue(hasattr(self.loan, "end_date"))
        self.assertIsNone(self.loan.end_date)

    def test_repayments_relationship(self):
        """Test that Loan has the repayments relationship"""
        self.assertTrue(hasattr(self.loan, "repayments"))

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[Loan] ({}) {}".format(self.loan.id, self.loan.__dict__)
        self.assertEqual(str(self.loan), expected_str)

    def test_to_dict(self):
        """Test the to_dict method"""
        loan_dict = self.loan.to_dict()
        
        self.assertIsInstance(loan_dict, dict)
        self.assertIn("id", loan_dict)
        self.assertIn("admin_id", loan_dict)
        self.assertIn("account_id", loan_dict)
        self.assertIn("amount", loan_dict)
        self.assertIn("interest_rate", loan_dict)
        self.assertIn("loan_status", loan_dict)
        self.assertIn("repayment_period", loan_dict)
        self.assertIn("start_date", loan_dict)
        self.assertIn("end_date", loan_dict)
        self.assertIn("created_at", loan_dict)
        self.assertIn("updated_at", loan_dict)
        self.assertIn("__class__", loan_dict)
        self.assertEqual(loan_dict["__class__"], "Loan")

    def test_loan_status_change(self):
        """Test changing loan status"""
        self.loan.loan_status = "approved"
        self.assertEqual(self.loan.loan_status, "approved")

    def test_set_end_date(self):
        """Test setting loan end date"""
        end_date = datetime.now()
        self.loan.end_date = end_date
        self.assertEqual(self.loan.end_date, end_date)

    def test_interest_calculation(self):
        """Test basic interest calculation"""
        principal = self.loan.amount
        rate = self.loan.interest_rate / 100
        period = self.loan.repayment_period
        expected_interest = principal * rate * period
        self.assertEqual(expected_interest, 600.00)  # 1000 * 0.05 * 12

if __name__ == "__main__":
    unittest.main() 