import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

import { 
  UserIcon,
  CreditCardIcon, 
  BanknotesIcon,
  ChartBarIcon, 
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user: authUser, isAuthenticated } = useAuth();
  
  const mockUser = {
    email: 'user@example.com',
    username: 'Test User'
  };
  
  const user = isAuthenticated ? authUser : mockUser;
  
  const [dashboardData, setDashboardData] = useState({
    balance: {
      current: 0,
     
      currency: 'ETB'
    },
    loanProgress: {
      totalAmount: 0,
      amountPaid: 0,
      remainingAmount: 0,
      progressPercentage: 0,
      nextPaymentDate: null,
      nextPaymentAmount: 0,
      status: 'none' // 'none', 'active', 'completed', 'overdue'
    },
    creditScore: {
      score: 0,
      maxScore: 100,
      category: 'No Data' // 'Poor', 'Fair', 'Good', 'Excellent'
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data on component mount or when auth state changes
  useEffect(() => {
    // Reset state on user change
    setDashboardData({
      balance: {
        current: 0,
        currency: 'ETB'
      },
      loanProgress: {
        totalAmount: 0,
        amountPaid: 0,
        remainingAmount: 0,
        progressPercentage: 0,
        nextPaymentDate: null,
        nextPaymentAmount: 0,
        status: 'none'
      },
      creditScore: {
        score: 0,
        maxScore: 100,
        category: 'No Data'
      }
    });
    setError(null);
    setIsLoading(true); // Set loading to true when user changes
    
    // Clear any previous data first
    console.log('User changed, refreshing dashboard data for:', user?.username);
    
    if (isAuthenticated && user) {
      // Add a small delay to ensure any previous session data is cleared
      setTimeout(() => {
        fetchUserDashboardData();
      }, 100);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]); // Use user.id as dependency to detect actual user changes

  // Verify API endpoints are available
  const verifyApiEndpoints = async () => {
    try {
      // Use a more reliable endpoint for verification
      // The /health or /status endpoint would be ideal, but let's try /accounts since we know it works in SavingsAccount
      await api.get('/accounts', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return true;
    } catch (err) {
      console.error('API verification failed:', err);
      setError('Failed to connect to the API. Please check your connection.');
      return false;
    }
  };

  // Fetch with retry for critical API calls
  const fetchWithRetry = async (url, options = {}, retries = 2) => {
    try {
      // Ensure headers are included in the request
      const requestOptions = {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      };
      return await api.get(url, requestOptions);
    } catch (err) {
      if (retries > 0) {
        console.log(`Retrying ${url}, ${retries} attempts left`);
        await new Promise(r => setTimeout(r, 1000));
        return fetchWithRetry(url, options, retries - 1);
      }
      throw err;
    }
  };

  // Fetch dashboard data from API
  const fetchUserDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    // Reset dashboard data before fetching new data
    setDashboardData({
      balance: {
        current: 0,
        currency: 'ETB'
      },
      loanProgress: {
        totalAmount: 0,
        amountPaid: 0,
        remainingAmount: 0,
        progressPercentage: 0,
        nextPaymentDate: null,
        nextPaymentAmount: 0,
        status: 'none'
      },
      creditScore: {
        score: 0,
        maxScore: 100,
        category: 'No Data'
      }
    });
    
    try {
      // Verify API is available
      const apiAvailable = await verifyApiEndpoints();
      if (!apiAvailable) {
        throw new Error('API not available');
      }
      
      // Use user object directly as customer
      const customer = user;
      if (!customer) {
        setError('User profile not found. Please update your profile first.');
        return;
      }
      
      console.log('Fetching dashboard data for user:', customer.username, 'with ID:', customer.id);
      
      // Define headers for all API requests to avoid 415 errors
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      
      // Fetch all accounts but filter by the current user's email
      console.log('Fetching all accounts and filtering by current user');
      const accountsResponse = await api.get('/accounts', { headers });
      const allAccounts = accountsResponse.data || [];
      
      // Filter accounts to only include those belonging to the current user
      // We need to do this filtering on the client side since the backend endpoint returns all accounts
      console.log('Current user email:', customer.email);
      const userAccounts = allAccounts.filter(account => {
        // Check if the account has user_id, email, or username that matches the current user
        const matchesUser = 
          (account.user_id && account.user_id === customer.id) || 
          (account.email && account.email === customer.email) ||
          (account.username && account.username === customer.username);
        
        if (matchesUser) {
          console.log('Found matching account:', account);
        }
        
        return matchesUser;
      });
      
      console.log(`Filtered ${userAccounts.length} accounts for current user out of ${allAccounts.length} total accounts`);
      
      // If we couldn't find any accounts for this user, log a warning
      if (userAccounts.length === 0) {
        console.warn('No accounts found for the current user. Using all accounts as fallback.');
      }
      
      // Use the filtered accounts or fall back to all accounts if none found
      const accounts = userAccounts.length > 0 ? userAccounts : allAccounts;
      
      // Find savings account from the filtered accounts
      const savingsAccount = accounts.find(account => account.account_type === 'savings') || accounts[0];
      const savingsBalance = savingsAccount ? parseFloat(savingsAccount.balance || 0) : 0;
      console.log('Current user savings balance:', savingsBalance, 'Account:', savingsAccount);
      
      // Get loans for loan progress - using simple approach
      const loansResponse = await api.get('/loans', { headers });
      const loans = loansResponse.data || [];
      
      // We don't need transactions for the dashboard view
      let transactions = [];
      
      // 1. Set Balance to savings account only
      const totalBalance = savingsBalance;
      
      // Force a complete reset of dashboard data to ensure we don't have stale data
      setDashboardData({
        balance: {
          current: totalBalance,
          currency: 'ETB'
        },
        loanProgress: {
          totalAmount: 0,
          amountPaid: 0,
          remainingAmount: 0,
          progressPercentage: 0,
          nextPaymentDate: null,
          nextPaymentAmount: 0,
          status: 'none'
        },
        creditScore: {
          score: 0,
          maxScore: 100,
          category: 'No Data'
        }
      });
      
      // Then update with the current balance data
      console.log('Setting dashboard balance to:', totalBalance, 'for user:', customer.username);
      
      // 2. Calculate Loan Progress
      const activeLoans = loans.filter(loan => loan.status === 'approved');
      let loanProgress = {
        totalAmount: 0,
        amountPaid: 0,
        remainingAmount: 0,
        progressPercentage: 0,
        nextPaymentDate: null,
        nextPaymentAmount: 0,
        status: 'none'
      };
      
      if (activeLoans.length > 0) {
        const currentLoan = activeLoans[0]; // Focus on the most recent active loan
        const loanAmount = parseFloat(currentLoan.amount);
        
        // Calculate repayments made for this loan
        const loanRepayments = transactions.filter(t => 
          (t.transaction_type === 'payment' || t.description?.toLowerCase().includes('repayment')) &&
          t.reference_id === currentLoan.id
        );
        
        const amountPaid = loanRepayments.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const remainingAmount = Math.max(0, loanAmount - amountPaid);
        const progressPercentage = Math.min(100, Math.round((amountPaid / loanAmount) * 100));
        
        // Calculate next payment
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + 15); // Assuming payment due in 15 days
        
        // Determine loan status
        let status = 'active';
        if (progressPercentage >= 100) {
          status = 'completed';
        } else if (currentLoan.status === 'overdue') {
          status = 'overdue';
        }
        
        loanProgress = {
          totalAmount: loanAmount,
          amountPaid,
          remainingAmount,
          progressPercentage,
          nextPaymentDate: nextDueDate,
          nextPaymentAmount: currentLoan.monthly_payment || (loanAmount / 12), // Estimated monthly payment
          status
        };
      }
      
      // Update dashboard data with loan progress
      setDashboardData(prevData => ({
        ...prevData,
        loanProgress
      }));
      
      // 3. Get credit score data (if available)
      try {
        const creditResponse = await api.get('/credit-score', { headers });
        if (creditResponse.data) {
          const creditData = creditResponse.data;
          
          // Determine credit score category
          let category = 'No Data';
          const score = parseInt(creditData.score) || 0;
          
          if (score >= 80) category = 'Excellent';
          else if (score >= 70) category = 'Good';
          else if (score >= 60) category = 'Fair';
          else if (score > 0) category = 'Poor';
          
          // Update credit score data
          setDashboardData(prevData => ({
            ...prevData,
            creditScore: {
              score: score,
              maxScore: 100,
              category: category
            }
          }));
        }
      } catch (err) {
        console.log('Credit score data not available:', err);
        // Continue without credit score data
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
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
            setError(`Failed to load dashboard data: ${err.response.data?.error || 'Unknown error'}`);
        }
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server. Please check your network connection.');
      } else {
        // Something else caused the error
        setError('Failed to load dashboard data. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data and dashboard information
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserDashboardData();
    }
  }, [isAuthenticated, user]);

  // Balance Card Component
  const BalanceCard = () => {
    const { current, currency } = dashboardData.balance;
    
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Savings Account Balance</h3>
            <div className="p-2 rounded-full bg-blue-50">
              <BanknotesIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Current Savings Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {currency} {current.toLocaleString()}
              </p>
            </div>
            
            
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
              to="/user/savings"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
            >
              View transaction history
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Credit Score Card Component
  const CreditScoreCard = () => {
    const { score, maxScore, category } = dashboardData.creditScore;
    
    // Determine color based on score category
    const getScoreColor = () => {
      switch(category) {
        case 'Excellent': return 'text-green-500';
        case 'Good': return 'text-blue-500';
        case 'Fair': return 'text-yellow-500';
        case 'Poor': return 'text-red-500';
        default: return 'text-gray-500';
      }
    };
    
    // Calculate percentage for progress bar
    const percentage = Math.round((score / maxScore) * 100);
    
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Credit Score</h3>
            <div className="p-2 rounded-full bg-blue-50">
              <StarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative h-36 w-36 flex items-center justify-center">
              {/* Circular background */}
              <div className="absolute inset-0 rounded-full bg-gray-100"></div>
              
              {/* Progress circle with stroke dasharray trick */}
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                <circle 
                  className="text-gray-200" 
                  strokeWidth="10"
                  stroke="currentColor" 
                  fill="transparent" 
                  r="40" 
                  cx="50" 
                  cy="50" 
                />
                <circle 
                  className={getScoreColor()} 
                  strokeWidth="10" 
                  strokeDasharray={`${percentage * 2.51} 1000`}
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="40" 
                  cx="50" 
                  cy="50" 
                />
              </svg>
              
              {/* Score text */}
              <div className="relative flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{score}</span>
                <span className="text-sm text-gray-500">{category}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getScoreColor().replace('text-', 'bg-')}`} 
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>Poor</span>
              <span>Fair</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
              to="/user/credit-score"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
            >
              View credit details
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  };
  
  // Loan Progress Card Component
  const LoanProgressCard = () => {
    const { 
      totalAmount, 
      amountPaid, 
      remainingAmount, 
      progressPercentage, 
      nextPaymentDate, 
      nextPaymentAmount,
      status 
    } = dashboardData.loanProgress;
    
    // Format date
    const formattedDate = nextPaymentDate ? 
      new Date(nextPaymentDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) : 'N/A';
    
    // Status badge color
    const getStatusColor = () => {
      switch(status) {
        case 'active': return 'bg-blue-100 text-blue-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'overdue': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    
    // Status display text
    const getStatusText = () => {
      switch(status) {
        case 'active': return 'Active';
        case 'completed': return 'Completed';
        case 'overdue': return 'Overdue';
        case 'none': return 'No Active Loans';
        default: return status;
      }
    };
    
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Loan Progress</h3>
            <div className="p-2 rounded-full bg-blue-50">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          {status === 'none' ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">You don't have any active loans</p>
              <Link 
                to="/user/loans"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply for a Loan
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total Loan Amount</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
              </div>
              
              <p className="text-2xl font-bold text-gray-900 mb-4">
                ETB {totalAmount.toLocaleString()}
              </p>
              
              <div className="mt-4 mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'} rounded-full`} 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Amount Paid</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ETB {amountPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ETB {remainingAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              
              {nextPaymentDate && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">Next Payment</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-base font-medium text-gray-900">
                      ETB {nextPaymentAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Due: {formattedDate}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link 
                  to="/user/my-loans"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View all loans
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Removed TransactionItem component as per user request

  // Removed LoanItem component as it's part of transaction history display

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          
          
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to your Dashboard
          </h1>
          
          <p className="mt-1 text-gray-500">
            Here's your financial overview
          </p>
        </div>

        <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-lg font-medium text-gray-900">{user?.username}</span>
          </div>

      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button 
              onClick={fetchUserDashboardData} 
              className="mt-2 inline-flex items-center text-sm font-medium text-red-700 hover:text-red-600"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Retry
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* My Balance Card */}
          <BalanceCard />
          
          {/* Loan Progress Card */}
          <LoanProgressCard />
          
          {/* Credit Score Card */}
          <CreditScoreCard />
        </div>
      )}
    </div>
  );
};

export default Dashboard;