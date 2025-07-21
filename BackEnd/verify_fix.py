#!/usr/bin/env python3
"""
Verify if the credit data fix worked
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from BackEnd.models import storage
from BackEnd.models.user import User
from BackEnd.models.Account import Account
from BackEnd.models.Loan import Loan

def verify_user_data():
    """Verify the current state of user data"""
    print("🔍 Verifying user data after fix...")
    
    # Get all users
    users = storage.all(User).values()
    if not users:
        print("❌ No users found!")
        return
    
    user = list(users)[0]  # Get first user
    print(f"👤 User ID: {user.id}")
    print(f"📅 User created_at: {user.created_at}")
    
    if user.created_at:
        age_days = (datetime.now() - user.created_at).days
        print(f"🕐 Calculated age: {age_days} days")
    else:
        print("❌ No creation date!")
    
    # Check accounts
    accounts = storage.all(Account).values()
    user_accounts = [acc for acc in accounts if acc.user_id == user.id]
    print(f"💳 User accounts: {len(user_accounts)}")
    
    # Check loans
    account_ids = [acc.id for acc in user_accounts]
    loans = storage.all(Loan).values()
    user_loans = [loan for loan in loans if loan.account_id in account_ids]
    print(f"💸 User loans: {len(user_loans)}")
    
    for loan in user_loans:
        print(f"  - Loan {loan.id}: amount = {loan.amount}, status = {loan.loan_status}")
    
    return user.id

def force_fix_user_date(user_id):
    """Force fix the user creation date"""
    print(f"\n🔧 Force fixing user creation date for: {user_id}")
    
    user = storage.get(User, user_id)
    if user:
        old_date = user.created_at
        # Set to exactly 90 days ago
        user.created_at = datetime.now() - timedelta(days=90)
        storage.save()
        print(f"✅ FORCE Fixed: {old_date} → {user.created_at}")
        
        # Verify the change
        user_check = storage.get(User, user_id)
        age_days = (datetime.now() - user_check.created_at).days
        print(f"✅ Verified age: {age_days} days")
    else:
        print("❌ User not found!")

if __name__ == "__main__":
    from datetime import timedelta
    
    user_id = verify_user_data()
    
    print("\n" + "="*50)
    print("🔧 FORCE FIXING USER DATE...")
    force_fix_user_date(user_id)
    
    print("\n" + "="*50)
    print("🔍 VERIFYING AGAIN...")
    verify_user_data()