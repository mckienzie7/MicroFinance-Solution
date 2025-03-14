import unittest
import inspect
import bcrypt
import pycodestyle

from models import user
from models.base_model import BaseModel

User = user.User


class TestUserDocs(unittest.TestCase):
    """Tests to check the documentation and style of the User class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.user_f = inspect.getmembers(User, inspect.isfunction)


    def test_user_module_docstring(self):
        """Test for the user.py module docstring"""
        self.assertIsNot(user.__doc__, None, "user.py needs a docstring")
        self.assertTrue(len(user.__doc__) >= 1, "user.py needs a docstring")

    def test_user_class_docstring(self):
        """Test for the User class docstring"""
        self.assertIsNot(User.__doc__, None, "User class needs a docstring")
        self.assertTrue(len(User.__doc__) >= 1, "User class needs a docstring")

    def test_user_func_docstrings(self):
        """Test for the presence of docstrings in User methods"""
        for func in self.user_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")


class TestUser(unittest.TestCase):
    """Test the User class"""

    def setUp(self):
        """Set up a test user instance"""
        self.user = User(username="testuser", email="test@example.com")

    def test_is_subclass(self):
        """Test that User is a subclass of BaseModel"""
        self.assertIsInstance(self.user, BaseModel)

    def test_username_attr(self):
        """Test that User has a username attribute and it's set correctly"""
        self.assertTrue(hasattr(self.user, "username"))
        self.assertEqual(self.user.username, "testuser")

    def test_email_attr(self):
        """Test that User has an email attribute"""
        self.assertTrue(hasattr(self.user, "email"))
        self.assertEqual(self.user.email, "test@example.com")

    def test_set_password(self):
        """Test the set_password method with bcrypt"""
        self.user.set_password("password123")
        self.assertNotEqual(self.user.password_hash, "")
        self.assertTrue(bcrypt.checkpw("password123".encode(), self.user.password_hash.encode()))

    def test_check_password(self):
        """Test the check_password method returns correct boolean"""
        self.user.set_password("password123")
        self.assertTrue(self.user.check_password("password123"))
        self.assertFalse(self.user.check_password("wrongpassword"))

    def test_bio_attr(self):
        """Test that User has a bio attribute and it is initially None"""
        self.assertTrue(hasattr(self.user, "bio"))
        self.assertIsNone(self.user.bio)

    def test_session_id_attr(self):
        """Test that User has a session_id attribute"""
        self.assertTrue(hasattr(self.user, "session_id"))
        self.assertIsNone(self.user.session_id)

    def test_reset_token_attr(self):
        """Test that User has a reset_token attribute"""
        self.assertTrue(hasattr(self.user, "reset_token"))
        self.assertIsNone(self.user.reset_token)

    def test_gender_attr(self):
        """Test that User has a gender attribute"""
        self.user.gender = "Male"
        self.assertTrue(hasattr(self.user, "gender"))
        self.assertEqual(self.user.gender, "Male")

    def test_age_attr(self):
        """Test that User has an age attribute"""
        self.user.age = 25
        self.assertTrue(hasattr(self.user, "age"))
        self.assertEqual(self.user.age, 25)

    def test_interests_attr(self):
        """Test that User has an interests attribute"""
        self.user.interests = "Coding, Music"
        self.assertTrue(hasattr(self.user, "interests"))
        self.assertEqual(self.user.interests, "Coding, Music")

    def test_location_attr(self):
        """Test that User has a location attribute"""
        self.user.location = "Addis Ababa"
        self.assertTrue(hasattr(self.user, "location"))
        self.assertEqual(self.user.location, "Addis Ababa")

    def test_profile_picture_attr(self):
        """Test that User has a profile_picture attribute"""
        self.user.profile_picture = "profile.jpg"
        self.assertTrue(hasattr(self.user, "profile_picture"))
        self.assertEqual(self.user.profile_picture, "profile.jpg")

    def test_hobbies_attr(self):
        """Test that User has a hobbies attribute"""
        self.user.hobbies = "Reading, Swimming"
        self.assertTrue(hasattr(self.user, "hobbies"))
        self.assertEqual(self.user.hobbies, "Reading, Swimming")

    def test_preferences_attr(self):
        """Test that User has a preferences attribute"""
        self.user.preferences = "Vegetarian"
        self.assertTrue(hasattr(self.user, "preferences"))
        self.assertEqual(self.user.preferences, "Vegetarian")

    def test_is_verified_attr(self):
        """Test that User has an is_verified attribute and its default value"""
        self.assertTrue(hasattr(self.user, "is_verified"))
        self.assertFalse(self.user.is_verified)  # Default is False

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[User] ({}) {}".format(self.user.id, self.user.__dict__)
        self.assertEqual(str(self.user), expected_str)

        # Additional check: Ensure key attributes are included
        self.assertIn("username", str(self.user))
        self.assertIn("email", str(self.user))
        self.assertIn("id", str(self.user))


if __name__ == "__main__":
    unittest.main()
