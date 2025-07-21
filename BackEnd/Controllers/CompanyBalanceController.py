#!/usr/bin/python3
"""
Contains the CompanyBalanceController class for managing company financial metrics
"""
from BackEnd.models import storage
from BackEnd.models.Transaction import Transaction
from BackEnd.models.Loan import Loan
from BackEnd.models.Account import Account
from BackEnd.models.Stripe import StripePayment
from BackEnd.models.Repayment import Repayment
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import Dict, List, Any


class CompanyBalanceController:
    """
    Handles company balance and financial metrics for admin dashboard
    """

    def __init__(self):
        """Initialize the CompanyBalanceController with database storage"""
        self.db = storage

    def get_company_overview(self) -> Dict[str, Any]:
        """
        Get comprehensive company financial overview
        Returns:
            Dictionary containing all company financial metrics
        """
        try:
            # Get basic metrics
            total_customers = self._get_total_customers()
            total_loans_issued = self._get_total_loans_issued()
            active_loans = self._get_active_loans()
            total_deposits = self._get_total_deposits()
            total_withdrawals = self._get_total_withdrawals()
            total_interest_earned = self._get_total_interest_earned()
            total_loan_repayments = self._get_total_loan_repayments()
            
            # Calculate derived metrics
            company_balance = self._calculate_company_balance()
            profit_loss = self._calculate_profit_loss()
            loan_default_rate = self._calculate_loan_default_rate()
            
            # Get trend data (last 12 months)
            monthly_trends = self._get_monthly_trends()
            
            # Get recent activities
            recent_activities = self._get_recent_activities()
            
            return {
                "overview": {
                    "company_balance": company_balance,
                    "total_customers": total_customers,
                    "profit_loss": profit_loss,
                    "status": "profit" if profit_loss > 0 else "loss" if profit_loss < 0 else "break_even"
                },
                "loans": {
                    "total_loans_issued": total_loans_issued["count"],
                    "total_loan_amount": total_loans_issued["amount"],
                    "active_loans": active_loans["count"],
                    "active_loan_amount": active_loans["amount"],
                    "total_interest_earned": total_interest_earned,
                    "loan_default_rate": loan_default_rate,
                    "total_repayments": total_loan_repayments
                },
                "transactions": {
                    "total_deposits": total_deposits,
                    "total_withdrawals": total_withdrawals,
                    "net_deposits": total_deposits - total_withdrawals
                },
                "trends": monthly_trends,
                "recent_activities": recent_activities,
                "generated_at": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting company overview: {str(e)}")
            return {"error": str(e)}

    def _get_total_customers(self) -> int:
        """Get total number of customers (accounts)"""
        try:
            return len(self.db.all(Account))
        except:
            return 0

    def _get_total_loans_issued(self) -> Dict[str, float]:
        """Get total loans issued (count and amount)"""
        try:
            loans = list(self.db.all(Loan).values())
            approved_loans = [loan for loan in loans if loan.loan_status in ['active', 'paid']]
            
            return {
                "count": len(approved_loans),
                "amount": sum(loan.amount for loan in approved_loans)
            }
        except:
            return {"count": 0, "amount": 0.0}

    def _get_active_loans(self) -> Dict[str, float]:
        """Get active loans (count and amount)"""
        try:
            loans = list(self.db.all(Loan).values())
            active_loans = [loan for loan in loans if loan.loan_status == 'active']
            
            return {
                "count": len(active_loans),
                "amount": sum(loan.amount for loan in active_loans)
            }
        except:
            return {"count": 0, "amount": 0.0}

    def _get_total_deposits(self) -> float:
        """Get total deposits made by customers"""
        try:
            transactions = list(self.db.all(Transaction).values())
            deposits = [t for t in transactions if t.transaction_type == 'deposit']
            return sum(t.amount for t in deposits)
        except:
            return 0.0

    def _get_total_withdrawals(self) -> float:
        """Get total withdrawals made by customers"""
        try:
            transactions = list(self.db.all(Transaction).values())
            withdrawals = [t for t in transactions if t.transaction_type == 'withdrawal']
            return sum(abs(t.amount) for t in withdrawals)
        except:
            return 0.0

    def _get_total_interest_earned(self) -> float:
        """Calculate total interest earned from loans"""
        try:
            loans = list(self.db.all(Loan).values())
            total_interest = 0.0
            
            for loan in loans:
                if loan.loan_status in ['active', 'paid']:
                    # Calculate original principal from total loan amount
                    principal = loan.amount / (1 + (loan.interest_rate / 100) * (loan.repayment_period / 12))
                    interest = loan.amount - principal
                    
                    if loan.loan_status == 'paid':
                        # Full interest earned
                        total_interest += interest
                    else:
                        # Partial interest based on repayments made
                        repayments = self._get_loan_repayments_amount(loan.id)
                        if repayments > 0:
                            # Calculate proportional interest earned
                            repayment_percentage = repayments / loan.amount
                            total_interest += interest * repayment_percentage
            
            return total_interest
        except Exception as e:
            print(f"Error calculating interest earned: {str(e)}")
            return 0.0

    def _get_loan_repayments_amount(self, loan_id: str) -> float:
        """Get total repayments made for a specific loan"""
        try:
            repayments = list(self.db.all(Repayment).values())
            loan_repayments = [r for r in repayments if r.loan_id == loan_id and r.status == 'completed']
            return sum(r.amount for r in loan_repayments)
        except:
            return 0.0

    def _get_total_loan_repayments(self) -> float:
        """Get total loan repayments received"""
        try:
            transactions = list(self.db.all(Transaction).values())
            repayments = [t for t in transactions if t.transaction_type == 'loan_repayment']
            return sum(abs(t.amount) for t in repayments)
        except:
            return 0.0

    def _calculate_company_balance(self) -> float:
        """
        Calculate company balance
        Company Balance = Total Deposits - Total Withdrawals - Total Loan Disbursements + Total Loan Repayments
        """
        try:
            total_deposits = self._get_total_deposits()
            total_withdrawals = self._get_total_withdrawals()
            total_repayments = self._get_total_loan_repayments()
            
            # Calculate total loan disbursements (principal amounts given to customers)
            loans = list(self.db.all(Loan).values())
            total_disbursements = 0.0
            for loan in loans:
                if loan.loan_status in ['active', 'paid']:
                    # Calculate principal amount that was disbursed
                    principal = loan.amount / (1 + (loan.interest_rate / 100) * (loan.repayment_period / 12))
                    total_disbursements += principal
            
            company_balance = total_deposits - total_withdrawals - total_disbursements + total_repayments
            return company_balance
        except Exception as e:
            print(f"Error calculating company balance: {str(e)}")
            return 0.0

    def _calculate_profit_loss(self) -> float:
        """
        Calculate profit/loss
        Profit = Interest Earned + Service Fees - Operating Costs
        For now, we'll use Interest Earned as the main profit indicator
        """
        try:
            total_interest_earned = self._get_total_interest_earned()
            # You can add operating costs here if you track them
            operating_costs = 0.0  # Add your operating costs calculation here
            
            return total_interest_earned - operating_costs
        except:
            return 0.0

    def _calculate_loan_default_rate(self) -> float:
        """Calculate loan default rate (percentage)"""
        try:
            loans = list(self.db.all(Loan).values())
            total_loans = len([loan for loan in loans if loan.loan_status in ['active', 'paid']])
            
            if total_loans == 0:
                return 0.0
            
            # For now, we'll consider loans that are overdue as defaults
            # You can enhance this logic based on your business rules
            defaulted_loans = 0
            current_date = datetime.now()
            
            for loan in loans:
                if loan.loan_status == 'active' and loan.end_date and loan.end_date < current_date:
                    defaulted_loans += 1
            
            return (defaulted_loans / total_loans) * 100
        except:
            return 0.0

    def _get_monthly_trends(self) -> List[Dict[str, Any]]:
        """Get monthly trends for the last 12 months"""
        try:
            trends = []
            current_date = datetime.now()
            
            for i in range(12):
                month_start = current_date.replace(day=1) - timedelta(days=30 * i)
                month_end = month_start + timedelta(days=30)
                
                # Get transactions for this month
                transactions = list(self.db.all(Transaction).values())
                month_transactions = [
                    t for t in transactions 
                    if month_start <= t.created_at <= month_end
                ]
                
                deposits = sum(t.amount for t in month_transactions if t.transaction_type == 'deposit')
                withdrawals = sum(abs(t.amount) for t in month_transactions if t.transaction_type == 'withdrawal')
                repayments = sum(abs(t.amount) for t in month_transactions if t.transaction_type == 'loan_repayment')
                
                # Get loans issued this month
                loans = list(self.db.all(Loan).values())
                month_loans = [
                    loan for loan in loans 
                    if month_start <= loan.created_at <= month_end and loan.loan_status in ['active', 'paid']
                ]
                loans_issued = sum(loan.amount for loan in month_loans)
                
                trends.append({
                    "month": month_start.strftime("%Y-%m"),
                    "month_name": month_start.strftime("%B %Y"),
                    "deposits": deposits,
                    "withdrawals": withdrawals,
                    "loans_issued": loans_issued,
                    "repayments": repayments,
                    "net_flow": deposits + repayments - withdrawals - loans_issued
                })
            
            return list(reversed(trends))  # Most recent first
        except Exception as e:
            print(f"Error getting monthly trends: {str(e)}")
            return []

    def _get_recent_activities(self) -> List[Dict[str, Any]]:
        """Get recent financial activities (last 10)"""
        try:
            activities = []
            
            # Get recent transactions
            transactions = list(self.db.all(Transaction).values())
            recent_transactions = sorted(transactions, key=lambda x: x.created_at, reverse=True)[:5]
            
            for transaction in recent_transactions:
                activities.append({
                    "type": "transaction",
                    "description": f"{transaction.transaction_type.title()}: {abs(transaction.amount)} ETB",
                    "amount": transaction.amount,
                    "date": transaction.created_at.isoformat(),
                    "category": transaction.transaction_type
                })
            
            # Get recent loans
            loans = list(self.db.all(Loan).values())
            recent_loans = sorted(loans, key=lambda x: x.created_at, reverse=True)[:5]
            
            for loan in recent_loans:
                activities.append({
                    "type": "loan",
                    "description": f"Loan {loan.loan_status}: {loan.amount} ETB",
                    "amount": loan.amount,
                    "date": loan.created_at.isoformat(),
                    "category": f"loan_{loan.loan_status}"
                })
            
            # Sort all activities by date and return top 10
            activities.sort(key=lambda x: x["date"], reverse=True)
            return activities[:10]
        except Exception as e:
            print(f"Error getting recent activities: {str(e)}")
            return []

    def get_detailed_loan_analytics(self) -> Dict[str, Any]:
        """Get detailed loan analytics"""
        try:
            loans = list(self.db.all(Loan).values())
            
            # Loan status breakdown
            status_breakdown = {}
            for loan in loans:
                status = loan.loan_status
                if status not in status_breakdown:
                    status_breakdown[status] = {"count": 0, "amount": 0.0}
                status_breakdown[status]["count"] += 1
                status_breakdown[status]["amount"] += loan.amount
            
            # Interest rate analysis
            interest_rates = {}
            for loan in loans:
                if loan.loan_status in ['active', 'paid']:
                    rate = loan.interest_rate
                    if rate not in interest_rates:
                        interest_rates[rate] = {"count": 0, "amount": 0.0}
                    interest_rates[rate]["count"] += 1
                    interest_rates[rate]["amount"] += loan.amount
            
            # Repayment period analysis
            repayment_periods = {}
            for loan in loans:
                if loan.loan_status in ['active', 'paid']:
                    period = loan.repayment_period
                    if period not in repayment_periods:
                        repayment_periods[period] = {"count": 0, "amount": 0.0}
                    repayment_periods[period]["count"] += 1
                    repayment_periods[period]["amount"] += loan.amount
            
            return {
                "status_breakdown": status_breakdown,
                "interest_rate_analysis": interest_rates,
                "repayment_period_analysis": repayment_periods,
                "total_loans": len(loans),
                "generated_at": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting loan analytics: {str(e)}")
            return {"error": str(e)}