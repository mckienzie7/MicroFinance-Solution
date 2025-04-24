import unittest
import inspect
from datetime import datetime, timezone
from BackEnd.models.base_model import BaseModel
from BackEnd.models import storage_t

class TestBaseModelDocs(unittest.TestCase):
    """Tests to check the documentation and style of the BaseModel class"""

    @classmethod
    def setUpClass(cls):
        """Set up for the doc tests"""
        cls.base_f = inspect.getmembers(BaseModel, inspect.isfunction)

    def test_base_model_module_docstring(self):
        """Test for the base_model.py module docstring"""
        self.assertIsNot(BaseModel.__module__.__doc__, None, "base_model.py needs a docstring")
        self.assertTrue(len(BaseModel.__module__.__doc__) >= 1, "base_model.py needs a docstring")

    def test_base_model_class_docstring(self):
        """Test for the BaseModel class docstring"""
        self.assertIsNot(BaseModel.__doc__, None, "BaseModel class needs a docstring")
        self.assertTrue(len(BaseModel.__doc__) >= 1, "BaseModel class needs a docstring")

    def test_base_model_func_docstrings(self):
        """Test for the presence of docstrings in BaseModel methods"""
        for func in self.base_f:
            self.assertIsNot(func[1].__doc__, None, f"{func[0]} method needs a docstring")
            self.assertTrue(len(func[1].__doc__) >= 1, f"{func[0]} method needs a docstring")

class TestBaseModel(unittest.TestCase):
    """Test the BaseModel class"""

    def setUp(self):
        """Set up a test base model instance"""
        self.base = BaseModel()

    def test_is_instance(self):
        """Test that BaseModel is instantiated correctly"""
        self.assertIsInstance(self.base, BaseModel)

    def test_id_attr(self):
        """Test that BaseModel has an id attribute"""
        self.assertTrue(hasattr(self.base, "id"))
        self.assertIsInstance(self.base.id, str)
        self.assertTrue(len(self.base.id) > 0)

    def test_created_at_attr(self):
        """Test that BaseModel has a created_at attribute"""
        self.assertTrue(hasattr(self.base, "created_at"))
        self.assertIsInstance(self.base.created_at, datetime)
        self.assertTrue(self.base.created_at.tzinfo is not None)

    def test_updated_at_attr(self):
        """Test that BaseModel has an updated_at attribute"""
        self.assertTrue(hasattr(self.base, "updated_at"))
        self.assertIsInstance(self.base.updated_at, datetime)
        self.assertTrue(self.base.updated_at.tzinfo is not None)

    def test_init_with_kwargs(self):
        """Test initialization with kwargs"""
        test_id = "test123"
        test_created_at = "2024-01-01T00:00:00.000000"
        test_updated_at = "2024-01-01T00:00:00.000000"
        
        base = BaseModel(
            id=test_id,
            created_at=test_created_at,
            updated_at=test_updated_at
        )
        
        self.assertEqual(base.id, test_id)
        self.assertEqual(base.created_at.strftime("%Y-%m-%dT%H:%M:%S.%f"), test_created_at)
        self.assertEqual(base.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%f"), test_updated_at)

    def test_str(self):
        """Test that the str method outputs the correct format"""
        expected_str = "[BaseModel] ({}) {}".format(self.base.id, self.base.__dict__)
        self.assertEqual(str(self.base), expected_str)

    def test_to_dict(self):
        """Test the to_dict method"""
        base_dict = self.base.to_dict()
        
        self.assertIsInstance(base_dict, dict)
        self.assertIn("id", base_dict)
        self.assertIn("created_at", base_dict)
        self.assertIn("updated_at", base_dict)
        self.assertIn("__class__", base_dict)
        self.assertEqual(base_dict["__class__"], "BaseModel")
        
        # Check datetime format
        self.assertIsInstance(base_dict["created_at"], str)
        self.assertIsInstance(base_dict["updated_at"], str)

    def test_to_dict_with_save_fs(self):
        """Test the to_dict method with save_fs parameter"""
        base_dict = self.base.to_dict(save_fs=True)
        self.assertIsInstance(base_dict, dict)
        self.assertIn("id", base_dict)
        self.assertIn("created_at", base_dict)
        self.assertIn("updated_at", base_dict)
        self.assertIn("__class__", base_dict)

    def test_delete(self):
        """Test the delete method"""
        if storage_t == "db":
            self.base.save()
            self.base.delete()
            # Add assertions based on your storage implementation

if __name__ == "__main__":
    unittest.main() 