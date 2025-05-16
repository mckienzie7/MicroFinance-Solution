import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowPathIcon, 
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

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
    // Reset state on user change
    setLoans([]);
    setLoanForm({
      amount: '',
      term_months: '12',
      interest_rate: '5.0',
      purpose: ''
    });
    setError(null);
    setSuccessMessage('');
    
    if (isAuthenticated && user) {
      fetchLoans();
    }
  }, [isAuthenticated, user]);
  
  // Fetch loans from API
  const fetchLoans = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verify API is available
      try {
        await api.get('/loans');
      } catch (err) {
        console.error('API verification failed:', err);
        setError('Failed fetching loans endpoint.');
        setIsLoading(false);
        return;
      }
      
      // No /customers endpoint, use user object directly as customer
      const customer = user;
      if (!customer) {
        setError('User profile not found. Please update your profile first.');
        setIsLoading(false);
        return;
      }
      
      // Get all loans from the API
      const loansResponse = await api.get('/loans');
      const allLoans = loansResponse.data;

      console.log('Loans fetched successfully:', allLoans);

      // Filter loans for the current customer
      // The backend might not filter by customer_id, so we do it here
      const customerLoans = allLoans.filter(loan => loan.customer_id === customer.id);

      // Sort by date (newest first)
      customerLoans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setLoans(customerLoans);
    } catch (err) {
      console.error('Error fetching loans:', err);
      if (err.response) {
        // Handle specific HTTP error responses
        switch (err.response.status) {
          case 404:
            setError('API endpoint not found. Please ensure the backend server is properly configured.');
            break;
          case 401:
          case 403:
            setError('Authentication error. Please log in again.');
            break;
          case 500:
            setError('Server error. Please try again later.');
            break;
          default:
            setError(`Failed to load loans: ${err.response.data?.error || 'Unknown error'}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('Server not responding. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', err.message);
        setError('Network error. Please check your connection.');
      }
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
  
  // Validate form fields
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!loanForm.amount || parseFloat(loanForm.amount) <= 0) {
      errors.amount = 'Please enter a valid loan amount.';
      isValid = false;
    }

    if (!loanForm.term_months || parseInt(loanForm.term_months) <= 0) {
      errors.term_months = 'Please select a valid loan term.';
      isValid = false;
    }

    if (!loanForm.interest_rate || parseFloat(loanForm.interest_rate) <= 0) {
      errors.interest_rate = 'Please select a valid interest rate.';
      isValid = false;
    }

    if (!loanForm.purpose || loanForm.purpose.trim().length < 10) {
      errors.purpose = 'Please provide a detailed purpose for the loan (minimum 10 characters).';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    if (!loanForm.amount || !loanForm.interest_rate || !loanForm.term_months) {
      return 0;
    }

    const principal = parseFloat(loanForm.amount);
    const rate = parseFloat(loanForm.interest_rate) / 100 / 12;
    const months = parseInt(loanForm.term_months);

    return (principal * rate * Math.pow(1 + rate, months)) / 
           (Math.pow(1 + rate, months) - 1);
  };

  // Submit loan application
  const handleSubmitLoan = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // No /customers endpoint, use user object directly as customer
    const customer = user;
    if (!customer) {
      setError('User profile not found. Please update your profile first.');
      return;
    }
    
    // Debug log to see user object structure
    console.log('User object for loan application:', user);
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      // Format the loan application data according to backend requirements
      // Make sure field names match exactly what the backend expects
      
      // Use the authenticated user's ID for the loan application
      const customerId = user?.id;
      
      console.log('Customer ID for loan application:', customerId);
      
      if (!customerId) {
        setError('User ID not found. Please log out and log back in.');
        setIsLoading(false);
        return;
      }
      
      const loanData = {
        customer_id: customerId, // Use the actual user ID
        amount: parseFloat(loanForm.amount),
        // The API endpoint expects term_months
        term_months: parseInt(loanForm.term_months),
        interest_rate: parseFloat(loanForm.interest_rate),
        purpose: loanForm.purpose
      };
      
      console.log('Using customer_id from user profile:', customerId);
      console.log('Submitting loan application:', loanData);
      
      // Send loan application to the backend API
      const response = await api.post('/loans', loanData);
      
      console.log('Loan application submitted successfully:', response.data);
      
      // Reset form and show success message
      setLoanForm({
        amount: '',
        term_months: '12',
        interest_rate: '5.0',
        purpose: ''
      });
      
      setSuccessMessage('Loan application submitted successfully! Your application is now pending approval.');
      
      // Refresh loans to get the latest data including the new application
      fetchLoans();
    } catch (err) {
      console.error('Error submitting loan application:', err);
      if (err.response) {
        // Handle different error responses from the API
        if (err.response.status === 400) {
          setError(err.response.data?.error || 'Invalid loan application data. Please check all fields.');
        } else if (err.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else {
          setError(err.response.data?.error || 'Failed to submit loan application. Please try again.');
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        setError('Server not responding. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', err.message);
        setError('Network error. Please check your connection.');
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

  // Format amount with currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get loan status color
  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
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
          <CurrencyDollarIcon className="h-5 w-5 mr-2 mt-0.5" />
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
                Loan Amount ({formatCurrency(loanForm.amount)})
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
                        {formatCurrency(loan.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {loan.term_months} months
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(loan.loan_status)}`}>
                            {loan.loan_status || 'pending'}
                          </span>
                          <span className="text-gray-500 text-sm">{formatDate(loan.created_at)}</span>
                        </div>
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
                <span className="font-medium">{formatCurrency(selectedLoan.amount)}</span>
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
                <span className="font-medium">{formatCurrency(selectedLoan.monthly_payment || 
                  ((selectedLoan.amount * (selectedLoan.interest_rate / 100 / 12) * 
                    Math.pow(1 + (selectedLoan.interest_rate / 100 / 12), selectedLoan.term_months)) / 
                   (Math.pow(1 + (selectedLoan.interest_rate / 100 / 12), selectedLoan.term_months) - 1)))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Application Date:</span>
                <span className="font-medium">{formatDate(selectedLoan.created_at)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{formatDate(selectedLoan.end_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(selectedLoan.loan_status)}`}>
                  {selectedLoan.loan_status || 'pending'}
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
    </div>
  );
};

export default MyLoans;
