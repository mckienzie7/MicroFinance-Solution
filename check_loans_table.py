#!/usr/bin/env python3
"""Check loans table structure"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from BackEnd.models import storage
from sqlalchemy import text

try:
    with storage._DBStorage__engine.connect() as connection:
        result = connection.execute(text("DESCRIBE loans"))
        print("Loans table structure:")
        for row in result:
            print(row)
except Exception as e:
    print(f"Error: {e}")
