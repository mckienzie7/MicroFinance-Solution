#!/usr/bin/env python3
"""
Migration script to add ID card columns to users table
"""
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from BackEnd.models import storage
from sqlalchemy import text

def run_migration():
    """Run the migration to add ID card columns"""
    try:
        # Get the database session
        session = storage.session()
        
        print("Starting migration: Adding ID card columns to users table...")
        
        # Add id_card_front_path column
        try:
            session.execute(text("ALTER TABLE users ADD COLUMN id_card_front_path VARCHAR(255)"))
            print("✓ Added id_card_front_path column")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e):
                print("✓ id_card_front_path column already exists")
            else:
                print(f"✗ Error adding id_card_front_path column: {e}")
                raise
        
        # Add id_card_back_path column
        try:
            session.execute(text("ALTER TABLE users ADD COLUMN id_card_back_path VARCHAR(255)"))
            print("✓ Added id_card_back_path column")
        except Exception as e:
            if "Duplicate column name" in str(e) or "already exists" in str(e):
                print("✓ id_card_back_path column already exists")
            else:
                print(f"✗ Error adding id_card_back_path column: {e}")
                raise
        
        # Commit the changes
        session.commit()
        print("✓ Migration completed successfully!")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        session.rollback()
        raise
    finally:
        session.close()

def rollback_migration():
    """Rollback the migration by removing ID card columns"""
    try:
        # Get the database session
        session = storage.session()
        
        print("Starting rollback: Removing ID card columns from users table...")
        
        # Remove id_card_front_path column
        try:
            session.execute(text("ALTER TABLE users DROP COLUMN id_card_front_path"))
            print("✓ Removed id_card_front_path column")
        except Exception as e:
            if "doesn't exist" in str(e) or "Unknown column" in str(e):
                print("✓ id_card_front_path column doesn't exist")
            else:
                print(f"✗ Error removing id_card_front_path column: {e}")
        
        # Remove id_card_back_path column
        try:
            session.execute(text("ALTER TABLE users DROP COLUMN id_card_back_path"))
            print("✓ Removed id_card_back_path column")
        except Exception as e:
            if "doesn't exist" in str(e) or "Unknown column" in str(e):
                print("✓ id_card_back_path column doesn't exist")
            else:
                print(f"✗ Error removing id_card_back_path column: {e}")
        
        # Commit the changes
        session.commit()
        print("✓ Rollback completed successfully!")
        
    except Exception as e:
        print(f"✗ Rollback failed: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Database migration for ID card columns')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    
    args = parser.parse_args()
    
    if args.rollback:
        rollback_migration()
    else:
        run_migration()