#!/usr/bin/python3
"""
Contains the class User Controller
"""
from BackEnd.models.user import User
from BackEnd.Controllers.AccountController import AccountController
from BackEnd.Controllers.NotificationController import NotificationController
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
        self.notification_controller = NotificationController()

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

            # If user is not an admin, create an account and welcome notification
            if not admin:
                self.account_controller.create_account(user.id, account_type='savings')
                # Create welcome notification
                self.notification_controller.notify_welcome(user.id, fullname or username)

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
        Deletes a user and their associated records from the database.
        """
        try:
            user = self.find_user_by(id=user_id)
            if not user:
                raise NoResultFound("User not Found.")

            session = self.db.session()
            
            # Import models here to avoid circular imports
            from BackEnd.models.Notification import Notification
            from BackEnd.models.Stripe import StripePayment
            from BackEnd.models.Loan import Loan
            from BackEnd.models.Account import Account
            from BackEnd.models.Transaction import Transaction
            from BackEnd.models.Repayment import Repayment

            # Delete in order to respect foreign key constraints
            
            # 1. Delete notifications
            session.query(Notification).filter(Notification.user_id == user_id).delete()
            
            # 2. Delete stripe payments
            session.query(StripePayment).filter(StripePayment.user_id == user_id).delete()
            
            # 3. Get user's accounts to delete related records
            user_accounts = session.query(Account).filter(Account.user_id == user_id).all()
            account_ids = [account.id for account in user_accounts]
            
            if account_ids:
                # Delete transactions related to user's accounts
                session.query(Transaction).filter(Transaction.account_id.in_(account_ids)).delete()
                
                # Delete repayments for loans related to user's accounts
                loans = session.query(Loan).filter(Loan.account_id.in_(account_ids)).all()
                loan_ids = [loan.id for loan in loans]
                if loan_ids:
                    session.query(Repayment).filter(Repayment.loan_id.in_(loan_ids)).delete()
                
                # Delete loans related to user's accounts
                session.query(Loan).filter(Loan.account_id.in_(account_ids)).delete()
                
                # Delete loans where user is admin
                session.query(Loan).filter(Loan.admin_id == user_id).delete()
            
            # 4. Delete user's accounts
            session.query(Account).filter(Account.user_id == user_id).delete()
            
            # 5. Finally delete the user
            session.delete(user)
            
            # Commit all changes
            session.commit()
            return True
            
        except NoResultFound as e:
            print(f"Error deleting user: {e}")
            self.db.Rollback()
            return False
        except Exception as e:
            self.db.Rollback()
            print(f"An unexpected error occurred during user deletion: {e}")
            import traceback
            traceback.print_exc()
            return False
