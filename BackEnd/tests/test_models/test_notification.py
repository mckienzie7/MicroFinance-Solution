import unittest
import inspect
from BackEnd.models.notification import Notification
from BackEnd.models.base_model import BaseModel

class TestNotificationDocs(unittest.TestCase):
    """Tests to check the documentation and style of the Notification class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.notification_f = inspect.getmembers(Notification, inspect.isfunction)

    def test_notification_module_docstring(self):
        """Test for the notification.py module docstring"""
        self.assertIsNot(Notification.__module__.__doc__, None, "notification.py needs a docstring")
        self.assertTrue(len(Notification.__module__.__doc__) >= 1, "notification.py needs a docstring")

    def test_notification_class_docstring(self):
        """Test for the Notification class docstring"""
        self.assertIsNot(Notification.__doc__, None, "Notification class needs a docstring")
        self.assertTrue(len(Notification.__doc__) >= 1, "Notification class needs a docstring")

    def test_notification_func_docstrings(self):
        """Test for the presence of docstrings in Notification methods"""
        for func in self.notification_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")

class TestNotification(unittest.TestCase):
    """Test the Notification class"""

    def setUp(self):
        """Set up a test notification instance"""
        self.notification = Notification(
            user_id="user123",
            message="Your loan application has been approved",
            type="system"
        )

    def test_is_subclass(self):
        """Test that Notification is a subclass of BaseModel"""
        self.assertIsInstance(self.notification, BaseModel)

    def test_user_id_attr(self):
        """Test that Notification has a user_id attribute"""
        self.assertTrue(hasattr(self.notification, "user_id"))
        self.assertEqual(self.notification.user_id, "user123")

    def test_message_attr(self):
        """Test that Notification has a message attribute"""
        self.assertTrue(hasattr(self.notification, "message"))
        self.assertEqual(self.notification.message, "Your loan application has been approved")

    def test_is_read_attr(self):
        """Test that Notification has an is_read attribute with default value"""
        self.assertTrue(hasattr(self.notification, "is_read"))
        self.assertFalse(self.notification.is_read)

    def test_type_attr(self):
        """Test that Notification has a type attribute"""
        self.assertTrue(hasattr(self.notification, "type"))
        self.assertEqual(self.notification.type, "system")

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[Notification] ({}) {}".format(self.notification.id, self.notification.__dict__)
        self.assertEqual(str(self.notification), expected_str)

    def test_to_dict(self):
        """Test the to_dict method"""
        notification_dict = self.notification.to_dict()
        
        self.assertIsInstance(notification_dict, dict)
        self.assertIn("id", notification_dict)
        self.assertIn("user_id", notification_dict)
        self.assertIn("message", notification_dict)
        self.assertIn("is_read", notification_dict)
        self.assertIn("type", notification_dict)
        self.assertIn("created_at", notification_dict)
        self.assertIn("updated_at", notification_dict)
        self.assertIn("__class__", notification_dict)
        self.assertEqual(notification_dict["__class__"], "Notification")

    def test_mark_as_read(self):
        """Test marking notification as read"""
        self.notification.is_read = True
        self.assertTrue(self.notification.is_read)

    def test_message_update(self):
        """Test updating notification message"""
        new_message = "Your loan has been disbursed"
        self.notification.message = new_message
        self.assertEqual(self.notification.message, new_message)

    def test_type_change(self):
        """Test changing notification type"""
        self.notification.type = "email"
        self.assertEqual(self.notification.type, "email")

if __name__ == "__main__":
    unittest.main() 