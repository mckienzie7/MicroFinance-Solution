#!/usr/bin/python3
"""
Contains the class Customer Controller
"""
from BackEnd.models import storage
from BackEnd.models.customer import Customer
from BackEnd.models.Account import Account
from BackEnd.models.loan import Loan
from sqlalchemy.orm.exc import NoResultFound
from typing import List


class CustomerController:
    """
    Handles customer-related operations
    """

    def __init__(self):
        """Initialize the CustomerController with database storage"""
        self.db = storage

    def get_customer(self, customer_id: str) -> Customer:
        """Retrieve customer details"""
        customer = self.db.get(Customer, customer_id)
        if not customer:
            raise NoResultFound("Customer not found")
        return customer

    def create_customer(self, **kwargs) -> Customer:
        """Create a new customer"""
        # Check if email already exists
        existing = self.db.get_by_email(Customer, kwargs.get('email'))
        if existing:
            raise ValueError("Customer with this email already exists")

        new_customer = Customer(**kwargs)
        self.db.new(new_customer)
        self.db.save()
        return new_customer

    def update_customer(self, customer: Customer, data: dict, ignore: list = None) -> Customer:
        """
        Update customer details
        Args:
            customer: The customer to update
            data: Dictionary containing fields to update
            ignore: List of fields to ignore during update
        Returns:
            Updated customer
        """
        if not customer:
            raise ValueError("Customer not found")

        if ignore is None:
            ignore = ['id', 'created_at', 'updated_at']

        # Check if email is being updated and if it already exists
        if 'email' in data and data['email'] != customer.email:
            existing = self.db.get_by_email(Customer, data['email'])
            if existing:
                raise ValueError("Email already in use")

        for key, value in data.items():
            if key not in ignore and hasattr(customer, key):
                setattr(customer, key, value)

        self.db.save()
        return customer

    def delete_customer(self, customer: Customer) -> None:
        """Delete a customer"""
        if not customer:
            raise ValueError("Customer not found")

        # Check if customer has any accounts or loans
        accounts = self.get_customer_accounts(customer)
        loans = self.get_customer_loans(customer)

        if accounts or loans:
            raise ValueError("Cannot delete customer with active accounts or loans")

        self.db.delete(customer)
        self.db.save()

    def get_customer_accounts(self, customer: Customer) -> List[Account]:
        """Get all accounts for a customer"""
        if not customer:
            raise ValueError("Customer not found")
        
        return self.db.get_accounts_by_customer(customer.id)

    def get_customer_loans(self, customer: Customer) -> List[Loan]:
        """Get all loans for a customer"""
        if not customer:
            raise ValueError("Customer not found")
        
        return self.db.get_loans_by_customer(customer.id)
