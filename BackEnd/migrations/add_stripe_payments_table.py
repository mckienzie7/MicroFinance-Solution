#!/usr/bin/env python3
"""Migration to add stripe_payments table"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from BackEnd.models import storage
from sqlalchemy import text

def run_migration():
    """Create stripe_payments table"""
    
    # First, drop the table if it exists (to start fresh)
    drop_sql = "DROP TABLE IF EXISTS stripe_payments;"
    
    # Create table without foreign key first - match users table collation
    create_sql = """
    CREATE TABLE stripe_payments (
        id VARCHAR(60) NOT NULL PRIMARY KEY,
        user_id VARCHAR(60) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description VARCHAR(255),
        stripe_charge_id VARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_stripe_charge_id (stripe_charge_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    """
    
    # Add foreign key constraint separately
    fk_sql = """
    ALTER TABLE stripe_payments 
    ADD CONSTRAINT fk_stripe_payments_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    """
    
    try:
        with storage._DBStorage__engine.connect() as connection:
            # Drop existing table
            connection.execute(text(drop_sql))
            print("✓ Dropped existing stripe_payments table (if any)")
            
            # Create new table
            connection.execute(text(create_sql))
            print("✓ Created stripe_payments table")
            
            # Add foreign key
            connection.execute(text(fk_sql))
            print("✓ Added foreign key constraint")
            
            connection.commit()
        
        print("\n✓ Successfully created stripe_payments table with all constraints")
        return True
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
