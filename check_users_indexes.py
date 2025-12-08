#!/usr/bin/env python3
"""Check users table indexes"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from BackEnd.models import storage
from sqlalchemy import text

try:
    with storage._DBStorage__engine.connect() as connection:
        result = connection.execute(text("SHOW INDEX FROM users"))
        print("Users table indexes:")
        for row in result:
            print(f"Column: {row[4]}, Key_name: {row[2]}, Unique: {row[1]}")
        
        print("\n" + "="*50)
        result2 = connection.execute(text("SHOW CREATE TABLE users"))
        for row in result2:
            print("\nUsers table CREATE statement:")
            print(row[1])
except Exception as e:
    print(f"Error: {e}")
