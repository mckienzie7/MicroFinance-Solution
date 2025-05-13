<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const MyLoans = () => {
  const { user, isAuthenticated } = useAuth();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Loan application form state
  const [loanForm, setLoanForm] = useState({
    amount: '',
    term_months: '12',
    interest_rate: '5.0',
    purpose: ''
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  
  // Selected loan for details view
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
      
      // Filter loans for the current customer
      const customerLoans = loansResponse.data.filter(loan => loan.customer_id === customer.id);
      
      // Sort by date (newest first)
      customerLoans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setLoans(customerLoans);
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
    setLoanForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Validate the loan application form
  const validateForm = () => {
    const errors = {};
    
    if (!loanForm.amount || isNaN(loanForm.amount) || parseFloat(loanForm.amount) < 100) {
      errors.amount = 'Please enter a valid loan amount (minimum $100)';
    }
    
    if (!loanForm.term_months) {
      errors.term_months = 'Please select a loan term';
    }
    
    if (!loanForm.purpose.trim()) {
      errors.purpose = 'Please provide a purpose for the loan';
    } else if (loanForm.purpose.trim().length < 10) {
      errors.purpose = 'Please provide a more detailed purpose (at least 10 characters)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Calculate monthly payment for the loan
  const calculateMonthlyPayment = () => {
    const principal = parseFloat(loanForm.amount) || 0;
    const interestRate = parseFloat(loanForm.interest_rate) / 100 / 12; // Monthly interest rate
    const termMonths = parseInt(loanForm.term_months) || 1;
    
    if (principal <= 0 || termMonths <= 0) return '0.00';
    
    // Monthly payment formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
    const payment = principal * interestRate * Math.pow(1 + interestRate, termMonths) / 
                   (Math.pow(1 + interestRate, termMonths) - 1);
    
    return payment.toFixed(2);
  };
  
  // Submit loan application
  const handleSubmitLoan = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      // Get customer ID
      const customersResponse = await api.get('/customers');
      const customers = customersResponse.data;
      const customer = customers.find(c => c.email === user.email);
      
      if (!customer) {
        setError('Customer profile not found. Please update your profile first.');
        return;
      }
      
      // Format the loan application data according to backend requirements
      const loanData = {
        customer_id: customer.id,
        amount: parseFloat(loanForm.amount),
        term_months: parseInt(loanForm.term_months),
        interest_rate: parseFloat(loanForm.interest_rate),
        purpose: loanForm.purpose
        // Note: Status is handled by the backend and defaults to 'pending'
      };
      
      // Submit the loan application to the backend API
      const response = await api.post('/loans', loanData);
      
      // Add the new loan to the list
      const newLoan = response.data;
      setLoans(prev => [newLoan, ...prev]);
      
      // Reset form and show success message
      setLoanForm({
        amount: '',
        term_months: '12',
        interest_rate: '5.0',
        purpose: ''
      });
      
      setSuccessMessage('Loan application submitted successfully! We will review your application shortly.');
      
      // Refresh loans to ensure we have the latest data
      fetchLoans();
    } catch (err) {
      console.error('Error submitting loan application:', err);
      if (err.response?.data?.error) {
        setError(`Failed to submit loan application: ${err.response.data.error}`);
      } else {
        setError('Failed to submit loan application. Please try again later.');
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
  
  // Get status badge color based on loan status
  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Loans</h1>
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
        {/* Loan Application Form */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Apply for a Loan</h2>
          </div>
          <form onSubmit={handleSubmitLoan} className="p-6 space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount ($)
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={loanForm.amount}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${formErrors.amount ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter amount"
                min="100"
                step="100"
              />
              {formErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="term_months" className="block text-sm font-medium text-gray-700 mb-1">
                Loan Term
              </label>
              <select
                id="term_months"
                name="term_months"
                value={loanForm.term_months}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border ${formErrors.term_months ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
              </select>
              {formErrors.term_months && (
                <p className="mt-1 text-sm text-red-600">{formErrors.term_months}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="interest_rate" className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (%)
              </label>
              <select
                id="interest_rate"
                name="interest_rate"
                value={loanForm.interest_rate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="5.0">5.0% - Standard</option>
                <option value="3.5">3.5% - Good Credit</option>
                <option value="7.5">7.5% - Higher Risk</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Monthly Payment
              </label>
              <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md">
                <span className="font-medium">${calculateMonthlyPayment()}</span>
              </div>
            </div>
            
            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
                Loan Purpose
              </label>
              <textarea
                id="purpose"
                name="purpose"
                value={loanForm.purpose}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 border ${formErrors.purpose ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Briefly describe why you need this loan"
              ></textarea>
              {formErrors.purpose && (
                <p className="mt-1 text-sm text-red-600">{formErrors.purpose}</p>
              )}
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 text-center font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {isLoading ? 'Processing...' : 'Submit Loan Application'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Loans List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">My Loan Applications</h2>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(loan.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${parseFloat(loan.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {loan.term_months} months
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(loan.status)}`}>
                          {loan.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => setSelectedLoan(loan)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Details
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
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mb-3" />
                <p>No loan applications found.</p>
                <p className="text-sm mt-1">Apply for a loan to get started!</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Loan Details</h3>
              <button 
                onClick={() => setSelectedLoan(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Loan ID:</span>
                <span className="font-medium">{selectedLoan.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${parseFloat(selectedLoan.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Interest Rate:</span>
                <span className="font-medium">{selectedLoan.interest_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Term:</span>
                <span className="font-medium">{selectedLoan.term_months} months</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Payment:</span>
                <span className="font-medium">${selectedLoan.monthly_payment || calculateMonthlyPayment()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Application Date:</span>
                <span className="font-medium">{formatDate(selectedLoan.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{formatDate(selectedLoan.due_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(selectedLoan.status)}`}>
                  {selectedLoan.status || 'pending'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 block mb-1">Purpose:</span>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedLoan.purpose}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedLoan(null)}
                className="w-full px-4 py-2 text-center font-medium rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
=======
import React from 'react';

const MyLoans = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">My Loans</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">View your current and past loans here:</p>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Loan data will be populated here */}
            </tbody>
          </table>
        </div>
      </div>
>>>>>>> fe9065b2613f79ba306bfc2c56c524e65b6e6fd0
    </div>
  );
};

export default MyLoans;
