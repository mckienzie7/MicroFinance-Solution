import unittest
import inspect
from BackEnd.models.admin import Admin
from BackEnd.models.user import User
from BackEnd.models.base_model import BaseModel

class TestAdminDocs(unittest.TestCase):
    """Tests to check the documentation and style of the Admin class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.admin_f = inspect.getmembers(Admin, inspect.isfunction)

    def test_admin_module_docstring(self):
        """Test for the admin.py module docstring"""
        self.assertIsNot(Admin.__module__.__doc__, None, "admin.py needs a docstring")
        self.assertTrue(len(Admin.__module__.__doc__) >= 1, "admin.py needs a docstring")

    def test_admin_class_docstring(self):
        """Test for the Admin class docstring"""
        self.assertIsNot(Admin.__doc__, None, "Admin class needs a docstring")
        self.assertTrue(len(Admin.__doc__) >= 1, "Admin class needs a docstring")

    def test_admin_func_docstrings(self):
        """Test for the presence of docstrings in Admin methods"""
        for func in self.admin_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")

class TestAdmin(unittest.TestCase):
    """Test the Admin class"""

    def setUp(self):
        """Set up a test admin instance"""
        self.admin = Admin(
            username="adminuser",
            email="admin@example.com",
            password="adminpass123",
            role="loan_officer",
            permission={"can_approve_loans": True, "can_view_reports": True}
        )

    def test_is_subclass(self):
        """Test that Admin is a subclass of User and BaseModel"""
        self.assertIsInstance(self.admin, User)
        self.assertIsInstance(self.admin, BaseModel)

    def test_id_attr(self):
        """Test that Admin has an id attribute"""
        self.assertTrue(hasattr(self.admin, "id"))
        self.assertIsInstance(self.admin.id, str)
        self.assertTrue(len(self.admin.id) > 0)

    def test_username_attr(self):
        """Test that Admin has a username attribute"""
        self.assertTrue(hasattr(self.admin, "username"))
        self.assertEqual(self.admin.username, "adminuser")

    def test_email_attr(self):
        """Test that Admin has an email attribute"""
        self.assertTrue(hasattr(self.admin, "email"))
        self.assertEqual(self.admin.email, "admin@example.com")

    def test_password_attr(self):
        """Test that Admin has a password attribute"""
        self.assertTrue(hasattr(self.admin, "password"))
        self.assertNotEqual(self.admin.password, "adminpass123")  # Should be hashed

    def test_role_attr(self):
        """Test that Admin has a role attribute"""
        self.assertTrue(hasattr(self.admin, "role"))
        self.assertEqual(self.admin.role, "loan_officer")

    def test_permission_attr(self):
        """Test that Admin has a permission attribute"""
        self.assertTrue(hasattr(self.admin, "permission"))
        self.assertIsInstance(self.admin.permission, dict)
        self.assertTrue(self.admin.permission["can_approve_loans"])
        self.assertTrue(self.admin.permission["can_view_reports"])

    def test_loans_relationship(self):
        """Test that Admin has the loans relationship"""
        self.assertTrue(hasattr(self.admin, "loans"))

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[Admin] ({}) {}".format(self.admin.id, self.admin.__dict__)
        self.assertEqual(str(self.admin), expected_str)

    def test_to_dict(self):
        """Test the to_dict method"""
        admin_dict = self.admin.to_dict()
        
        self.assertIsInstance(admin_dict, dict)
        self.assertIn("id", admin_dict)
        self.assertIn("username", admin_dict)
        self.assertIn("email", admin_dict)
        self.assertIn("role", admin_dict)
        self.assertIn("permission", admin_dict)
        self.assertIn("created_at", admin_dict)
        self.assertIn("updated_at", admin_dict)
        self.assertIn("__class__", admin_dict)
        self.assertEqual(admin_dict["__class__"], "Admin")

    def test_password_hashing(self):
        """Test that password is properly hashed"""
        self.admin.set_password("newadminpass123")
        self.assertTrue(self.admin.check_password("newadminpass123"))
        self.assertFalse(self.admin.check_password("wrongpassword"))

    def test_role_change(self):
        """Test changing admin role"""
        self.admin.role = "super_admin"
        self.assertEqual(self.admin.role, "super_admin")

    def test_permission_update(self):
        """Test updating admin permissions"""
        new_permissions = {
            "can_approve_loans": True,
            "can_view_reports": True,
            "can_manage_users": True
        }
        self.admin.permission = new_permissions
        self.assertEqual(self.admin.permission, new_permissions)

    def test_loan_creation(self):
        """Test that an admin can have loans"""
        from BackEnd.models.loan import Loan
        loan = Loan(
            admin_id=self.admin.id,
            account_id="acc123",
            amount=1000.00,
            interest_rate=5.0,
            repayment_period=12
        )
        self.admin.loans.append(loan)
        self.assertIn(loan, self.admin.loans)

if __name__ == "__main__":
    unittest.main() 