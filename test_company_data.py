#!/usr/bin/python3
"""
Test script to check company data and calculations
"""
from BackEnd.models import storage
from BackEnd.models.Transaction import Transaction
from BackEnd.models.Loan import Loan
from BackEnd.models.Account import Account
from BackEnd.models.Repayment import Repayment
from BackEnd.Controllers.CompanyBalanceController import CompanyBalanceController

def test_company_data():
    print("=== Testing Company Data ===")
    
    # Test basic data counts
    accounts = list(storage.all(Account).values())
    loans = list(storage.all(Loan).values())
    transactions = list(storage.all(Transaction).values())
    repayments = list(storage.all(Repayment).values())
    
    print(f"Total Accounts: {len(accounts)}")
    print(f"Total Loans: {len(loans)}")
    print(f"Total Transactions: {len(transactions)}")
    print(f"Total Repayments: {len(repayments)}")
    
    # Test loan statuses
    loan_statuses = {}
    for loan in loans:
        status = loan.loan_status
        if status not in loan_statuses:
            loan_statuses[status] = 0
        loan_statuses[status] += 1
    
    print(f"\nLoan Status Breakdown:")
    for status, count in loan_statuses.items():
        print(f"  {status}: {count}")
    
    # Test transaction types
    transaction_types = {}
    for transaction in transactions:
        t_type = transaction.transaction_type
        if t_type not in transaction_types:
            transaction_types[t_type] = {'count': 0, 'total': 0}
        transaction_types[t_type]['count'] += 1
        transaction_types[t_type]['total'] += transaction.amount
    
    print(f"\nTransaction Type Breakdown:")
    for t_type, data in transaction_types.items():
        print(f"  {t_type}: {data['count']} transactions, Total: {data['total']:.2f} ETB")
    
    # Test CompanyBalanceController
    print(f"\n=== Testing CompanyBalanceController ===")
    controller = CompanyBalanceController()
    
    try:
        overview = controller.get_company_overview()
        print(f"Company Balance: {overview['overview']['company_balance']:.2f} ETB")
        print(f"Total Customers: {overview['overview']['total_customers']}")
        print(f"Profit/Loss: {overview['overview']['profit_loss']:.2f} ETB")
        print(f"Status: {overview['overview']['status']}")
        
        print(f"\nLoan Metrics:")
        print(f"  Total Loans Issued: {overview['loans']['total_loans_issued']}")
        print(f"  Active Loans: {overview['loans']['active_loans']}")
        print(f"  Interest Earned: {overview['loans']['total_interest_earned']:.2f} ETB")
        
        print(f"\nTransaction Metrics:")
        print(f"  Total Deposits: {overview['transactions']['total_deposits']:.2f} ETB")
        print(f"  Total Withdrawals: {overview['transactions']['total_withdrawals']:.2f} ETB")
        print(f"  Net Deposits: {overview['transactions']['net_deposits']:.2f} ETB")
        
    except Exception as e:
        print(f"Error in CompanyBalanceController: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_company_data()