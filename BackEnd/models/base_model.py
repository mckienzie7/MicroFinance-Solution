from datetime import datetime, timezone
from os import getenv
import sqlalchemy
from sqlalchemy import Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
import uuid

time = "%Y-%m-%dT%H:%M:%S.%f"

# Get storage type from environment variable
storage_t = getenv("MFS_TYPE_STORAGE", "db")

if storage_t == "db":
    Base = declarative_base()
else:
    Base = object


class BaseModel:
    """The BaseModel class from which future classes will be derived"""
    if storage_t == "db":
        id = Column(String(60), primary_key=True)
        created_at = Column(DateTime, default=datetime.now(timezone.utc), nullable=False)
        updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False)

    def __init__(self, *args, **kwargs):
        """Initialization of the base model"""
        if kwargs:
            for key, value in kwargs.items():
                if key != "__class__":
                    setattr(self, key, value)
            if kwargs.get("created_at", None) and isinstance(self.created_at, str):
                self.created_at = datetime.strptime(kwargs["created_at"], time)
            else:
                self.created_at = datetime.now(timezone.utc)
            if kwargs.get("updated_at", None) and isinstance(self.updated_at, str):
                self.updated_at = datetime.strptime(kwargs["updated_at"], time)
            else:
                self.updated_at = datetime.now(timezone.utc)
            if kwargs.get("id", None) is None:
                self.id = str(uuid.uuid4())
        else:
            self.id = str(uuid.uuid4())
            self.created_at = datetime.now(timezone.utc)
            self.updated_at = self.created_at

    def __str__(self):
        """String representation of the BaseModel class"""
        return "[{:s}] ({:s}) {}".format(self.__class__.__name__, self.id, self.__dict__)

    def save(self):
        """updates the attribute 'updated_at' with the current datetime"""
        self.updated_at = datetime.now(timezone.utc)
        BackEnd.models.storage.new(self)
        BackEnd.models.storage.save()

    def to_dict(self, save_fs=None):
        """returns a dictionary containing all keys/values of the instance"""
        new_dict = self.__dict__.copy()

        # Convert to datetime if they are strings
        if "created_at" in new_dict and isinstance(new_dict["created_at"], str):
            try:
                new_dict["created_at"] = datetime.strptime(new_dict["created_at"], "%Y-%m-%dT%H:%M:%S.%f")
            except ValueError:
                new_dict["created_at"] = datetime.strptime(new_dict["created_at"], "%Y-%m-%d %H:%M:%S.%f")

        if "updated_at" in new_dict and isinstance(new_dict["updated_at"], str):
            try:
                new_dict["updated_at"] = datetime.strptime(new_dict["updated_at"], "%Y-%m-%dT%H:%M:%S.%f")
            except ValueError:
                new_dict["updated_at"] = datetime.strptime(new_dict["updated_at"], "%Y-%m-%d %H:%M:%S.%f")

        # Ensure that datetime fields are converted to strings in the proper format
        if "created_at" in new_dict:
            new_dict["created_at"] = new_dict["created_at"].strftime(time)
        if "updated_at" in new_dict:
            new_dict["updated_at"] = new_dict["updated_at"].strftime(time)

        new_dict["__class__"] = self.__class__.__name__
        if "_sa_instance_state" in new_dict:
            del new_dict["_sa_instance_state"]
        if save_fs is None:
            if "password" in new_dict:
                del new_dict["password"]

        return new_dict

    def delete(self):
        """delete the current instance from the storage"""
        BackEnd.models.storage.delete(self)
