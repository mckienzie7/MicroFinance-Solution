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
  
  // Admin list state
  const [admins, setAdmins] = useState([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  const [loanForm, setLoanForm] = useState({
    amount: '',
    term_months: '12',
    interest_rate: '5.0',
    purpose: '',
    admin_id: ''
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  
  // Selected loan for details view
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // Fetch admins on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAdmins();
    }
  }, [isAuthenticated, user]);

  // Fetch admins from API
  const fetchAdmins = async () => {
    setIsLoadingAdmins(true);
    try {
      const response = await api.get('/api/v1/users/admins');
      setAdmins(response.data);
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError('Failed to load admin list. Please try again later.');
    } finally {
      setIsLoadingAdmins(false);
    }
  };
  
  // Fetch loans on component mount
  useEffect(() => {
    // Reset state on user change
    setLoans([]);
    setLoanForm({
      amount: '',
      term_months: '12',
      interest_rate: '5.0',
      purpose: '',
      admin_id: ''
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
      // First, fetch the user's account
      console.log('Fetching user account for user ID:', user.id);
      const accountsResponse = await api.get('/api/v1/accounts/me');
      const userAccounts = accountsResponse.data;
      console.log('User accounts:', userAccounts);

      if (!userAccounts || userAccounts.length === 0) {
        setError('No account found. Please create an account first.');
        return;
      }

      // Get the first account (assuming one user has one account)
      const userAccount = userAccounts[0];
      console.log('Using account:', userAccount);

      // Now fetch all loans
      const loansResponse = await api.get('/api/v1/loans');
      const allLoans = loansResponse.data;
      console.log('All loans:', allLoans);

      // Filter loans for the user's account
      const userLoans = allLoans.filter(loan => {
        console.log('Checking loan:', loan);
        return loan.account_id === userAccount.id;
      });
      
      console.log('Filtered user loans:', userLoans);
      
      // Sort by date (newest first)
      userLoans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setLoans(userLoans);
    } catch (err) {
      console.error('Error fetching loans:', err);
      if (err.response) {
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
        setError('Server not responding. Please try again later.');
      } else {
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

    if (!loanForm.admin_id) {
      errors.admin_id = 'Please select an admin to process your loan.';
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
    
    if (!user) {
      setError('User profile not found. Please update your profile first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Debug log to see user object
      console.log('User object:', user);
      console.log('User ID:', user.id);
      
      if (!user.id) {
        setError('User ID not found. Please log out and log in again.');
        return;
      }
      
      const loanData = {
        user_id: user.id,
        amount: parseFloat(loanForm.amount),
        interest_rate: parseFloat(loanForm.interest_rate),
        repayment_period: parseInt(loanForm.term_months),
        purpose: loanForm.purpose,
        admin_id: loanForm.admin_id
      };
      
      // Debug log to see request data
      console.log('Sending loan data:', loanData);
      
      const response = await api.post('/api/v1/loans', loanData);
      
      setSuccessMessage('Loan application submitted successfully!');
      setLoanForm({
        amount: '',
        term_months: '12',
        interest_rate: '5.0',
        purpose: '',
        admin_id: ''
      });
      
      // Refresh loans list
      fetchLoans();
    } catch (err) {
      console.error('Error submitting loan:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
        setError(err.response.data?.error || 'Failed to submit loan application');
      } else {
        setError('Network error. Please try again later.');
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Loans</h1>
      
      {/* Loan Application Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Apply for a Loan</h2>
        
        <form onSubmit={handleSubmitLoan} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Loan Amount</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="amount"
                  value={loanForm.amount}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter amount"
                />
              </div>
              {formErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Select Admin</label>
              <select
                name="admin_id"
                value={loanForm.admin_id}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              >
                <option value="">Select an admin</option>
                {admins.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.fullname || admin.username}
                  </option>
                ))}
              </select>
              {formErrors.admin_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.admin_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Loan Term (months)</label>
              <select
                name="term_months"
                value={loanForm.term_months}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
              >
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
                <option value="48">48 months</option>
                <option value="60">60 months</option>
              </select>
              {formErrors.term_months && (
                <p className="mt-1 text-sm text-red-600">{formErrors.term_months}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
              <input
                type="number"
                name="interest_rate"
                value={loanForm.interest_rate}
                onChange={handleInputChange}
                step="0.1"
                className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {formErrors.interest_rate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.interest_rate}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Loan Purpose</label>
            <textarea
              name="purpose"
              value={loanForm.purpose}
              onChange={handleInputChange}
              rows="3"
              className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe the purpose of your loan"
            />
            {formErrors.purpose && (
              <p className="mt-1 text-sm text-red-600">{formErrors.purpose}</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Monthly Payment Estimate</h3>
            <p className="text-2xl font-bold text-indigo-600">
              ${calculateMonthlyPayment().toFixed(2)}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loans List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">My Loan Applications</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <ArrowPathIcon className="animate-spin h-8 w-8 text-indigo-600" />
          </div>
        ) : loans.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No loan applications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map(loan => (
                  <tr key={loan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${loan.amount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{loan.purpose}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        loan.loan_status === 'approved' ? 'bg-green-100 text-green-800' :
                        loan.loan_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {loan.loan_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(loan.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedLoan(loan)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Loan Details</h3>
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
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                <p className="mt-1 text-lg font-semibold">${selectedLoan.amount}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Purpose</h4>
                <p className="mt-1">{selectedLoan.purpose}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="mt-1">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedLoan.loan_status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedLoan.loan_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedLoan.loan_status}
                  </span>
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Applied Date</h4>
                <p className="mt-1">{new Date(selectedLoan.created_at).toLocaleDateString()}</p>
              </div>
              
              {selectedLoan.rejection_reason && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Rejection Reason</h4>
                  <p className="mt-1 text-red-600">{selectedLoan.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLoans;
