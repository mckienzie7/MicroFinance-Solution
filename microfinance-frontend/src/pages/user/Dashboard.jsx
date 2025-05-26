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
  ExclamationTriangleIcon,
  BellIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
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
      status: 'none', // 'none', 'active', 'completed', 'overdue'
      repaymentGoal: {
        monthlyTarget: 0,
        currentMonthPaid: 0,
        monthlyProgress: 0,
        nextTargetDate: null
      }
    },
    creditScore: {
      score: 0,
      maxScore: 100,
      category: 'No Data' // 'Poor', 'Fair', 'Good', 'Excellent'
    },
    recentActivity: [],
    savingsGoal: {
      target: 10000,
      current: 0,
      progress: 0
    },
    notifications: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Quick Actions
  const quickActions = [
    {
      title: 'Deposit Savings',
      icon: PlusIcon,
      link: '/user/savings',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Apply for Loan',
      icon: CreditCardIcon,
      link: '/user/loans',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Make Payment',
      icon: BanknotesIcon,
      link: '/user/pay-loan',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'View Credit Score',
      icon: StarIcon,
      link: '/user/credit-score',
      color: 'bg-yellow-100 text-yellow-600'
    }
  ];

  // Verify API endpoints are available
  const verifyApiEndpoints = async () => {
    try {
      await api.get('/api/v1/status', {
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

  // Fetch user data and dashboard information
  const fetchUserDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
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
      
      // Define headers for all API requests
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('session_id')}`
      };
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      
      // Fetch user's accounts
      const accountsResponse = await api.get('/api/v1/accounts/me', { headers });
      const userAccounts = accountsResponse.data || [];
      
      // Find savings account
      const savingsAccount = userAccounts.find(account => account.account_type === 'savings') || userAccounts[0];
      const savingsBalance = savingsAccount ? parseFloat(savingsAccount.balance || 0) : 0;
      
      // Get loans for loan progress
      const loansResponse = await api.get('/api/v1/loans', { headers });
      const loans = loansResponse.data || [];
      
      // Get recent transactions
      const transactionsResponse = await api.get(`/api/v1/transactions/account/${savingsAccount?.id}`, { headers });
      const recentTransactions = transactionsResponse.data || [];
      
      // Calculate loan progress
      const activeLoans = loans.filter(loan => loan.status === 'approved');
      let loanProgress = {
        totalAmount: 0,
        amountPaid: 0,
        remainingAmount: 0,
        progressPercentage: 0,
        nextPaymentDate: null,
        nextPaymentAmount: 0,
        status: 'none',
        repaymentGoal: {
          monthlyTarget: 0,
          currentMonthPaid: 0,
          monthlyProgress: 0,
          nextTargetDate: null
        }
      };

      if (activeLoans.length > 0) {
        const latestLoan = activeLoans[activeLoans.length - 1];
        const monthlyPayment = parseFloat(latestLoan.monthly_payment || 0);
        
        // Calculate current month's repayment progress
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const currentMonthPayments = recentTransactions
          .filter(tx => 
            tx.transaction_type === 'payment' && 
            new Date(tx.created_at) >= startOfMonth
          )
          .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

        // Calculate next target date
        const nextTargetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        
        loanProgress = {
          totalAmount: parseFloat(latestLoan.amount),
          amountPaid: parseFloat(latestLoan.amount_paid || 0),
          remainingAmount: parseFloat(latestLoan.amount) - parseFloat(latestLoan.amount_paid || 0),
          progressPercentage: Math.round((parseFloat(latestLoan.amount_paid || 0) / parseFloat(latestLoan.amount)) * 100),
          nextPaymentDate: latestLoan.next_payment_date,
          nextPaymentAmount: monthlyPayment,
          status: latestLoan.status,
          repaymentGoal: {
            monthlyTarget: monthlyPayment,
            currentMonthPaid: currentMonthPayments,
            monthlyProgress: Math.min(100, Math.round((currentMonthPayments / monthlyPayment) * 100)),
            nextTargetDate: nextTargetDate
          }
        };
      }

      // Generate notifications
      const notifications = [];
      
      // Add loan payment notifications
      if (loanProgress.status === 'active' && loanProgress.nextPaymentDate) {
        const daysUntilPayment = Math.ceil((new Date(loanProgress.nextPaymentDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilPayment <= 7) {
          notifications.push({
            type: 'warning',
            message: `Loan payment of ETB ${loanProgress.nextPaymentAmount} due in ${daysUntilPayment} days`,
            date: loanProgress.nextPaymentDate
          });
        }
      }

      // Add savings goal notifications
      const savingsGoal = {
        target: 10000, // Example target
        current: savingsBalance,
        progress: Math.round((savingsBalance / 10000) * 100)
      };

      if (savingsGoal.progress >= 90) {
        notifications.push({
          type: 'success',
          message: 'You\'re close to reaching your savings goal!',
          date: new Date()
        });
      }

      // Update dashboard data
      setDashboardData({
        balance: {
          current: savingsBalance,
          currency: 'ETB'
        },
        loanProgress,
        creditScore: {
          score: 750, // Example score
          maxScore: 1000,
          category: 'Good'
        },
        recentActivity: recentTransactions.slice(0, 5).map(tx => ({
          id: tx.id,
          type: tx.transaction_type,
          amount: parseFloat(tx.amount),
          description: tx.description,
          date: tx.created_at,
          status: tx.status
        })),
        savingsGoal,
        notifications
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
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
            setError(`Failed to load dashboard data: ${err.response.data?.error || 'Unknown error'}`);
        }
      } else if (err.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('Failed to load dashboard data. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and auth state change
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserDashboardData();
    }
  }, [isAuthenticated, user]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {currency} {current.toLocaleString()}
              </p>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Savings Goal</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {dashboardData.savingsGoal.progress}% Complete
                  </p>
                </div>
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${dashboardData.savingsGoal.progress}%` }}
                />
              </div>
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
    
    const getScoreColor = () => {
      switch(category) {
        case 'Excellent': return 'text-green-500';
        case 'Good': return 'text-blue-500';
        case 'Fair': return 'text-yellow-500';
        case 'Poor': return 'text-red-500';
        default: return 'text-gray-500';
      }
    };
    
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
          
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-gray-200">
              <div className="text-center">
                <p className={`text-3xl font-bold ${getScoreColor()}`}>{score}</p>
                <p className="text-sm text-gray-500">{category}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Score Range</span>
              <span>{percentage}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  category === 'Excellent' ? 'bg-green-500' :
                  category === 'Good' ? 'bg-blue-500' :
                  category === 'Fair' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
              to="/user/credit-score"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
            >
              View detailed report
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
      status,
      repaymentGoal
    } = dashboardData.loanProgress;
    
    const formattedDate = nextPaymentDate ? 
      formatDate(nextPaymentDate) : 'N/A';
    
    const getStatusColor = () => {
      switch(status) {
        case 'active': return 'bg-blue-100 text-blue-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'overdue': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    
    const getStatusText = () => {
      switch(status) {
        case 'active': return 'Active';
        case 'completed': return 'Completed';
        case 'overdue': return 'Overdue';
        case 'none': return 'No Active Loans';
        default: return status;
      }
    };

    const getMonthlyProgressColor = () => {
      const progress = repaymentGoal.monthlyProgress;
      if (progress >= 100) return 'bg-green-500';
      if (progress >= 75) return 'bg-blue-500';
      if (progress >= 50) return 'bg-yellow-500';
      return 'bg-red-500';
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
                  <span>Overall Progress</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'} rounded-full`} 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Monthly Repayment Goal */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Monthly Repayment Goal</h4>
                  <span className="text-xs text-gray-500">
                    Target: ETB {repaymentGoal.monthlyTarget.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getMonthlyProgressColor()} rounded-full`}
                      style={{ width: `${repaymentGoal.monthlyProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      Paid: ETB {repaymentGoal.currentMonthPaid.toLocaleString()}
                    </span>
                    <span className="text-gray-600">
                      {repaymentGoal.monthlyProgress}% of monthly goal
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Next target date: {formatDate(repaymentGoal.nextTargetDate)}
                  </p>
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

  // Recent Activity Component
  const RecentActivity = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Recent Activity</h3>
          
          <div className="space-y-4">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {activity.type === 'deposit' ? (
                      <ArrowUpIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownIcon className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className={`text-sm font-medium ${
                        activity.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {activity.type === 'deposit' ? '+' : '-'}
                        ETB {Math.abs(activity.amount).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No recent activity</p>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
              to="/user/savings"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
            >
              View all activity
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Quick Actions Component
  const QuickActions = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            to={action.link}
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className={`${action.color} w-10 h-10 rounded-full flex items-center justify-center mb-3`}>
              <action.icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
          </Link>
        ))}
      </div>
    );
  };

  // Notifications Component
  const Notifications = () => {
    return (
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <BellIcon className="h-6 w-6" />
          {dashboardData.notifications.length > 0 && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Notifications</h3>
              <div className="space-y-3">
                {dashboardData.notifications.length > 0 ? (
                  dashboardData.notifications.map((notification, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {notification.type === 'warning' ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500">{formatDate(notification.date)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center">No new notifications</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.username}!
            </h1>
            <Notifications />
          </div>
          <p className="text-gray-500">
            Here's your financial overview
          </p>
        </div>

        <button
          onClick={fetchUserDashboardData}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowPathIcon className={`-ml-1 mr-2 h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions />

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Cards */}
          <BalanceCard />
          <LoanProgressCard />
          <CreditScoreCard />
          
          {/* Recent Activity - Full Width */}
          <div className="lg:col-span-3">
            <RecentActivity />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;