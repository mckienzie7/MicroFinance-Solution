#!/usr/bin/env python3
"""
Script to run the ID card columns migration
"""
import os
import sys

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from BackEnd.migrations.add_id_card_columns import run_migration, rollback_migration

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run database migration for ID card columns')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    
    args = parser.parse_args()
    
    try:
        if args.rollback:
            print("🔄 Rolling back ID card columns migration...")
            rollback_migration()
            print("✅ Migration rollback completed successfully!")
        else:
            print("🚀 Running ID card columns migration...")
            run_migration()
            print("✅ Migration completed successfully!")
            print("\n📝 Next steps:")
            print("1. Restart your Flask server")
            print("2. Test the new registration with ID card upload")
            print("3. Check admin user management to see ID cards")
    
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)