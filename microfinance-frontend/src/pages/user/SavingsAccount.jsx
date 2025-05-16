import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
  BanknotesIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const SavingsAccount = () => {
  const { user, isAuthenticated } = useAuth();
  const [accountData, setAccountData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Deposit form state
  const [depositForm, setDepositForm] = useState({
    amount: '',
    description: 'Savings deposit',
    account_id: ''
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  
  // Fetch account data on component mount
  useEffect(() => {
    // Reset state on user change
    setAccountData(null);
    setTransactions([]);
    setDepositForm({ amount: '', description: 'Savings deposit', account_id: '' });
    setError(null);
    setSuccessMessage('');
    if (isAuthenticated && user) {
      fetchAccountData();
    }
  }, [isAuthenticated, user]);
  
  // Verify API endpoints are available
  const verifyApiEndpoints = async () => {
    try {
      await api.get('/accounts/me');
      return true;
    } catch (err) {
      console.error('API verification failed:', err);
      setError('Failed fetching accounts endpoint.');
      return false;
    }
  };

  // Fetch with retry for critical API calls
  const fetchWithRetry = async (url, options = {}, retries = 2) => {
    try {
      return await api.get(url, options);
    } catch (err) {
      if (retries > 0) {
        console.log(`Retrying ${url}, ${retries} attempts left`);
        await new Promise(r => setTimeout(r, 1000));
        return fetchWithRetry(url, options, retries - 1);
      }
      throw err;
    }
  };

  // Fetch account data and transaction history from API
  const fetchAccountData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verify API is available
      const apiAvailable = await verifyApiEndpoints();
      if (!apiAvailable) {
        return;
      }
      
      // No /customers endpoint, use user object directly as customer
      const customer = user;
      if (!customer) {
        setError('User profile not found. Please update your profile first.');
        return;
      }
      
      // Get user's accounts using the /accounts/me endpoint
      const accountsResponse = await api.get('/accounts/me', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      const userAccounts = accountsResponse.data || [];
      
      if (!userAccounts || userAccounts.length === 0) {
        setError('No savings accounts found for your profile.');
        return;
      }
      
      // Find savings account from the user's accounts
      const savingsAccount = userAccounts.find(a => a.account_type === 'savings') || userAccounts[0];
      console.log('Using savings account:', savingsAccount);
      setAccountData(savingsAccount);
      setDepositForm(prev => ({ ...prev, account_id: savingsAccount.id }));
      
      // Get transactions
      await fetchTransactionHistory(savingsAccount.id);
      
    } catch (err) {
      console.error('Error fetching account data:', err);
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
            setError(`Failed to load account data: ${err.response.data?.error || 'Unknown error'}`);
        }
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server. Please check your network connection.');
      } else {
        // Something else caused the error
        setError('Failed to load account data. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactionHistory = async (accountId) => {
    if (!accountId) return;
    
    try {
      const transactionsResponse = await api.get(`/transactions/account/${accountId}`);
      const transactions = transactionsResponse.data;
      
      if (!transactions || transactions.length === 0) {
        console.log('No transactions found for account', accountId);
        setTransactions([]);
        return;
      }
      
      // Filter for deposit/savings transactions
      const savingsTransactions = transactions.filter(t => 
        t.transaction_type === 'deposit' || 
        (t.description && t.description.toLowerCase().includes('saving'))
      );
      
      // Sort by date (newest first)
      savingsTransactions.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setTransactions(savingsTransactions);
      
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      // Don't show error for transactions to avoid disrupting the main account view
      // Just set empty transactions array
      setTransactions([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDepositForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!depositForm.amount || isNaN(depositForm.amount) || parseFloat(depositForm.amount) <= 0) {
      errors.amount = 'Please enter a valid deposit amount';
    }
    
    if (!depositForm.account_id) {
      errors.account_id = 'Account ID is required. Please refresh the page.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    setFormErrors({});
    
    try {
      // Make deposit to backend
      await api.post(`/accounts/${depositForm.account_id}/deposit`, {
        amount: parseFloat(depositForm.amount)
      });
      setSuccessMessage('Deposit successful! Your savings have been updated.');
      setDepositForm(prev => ({ ...prev, amount: '', description: 'Savings deposit' }));
      // Refresh account data to get new balance
      fetchAccountData();
    } catch (err) {
      console.error('Error processing deposit:', err);
      if (err.response) {
        switch (err.response.status) {
          case 400:
            setError(`Invalid deposit request: ${err.response.data?.error || 'Please check your input.'}`);
            break;
          case 401:
          case 403:
            setError('Authentication error. Please log in again.');
            break;
          case 404:
            setError('Account not found. Please contact support.');
            break;
          case 500:
            setError('Server error processing your deposit. Please try again later.');
            break;
          default:
            setError(`Failed to process deposit: ${err.response.data?.error || 'Unknown error'}`);
        }
      } else if (err.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('Failed to process deposit. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Savings Account</h1>
        <button 
          className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          onClick={fetchAccountData}
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
      
      {/* Savings Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white/90">Current Savings Balance</h3>
              <div className="mt-2 flex items-center">
                <span className="text-4xl font-bold text-white">
                  ${isLoading ? '—' : accountData ? parseFloat(accountData.balance || 0).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-white/10">
              <BanknotesIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          {accountData && (
            <div className="mt-4 flex items-center justify-between text-white/80 text-sm">
              <div>
                <span className="block">Account Number</span>
                <span className="font-medium">{accountData.account_number || 'N/A'}</span>
              </div>
              <div>
                <span className="block">Interest Rate</span>
                <span className="font-medium">{accountData.interest_rate || '2.5'}%</span>
              </div>
              <div>
                <span className="block">Status</span>
                <span className="px-2 py-1 text-xs rounded-full bg-white/20">
                  {accountData.status || 'Active'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deposit Form */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
  <div className="p-6 border-b border-gray-200">
    <h2 className="text-lg font-semibold text-gray-900">Make a Deposit</h2>
  </div>

  <form onSubmit={handleSubmitDeposit} className="space-y-4 p-6">
    {/* Amount */}
    <div>
      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
        Deposit Amount
      </label>
      <input
        type="number"
        name="amount"
        id="amount"
        value={depositForm.amount}
        onChange={handleInputChange}
        className={`w-full mt-1 px-3 py-2 border ${formErrors.amount ? 'border-red-400' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        placeholder="Enter deposit amount"
        min="1"
        step="0.01"
        autoComplete="off"
        aria-invalid={!!formErrors.amount}
        aria-describedby={formErrors.amount ? "amount-error" : undefined}
      />
      {formErrors.amount && (
        <p id="amount-error" className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
      )}
    </div>

    {/* Description */}
    <div>
      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
        Description
      </label>
      <input
        type="text"
        name="description"
        id="description"
        value={depositForm.description}
        onChange={handleInputChange}
        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="E.g., January savings"
        autoComplete="off"
      />
    </div>

    {/* Submit */}
    <div className="pt-4">
      <button
        type="submit"
        disabled={isLoading || !depositForm.account_id}
        className="w-full px-4 py-3 text-center font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-blue-300"
      >
        {isLoading ? 'Processing...' : 'Make Deposit'}
      </button>
    </div>
  </form>
</div>

        
       


{/* Transaction History */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Savings Transactions</h2>
          </div>
          
          {isLoading ? (
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
          ) : transactions.length > 0 ? (
            <div className="overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.description || 'Savings deposit'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${parseFloat(transaction.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {transaction.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <div className="flex flex-col items-center justify-center py-5">
                <ClockIcon className="h-12 w-12 text-gray-300 mb-3" />
                <p>No savings transactions found.</p>
                <p className="text-sm mt-1">Make your first deposit to get started!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavingsAccount;