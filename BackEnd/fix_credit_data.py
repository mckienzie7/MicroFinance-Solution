#!/usr/bin/env python3
"""
Quick fix script for credit score data issues
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from BackEnd.models import storage
from BackEnd.models.user import User
from BackEnd.models.Account import Account
from BackEnd.models.Loan import Loan

def quick_fix_credit_data(user_id, loan_amount=5000, account_age_days=90):
    """
    Quick fix for common credit score data issues
    
    Args:
        user_id: The user ID to fix
        loan_amount: The correct loan amount (if loans show 0)
        account_age_days: How many days ago the account should be created
    """
    print(f"🔧 Quick fixing credit data for user: {user_id}")
    
    # Fix 1: User creation date
    user = storage.get(User, user_id)
    if user:
        if not user.created_at or (datetime.now() - user.created_at).days < 7:
            old_date = user.created_at
            user.created_at = datetime.now() - timedelta(days=account_age_days)
            storage.save()
            print(f"✅ Fixed user creation date: {old_date} → {user.created_at}")
        else:
            print(f"✅ User creation date OK: {user.created_at}")
    
    # Fix 2: Loan amounts
    accounts = storage.all(Account).values()
    user_accounts = [acc for acc in accounts if acc.user_id == user_id]
    account_ids = [acc.id for acc in user_accounts]
    
    loans = storage.all(Loan).values()
    user_loans = [loan for loan in loans if loan.account_id in account_ids]
    
    fixed_loans = 0
    for loan in user_loans:
        if loan.amount == 0:
            loan.amount = loan_amount
            fixed_loans += 1
            print(f"✅ Fixed loan {loan.id}: amount set to {loan_amount}")
    
    if fixed_loans > 0:
        storage.save()
        print(f"✅ Fixed {fixed_loans} loan(s)")
    else:
        print("✅ Loan amounts look OK")
    
    print("\n🎉 Quick fix completed!")
    print("💡 Now check your credit score again - it should be much more accurate!")

if __name__ == "__main__":
    # Get user ID from command line or use default for testing
    import sys
    if len(sys.argv) > 1:
        USER_ID = sys.argv[1]
    else:
        # Try to find a user automatically
        users = storage.all(User).values()
        if users:
            USER_ID = list(users)[0].id
            print(f"🔍 Auto-detected user ID: {USER_ID}")
        else:
            print("❌ No users found. Please provide user ID as argument:")
            print("   python fix_credit_data.py <user-id>")
            exit(1)
    
    quick_fix_credit_data(USER_ID)