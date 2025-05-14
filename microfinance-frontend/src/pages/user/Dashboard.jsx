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

  // Verify API endpoints are available
  const verifyApiEndpoints = async () => {
    try {
      await api.get('/api/v1');
      return true;
    } catch (err) {
      console.error('API verification failed:', err);
      setError('Failed fetching data');
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

  // Fetch dashboard data from API
  const fetchUserDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Verify API is available
      const apiAvailable = await verifyApiEndpoints();
      if (!apiAvailable) {
        throw new Error('API not available');
      }
      
      // Get customer ID
      const customersResponse = await fetchWithRetry('/customers');
      const customers = customersResponse.data;
      const customer = customers.find(c => c.email === user.email);
      
      if (!customer) {
        setError('Customer profile not found. Please update your profile first.');
        throw new Error('Customer profile not found');
      }
      
      // Get accounts for balance
      const accountsResponse = await api.get(`/customers/${customer.id}/accounts`);
      const accounts = accountsResponse.data || [];
      
      // Get loans for loan progress
      const loansResponse = await api.get(`/customers/${customer.id}/loans`);
      const loans = loansResponse.data || [];
      
      // Get transactions for payment history
      let transactions = [];
      if (accounts.length > 0) {
        const accountIds = accounts.map(account => account.id);
        const transactionPromises = accountIds.map(accountId => 
          api.get(`/transactions/account/${accountId}`)
            .then(res => res.data || [])
            .catch(err => {
              console.error(`Error fetching transactions for account ${accountId}:`, err);
              return [];
            })
        );
        
        const transactionResults = await Promise.all(transactionPromises);
        transactions = transactionResults.flat();
      }
      
      // 1. Calculate Balance
      const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance || 0), 0);
     
      
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
      
      // Set default stats in case of error
      setStats({
        activeLoans: 0,
        pendingApplications: 0,
        totalRepaid: 0,
        nextPayment: null,
        recentTransactions: [],
        loanHistory: [],
        creditScore: 75
      });
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
    const { current, available, currency } = dashboardData.balance;
    
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">My Balance</h3>
            <div className="p-2 rounded-full bg-blue-50">
              <BanknotesIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {currency} {current.toLocaleString()}
              </p>
            </div>
            
            
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
              to="/user/transactions"
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
                to="/user/apply-loan"
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
            </>
          )}
        </div>
      </div>
    );
  };

  const TransactionItem = ({ transaction }) => (
    <li className="py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome to your microfinance dashboard
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCardIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{transaction.type}</p>
          <p className="text-sm text-gray-500">{transaction.date}</p>
        </div>
        <div className="flex items-center space-x-4">
          <p className="font-medium text-gray-900">${transaction.amount}</p>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            transaction.status === 'Completed' 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            {transaction.status}
          </span>
        </div>
      </div>
    </li>
  );

  const LoanItem = ({ loan }) => (
    <li className="py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Loan #{loan.id}</p>
            <p className="text-sm text-gray-500">${loan.amount.toLocaleString()} • {loan.startDate}</p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            loan.status === 'Active' 
              ? 'bg-blue-100 text-blue-800' 
              : loan.status === 'Pending'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {loan.status}
          </span>
        </div>
        
        {loan.status === 'Active' && (
          <div className="pt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{loan.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${loan.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </li>
  );

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