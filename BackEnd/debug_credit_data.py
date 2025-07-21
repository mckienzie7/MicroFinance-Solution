#!/usr/bin/env python3
"""
Debug script to check and fix credit score data issues
"""

from datetime import datetime, timedelta
from BackEnd.models import storage
from BackEnd.models.user import User
from BackEnd.models.Account import Account
from BackEnd.models.Loan import Loan
from BackEnd.models.Repayment import Repayment
from BackEnd.models.Transaction import Transaction

def debug_user_data(user_id):
    """Debug user data for credit score calculation"""
    print(f"🔍 Debugging user data for user_id: {user_id}")
    print("=" * 50)
    
    # Get user
    user = storage.get(User, user_id)
    if not user:
        print("❌ User not found!")
        return
    
    print(f"👤 User: {user.first_name} {user.last_name}")
    print(f"📅 User created: {user.created_at}")
    if user.created_at:
        age_days = (datetime.now() - user.created_at).days
        print(f"🕐 Account age: {age_days} days")
    
    # Get accounts
    accounts = storage.all(Account).values()
    user_accounts = [acc for acc in accounts if acc.user_id == user_id]
    print(f"\n💳 Accounts: {len(user_accounts)}")
    
    total_balance = 0
    for acc in user_accounts:
        print(f"  - Account {acc.account_number}: Balance = {acc.balance}")
        total_balance += acc.balance
    print(f"💰 Total balance: {total_balance}")
    
    # Get loans
    account_ids = [acc.id for acc in user_accounts]
    loans = storage.all(Loan).values()
    user_loans = [loan for loan in loans if loan.account_id in account_ids]
    print(f"\n💸 Loans: {len(user_loans)}")
    
    total_loan_amount = 0
    for loan in user_loans:
        print(f"  - Loan {loan.id}: Amount = {loan.amount}, Status = {loan.loan_status}")
        total_loan_amount += loan.amount
    print(f"💸 Total loan amount: {total_loan_amount}")
    
    # Get repayments
    loan_ids = [loan.id for loan in user_loans]
    repayments = storage.all(Repayment).values()
    user_repayments = [rep for rep in repayments if rep.loan_id in loan_ids]
    print(f"\n💳 Repayments: {len(user_repayments)}")
    
    total_repayments = 0
    for rep in user_repayments:
        print(f"  - Repayment {rep.id}: Amount = {rep.amount}, Status = {rep.status}")
        total_repayments += rep.amount
    print(f"💳 Total repayments: {total_repayments}")
    
    # Get transactions
    transactions = storage.all(Transaction).values()
    user_transactions = [t for t in transactions if t.account_id in account_ids]
    print(f"\n📊 Transactions: {len(user_transactions)}")
    
    loan_repayment_transactions = [t for t in user_transactions if t.transaction_type == 'loan_repayment']
    print(f"📊 Loan repayment transactions: {len(loan_repayment_transactions)}")
    
    for t in loan_repayment_transactions:
        print(f"  - {t.transaction_type}: {t.amount} on {t.created_at}")
    
    # Calculate repayment ratio
    if total_loan_amount > 0:
        repayment_ratio = total_repayments / total_loan_amount
        print(f"\n📈 Repayment ratio: {repayment_ratio:.2%}")
    else:
        print(f"\n⚠️  Cannot calculate repayment ratio - total loan amount is 0!")
    
    return {
        'user': user,
        'accounts': user_accounts,
        'loans': user_loans,
        'repayments': user_repayments,
        'transactions': user_transactions,
        'total_loan_amount': total_loan_amount,
        'total_repayments': total_repayments
    }

def fix_loan_data(user_id, correct_loan_amount=None):
    """Fix loan data if needed"""
    print(f"\n🔧 Checking if loan data needs fixing for user {user_id}")
    
    # Get user accounts
    accounts = storage.all(Account).values()
    user_accounts = [acc for acc in accounts if acc.user_id == user_id]
    account_ids = [acc.id for acc in user_accounts]
    
    # Get loans
    loans = storage.all(Loan).values()
    user_loans = [loan for loan in loans if loan.account_id in account_ids]
    
    for loan in user_loans:
        if loan.amount == 0 and correct_loan_amount:
            print(f"🔧 Fixing loan {loan.id}: Setting amount to {correct_loan_amount}")
            loan.amount = correct_loan_amount
            storage.save()
            print("✅ Loan amount fixed!")
        elif loan.amount == 0:
            print(f"⚠️  Loan {loan.id} has amount = 0. Please provide correct amount to fix.")
            print("   Usage: fix_loan_data(user_id, correct_loan_amount=5000)")

def fix_user_creation_date(user_id, days_ago=30):
    """Fix user creation date if it's too recent"""
    user = storage.get(User, user_id)
    if not user:
        print("❌ User not found!")
        return
    
    if user.created_at and (datetime.now() - user.created_at).days < 7:
        print(f"🔧 User created only {(datetime.now() - user.created_at).days} days ago")
        print(f"   Setting creation date to {days_ago} days ago for better credit history")
        
        user.created_at = datetime.now() - timedelta(days=days_ago)
        storage.save()
        print("✅ User creation date updated!")
    else:
        print("✅ User creation date looks good")

if __name__ == "__main__":
    # Replace with your actual user ID
    USER_ID = "your-user-id-here"
    
    print("🚀 Credit Score Data Debugger")
    print("=" * 50)
    
    # Debug current data
    data = debug_user_data(USER_ID)
    
    # Suggest fixes
    print("\n🔧 SUGGESTED FIXES:")
    print("=" * 50)
    
    if data and data['total_loan_amount'] == 0 and len(data['loans']) > 0:
        print("1. Fix loan amounts (they appear to be 0)")
        print("   Run: fix_loan_data('your-user-id', correct_loan_amount=5000)")
    
    if data and data['user'].created_at and (datetime.now() - data['user'].created_at).days < 7:
        print("2. Fix user creation date (too recent)")
        print("   Run: fix_user_creation_date('your-user-id', days_ago=90)")
    
    print("\n📋 To use this script:")
    print("1. Replace USER_ID with your actual user ID")
    print("2. Run the script to see current data")
    print("3. Run the suggested fix functions")