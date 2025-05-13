import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { 
  CreditCardIcon, 
  UsersIcon,
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  StarIcon,
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
  
  const [stats, setStats] = useState({
    activeLoans: 0,
    pendingApplications: 0,
    totalRepaid: 0,
    nextPayment: null,
    recentTransactions: [],
    loanHistory: [],
    creditScore: 80
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
        return;
      }
      
      // Get customer ID
      const customersResponse = await fetchWithRetry('/customers');
      const customers = customersResponse.data;
      const customer = customers.find(c => c.email === user.email);
      
      if (!customer) {
        setError('Customer profile not found. Please update your profile first.');
        return;
      }
      
      // Get loans
      const loansResponse = await api.get(`/customers/${customer.id}/loans`);
      const loans = loansResponse.data || [];
      
      // Get accounts
      const accountsResponse = await api.get(`/customers/${customer.id}/accounts`);
      const accounts = accountsResponse.data || [];
      
      // Get transactions
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
      
      // Calculate dashboard stats
      const activeLoans = loans.filter(loan => loan.status === 'approved').length;
      const pendingApplications = loans.filter(loan => loan.status === 'pending').length;
      
      // Calculate total repaid
      const repaymentTransactions = transactions.filter(t => 
        t.transaction_type === 'payment' || 
        (t.description && t.description.toLowerCase().includes('repayment'))
      );
      const totalRepaid = repaymentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Find next payment due
      let nextPayment = null;
      const activeLoansList = loans.filter(loan => loan.status === 'approved');
      if (activeLoansList.length > 0) {
        // This is simplified - in a real app you'd fetch the actual repayment schedule
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + 15); // Assume payment due in 15 days
        
        nextPayment = {
          amount: activeLoansList[0].monthly_payment || activeLoansList[0].amount / 6,
          dueDate: nextDueDate.toISOString().split('T')[0]
        };
      }
      
      // Format transactions for display
      const recentTransactions = transactions
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          type: t.transaction_type === 'deposit' ? 'Deposit' : 
                t.transaction_type === 'payment' ? 'Payment' : 
                t.transaction_type === 'withdrawal' ? 'Withdrawal' : 'Transaction',
          amount: parseFloat(t.amount),
          status: t.status || 'Completed',
          date: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
        }));
      
      // Format loans for display
      const loanHistory = loans.map(loan => {
        // Calculate progress for active loans
        let progress = 0;
        if (loan.status === 'approved' && loan.amount && loan.remaining_balance) {
          progress = Math.round(((loan.amount - loan.remaining_balance) / loan.amount) * 100);
        }
        
        return {
          id: loan.id,
          amount: parseFloat(loan.amount),
          status: loan.status === 'approved' ? 'Active' : 
                  loan.status === 'pending' ? 'Pending' : 
                  loan.status === 'completed' ? 'Completed' : loan.status,
          startDate: loan.created_at ? loan.created_at.split('T')[0] : '',
          endDate: loan.end_date || null,
          progress: progress
        };
      });
      
      // Update state with real data
      setStats({
        activeLoans,
        pendingApplications,
        totalRepaid,
        nextPayment,
        recentTransactions,
        loanHistory,
        creditScore: customer.credit_score || 75 // Default if not available
      });
      
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

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserDashboardData();
    }
  }, [isAuthenticated, user]);

  const CreditScoreCard = () => (
    <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white/90">Credit Score</h3>
            <div className="mt-2 flex items-center">
              <span className="text-4xl font-bold text-white">{stats.creditScore}</span>
              <span className="ml-2 text-white/80">/100</span>
            </div>
          </div>
          <div className="p-3 rounded-full bg-white/10">
            <StarIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="mt-6">
          <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full ${stats.creditScore >= 70 ? 'bg-emerald-400' : stats.creditScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'} rounded-full`} 
              style={{ width: `${stats.creditScore}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/80">
            <span>Poor</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, color }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      yellow: 'bg-amber-100 text-amber-600',
      green: 'bg-emerald-100 text-emerald-600',
      red: 'bg-rose-100 text-rose-600'
    };
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
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
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-lg font-medium text-gray-900">{user?.username}</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to your Dashboard
          </h1>
          
          <p className="mt-1 text-gray-500">
            Here's your financial overview
          </p>
        </div>

        <button 
          onClick={fetchUserDashboardData} 
          disabled={isLoading}
          className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
          Refresh Data
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Active Loans" 
              value={stats.activeLoans} 
              icon={CreditCardIcon}
              color="blue"
            />
            <StatCard 
              title="Pending Applications" 
              value={stats.pendingApplications} 
              icon={ClockIcon}
              color="yellow"
            />
            <StatCard 
              title="Total Repaid" 
              value={`$${stats.totalRepaid.toLocaleString()}`} 
              icon={CheckCircleIcon}
              color="green"
            />
            <StatCard 
              title="Next Payment Due" 
              value={stats.nextPayment ? `$${stats.nextPayment.amount}` : 'None'} 
              icon={ExclamationCircleIcon}
              color="red"
            />
          </div>

          {/* Credit Score and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CreditScoreCard />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to="/user/apply-loan"
                    className="block w-full px-4 py-3 text-center font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Apply for a New Loan
                  </Link>
                  <Link
                    to="/user/loans"
                    className="block w-full px-4 py-3 text-center font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View My Loans
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Loan and Transaction Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Loan History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">My Loans</h3>
              </div>
              <div className="divide-y divide-gray-200">
                <ul className="divide-y divide-gray-200">
                  {stats.loanHistory.map((loan) => (
                    <LoanItem key={loan.id} loan={loan} />
                  ))}
                </ul>
                <div className="p-4">
                  <Link
                    to="/user/loans"
                    className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    View all loans
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {stats.recentTransactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;