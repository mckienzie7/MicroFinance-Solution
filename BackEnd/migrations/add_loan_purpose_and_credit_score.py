#!/usr/bin/env python3
"""Migration to add purpose and credit_score columns to loans table"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from BackEnd.models import storage
from sqlalchemy import text

def run_migration():
    """Add purpose and credit_score columns to loans table"""
    
    sql = """
    ALTER TABLE loans 
    ADD COLUMN IF NOT EXISTS purpose VARCHAR(500),
    ADD COLUMN IF NOT EXISTS credit_score INT DEFAULT 0;
    """
    
    try:
        with storage._DBStorage__engine.connect() as connection:
            connection.execute(text(sql))
            connection.commit()
        
        print("✓ Successfully added purpose and credit_score columns to loans table")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
