#!/usr/bin/python3
"""
Contains the class DBStorage
"""
from datetime import datetime

import BackEnd.models
from BackEnd.models.base_model import Base
from os import getenv
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from BackEnd.models.base_model import BaseModel
from BackEnd.models.user import User
from BackEnd.models.Account import Account
from BackEnd.models.Loan import Loan
from BackEnd.models.Notification import Notification
from BackEnd.models.otp import OTP
from BackEnd.models.Telebirr import Telebirr
from BackEnd.models.Repayment import Repayment
from BackEnd.models.Transaction import Transaction

classes = {"BaseModel": BaseModel, "User": User,
                                                "Account" : Account, "Loan" : Loan,
                                                "Repayment" : Repayment, "Transaction" : Transaction,
           "Notification" : Notification, "OTP" : OTP, "Telebirr" : Telebirr}




class DBStorage:
    """interaacts with the MySQL database"""
    __engine = None
    __session = None

    def __init__(self):
        MFS_USER = getenv('MFS_USER')
        MFS_PWD = getenv('MFS_PWD')
        MFS_HOST = getenv('MFS_HOST')
        MFS_DB = getenv('MFS_DB')
        MFS_ENV = getenv('MFS_ENV')
        self.__engine = create_engine('mysql+pymysql://{}:{}@{}/{}'.
                                      format(MFS_USER,
                                             MFS_PWD,
                                             MFS_HOST,
                                             MFS_DB))

        if MFS_ENV == "test":
            Base.metadata.drop_all(self.__engine)

    def all(self, cls=None):
        """query on the current database session"""
        new_dict = {}
        for clss in classes:
            if cls is None or cls is classes[clss] or cls is clss:
                objs = self.__session.query(classes[clss]).all()
                for obj in objs:
                    key = obj.__class__.__name__ + '.' + obj.id
                    new_dict[key] = obj
        return (new_dict)
    def session(self):
        """Returning or Exposing self.__session"""
        return self.__session

    def new(self, obj):
        """add the object to the current database session"""
        self.__session.add(obj)

    def save(self):
        """commit all changes of the current database session"""
        self.__session.commit()

    def delete(self, obj=None):
        """delete from the current database session obj if not None"""
        if obj is not None:
            self.__session.delete(obj)

    def reload(self):
        """reloads data from the database"""
        Base.metadata.create_all(self.__engine)
        sess_factory = sessionmaker(bind=self.__engine, expire_on_commit=False)
        Session = scoped_session(sess_factory)
        self.__session = Session

    def close(self):
        """call remove() method on the private session attribute"""
        self.__session.remove()

    def Rollback(self):
        """Call Rallback"""
        self.__session.rollback()

    def get(self, cls, id):
        """
        Returns the object based on the class name and its ID, or
        None if not found
        """
        if cls not in classes.values():
            return None

        all_cls = BackEnd.models.storage.all(cls)
        for value in all_cls.values():
            if (value.id == id):
                return value

        return None

    def count(self, cls=None):
        """
        count the number of objects in storage
        """
        all_class = classes.values()

        if not cls:
            count = 0
            for clas in all_class:
                count += len(BackEnd.models.storage.all(clas).values())
        else:
            count = len(BackEnd.models.storage.all(cls).values())


        return count

    def cleanup_expired_sessions(self):
        """Clean up expired sessions from the database."""
        try:
            current_time = datetime.utcnow()
            # Find users with expired sessions
            expired_users = self.__session.query(User).filter(
                User.session_expiration < current_time
            ).all()
            
            # Clear their session data
            for user in expired_users:
                user.session_id = None
                user.session_expiration = None
            
            self.__session.commit()
        except Exception as e:
            print(f"Error cleaning up expired sessions: {e}")
            self.__session.rollback()




