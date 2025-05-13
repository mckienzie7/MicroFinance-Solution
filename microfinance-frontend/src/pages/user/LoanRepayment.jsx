import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const LoanRepayment = () => {
  const { user, isAuthenticated } = useAuth();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    loan_id: '',
    amount: '',
    description: 'Loan repayment'
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  
  // Selected loan for payment
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // Fetch loans on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchLoans();
    }
  }, [isAuthenticated, user]);
  
  // Fetch loans from API
  const fetchLoans = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current user's customer ID
      const customersResponse = await api.get('/customers');
      const customers = customersResponse.data;
      const customer = customers.find(c => c.email === user.email);
      
      if (!customer) {
        setError('Customer profile not found. Please update your profile first.');
        return;
      }
      
      // Fetch all loans
      const loansResponse = await api.get('/loans');
      
      // Filter loans for the current customer that are approved (can be repaid)
      const activeLoans = loansResponse.data.filter(loan => 
        loan.customer_id === customer.id && 
        loan.status.toLowerCase() === 'approved'
      );
      
      // Sort by date (newest first)
      activeLoans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setLoans(activeLoans);
      
      // If there are loans, set the first one as selected by default
      if (activeLoans.length > 0) {
        setSelectedLoan(activeLoans[0]);
        setPaymentForm(prev => ({ ...prev, loan_id: activeLoans[0].id }));
      }
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError('Failed to load loans. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // If loan_id changes, update the selected loan
    if (name === 'loan_id') {
      const loan = loans.find(l => l.id === value);
      setSelectedLoan(loan || null);
    }
  };
  
  // Validate the payment form
  const validateForm = () => {
    const errors = {};
    
    if (!paymentForm.loan_id) {
      errors.loan_id = 'Please select a loan to repay';
    }
    
    if (!paymentForm.amount || isNaN(paymentForm.amount) || parseFloat(paymentForm.amount) <= 0) {
      errors.amount = 'Please enter a valid payment amount';
    } else if (selectedLoan && parseFloat(paymentForm.amount) > selectedLoan.remaining_balance) {
      errors.amount = `Payment amount cannot exceed the remaining balance of $${selectedLoan.remaining_balance}`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Submit loan payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      // Format the payment data
      const paymentData = {
        loan_id: paymentForm.loan_id,
        amount: parseFloat(paymentForm.amount),
        description: paymentForm.description || 'Loan repayment'
      };
      
      // Submit the payment to the API
      const response = await api.post('/repayments/make-payment', paymentData);
      
      // Update the UI to reflect the payment
      if (selectedLoan) {
        const updatedLoan = {
          ...selectedLoan,
          remaining_balance: Math.max(0, selectedLoan.remaining_balance - parseFloat(paymentForm.amount))
        };
        
        // Update the loans list
        setLoans(prev => prev.map(loan => 
          loan.id === updatedLoan.id ? updatedLoan : loan
        ));
        
        // Update the selected loan
        setSelectedLoan(updatedLoan);
      }
      
      // Reset form and show success message
      setPaymentForm(prev => ({ ...prev, amount: '' }));
      setSuccessMessage(`Payment of $${parseFloat(paymentForm.amount).toFixed(2)} successfully processed!`);
      
      // Refresh loans to ensure we have the latest data
      fetchLoans();
    } catch (err) {
      console.error('Error processing payment:', err);
      if (err.response?.data?.error) {
        setError(`Failed to process payment: ${err.response.data.error}`);
      } else {
        setError('Failed to process payment. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Calculate remaining balance for a loan
  const getRemainingBalance = (loan) => {
    return loan.remaining_balance !== undefined 
      ? loan.remaining_balance 
      : loan.amount - (loan.paid_amount || 0);
  };
  
  // Get status badge color based on loan status
  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Loan Repayment</h1>
        <button 
          className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          onClick={fetchLoans}
          disabled={isLoading}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
          <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5" />
          <p>{successMessage}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Make a Payment</h2>
          </div>
          <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
            <div>
              <label htmlFor="loan_id" className="block text-sm font-medium text-gray-700 mb-1">
                Select Loan
              </label>
              <select
                id="loan_id"
                name="loan_id"
                value={paymentForm.loan_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${formErrors.loan_id ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">-- Select a loan --</option>
                {loans.map(loan => (
                  <option key={loan.id} value={loan.id}>
                    ${parseFloat(loan.amount).toFixed(2)} - {loan.purpose.substring(0, 30)}{loan.purpose.length > 30 ? '...' : ''}
                  </option>
                ))}
              </select>
              {formErrors.loan_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.loan_id}</p>
              )}
            </div>
            
            {selectedLoan && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">Remaining Balance: <span className="font-medium">${getRemainingBalance(selectedLoan).toFixed(2)}</span></p>
                <p className="text-sm text-gray-600">Monthly Payment: <span className="font-medium">${parseFloat(selectedLoan.monthly_payment || 0).toFixed(2)}</span></p>
                <p className="text-sm text-gray-600">Due Date: <span className="font-medium">{formatDate(selectedLoan.due_date)}</span></p>
              </div>
            )}
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount ($)
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={paymentForm.amount}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${formErrors.amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter amount"
                min="1"
                step="0.01"
              />
              {formErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={paymentForm.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="E.g., Monthly payment"
              />
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || loans.length === 0}
                className="w-full px-4 py-3 text-center font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {isLoading ? 'Processing...' : 'Make Payment'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Active Loans List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Active Loans</h2>
          </div>
          
          {isLoading && loans.length === 0 ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : loans.length > 0 ? (
            <div className="overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.map((loan) => (
                    <tr key={loan.id} className={`hover:bg-gray-50 ${selectedLoan?.id === loan.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(loan.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${parseFloat(loan.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${getRemainingBalance(loan).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(loan.status)}`}>
                          {loan.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => {
                            setSelectedLoan(loan);
                            setPaymentForm(prev => ({ ...prev, loan_id: loan.id }));
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Select for Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <div className="flex flex-col items-center justify-center py-5">
                <CreditCardIcon className="h-12 w-12 text-gray-300 mb-3" />
                <p>No active loans found.</p>
                <p className="text-sm mt-1">Apply for a loan in the My Loans section.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Payment History</h2>
        </div>
        
        <div className="p-6 text-center text-gray-500">
          <div className="flex flex-col items-center justify-center py-5">
            <ClockIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p>Payment history will be displayed here.</p>
            <p className="text-sm mt-1">Make a payment to see it in your history.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanRepayment;
