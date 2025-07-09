#!/usr/bin/python3
"""
Contains the class User Controller
"""
from BackEnd.models.user import User
from BackEnd.Controllers.AccountController import AccountController
from sqlalchemy import tuple_
from sqlalchemy.exc import InvalidRequestError
from sqlalchemy.orm.exc import NoResultFound
from BackEnd.models import storage

class UserController:
    """
        - UserController class
    """
    def __init__(self):
        """Initialize the UserController with a database connection"""
        self.db = storage
        self.__session = None
        self.account_controller = AccountController()

    def add_user(self, username: str, email: str, password: str, admin: bool = False, 
                fullname: str = None, phone_number: str = None) -> User:
        """Create a new user in the given Database"""
        try:
            # Create user with all fields
            user = User(
                username=username,
                email=email,
                admin=admin,
                fullname=fullname or username,
                phone_number=phone_number
            )
            
            # Set password
            user.set_password(password)
            
            # Save to database
            self.db.new(user)
            self.db.save()

            # If user is not an admin, create an account
            if not admin:
                self.account_controller.create_account(user.id, account_type='savings')

        except Exception as e:
            self.db.Rollback()
            print(f"Error: {e}")
            raise e

        return user

    def find_user_by(self, **filters) -> User:
        """Find a user in the database based on filters."""
        session = self.db.session()
        print("Searching user with filters:", filters)

        query = session.query(User)
        for field, value in filters.items():
            if hasattr(User, field):
                print(f"Filter: {field} = {value}")
                query = query.filter(getattr(User, field) == value)
            else:
                raise InvalidRequestError(f"Invalid filter: {field}")

        user = query.first()
        if user is None:
            print("User not found.")
            raise NoResultFound("User not found.")
        return user

    def update_user(self, user_id, **updates) -> None:
        """Update user information in the database."""
        user = self.find_user_by(id=user_id)
        if user is None:
            return
        update_field = {}
        for key, value in updates.items():
            if hasattr(User, key):
                update_field[getattr(User, key)] = value
            else:
                raise ValueError(f"Invalid field: {key}")
        self.db.session().query(User).filter(User.id == user_id).update(
            update_field,
            synchronize_session=False
        )
        self.db.save()

    def delete_user(self, user_id: str) -> bool:
        """
        Deletes a user and their associated accounts from the database.
        """
        try:
            user = self.find_user_by(id=user_id)
            if not user:
                raise NoResultFound("User not Found.")

            # Delete associated accounts
            self.account_controller.delete_accounts_by_user(user_id)

            # Delete the user
            self.db.delete(user)
            self.db.save()
            return True
        except NoResultFound as e:
            print(f"Error deleting user: {e}")
            return False
        except Exception as e:
            self.db.Rollback()
            print(f"An unexpected error occurred: {e}")
            return False
