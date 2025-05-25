import { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  UsersIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const username = user?.username || 'Admin';

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLoans: 0,
    totalBalance: 0,
    totalRepayments: 0,
    pendingLoans: 0,
    monthlyStats: {
      loans: 0,
      repayments: 0,
      growth: 0
    },
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('week'); // week, month, year

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get users list
      const usersResponse = await api.get('/users', {
        params: { admin: 'True' }
      });
      const totalUsers = Array.isArray(usersResponse.data) ? usersResponse.data.filter(user => !user.admin).length : 0;

      // Get loans list
      const loansResponse = await api.get('/loans', {
        params: { admin: 'True' }
      });
      const loans = Array.isArray(loansResponse.data) ? loansResponse.data : [];
      const activeLoans = loans.filter(loan => ['approved', 'active'].includes(loan.status?.toLowerCase()));
      const pendingLoans = loans.filter(loan => loan.status?.toLowerCase() === 'pending');

      // Calculate total balance from active loans
      const totalBalance = activeLoans.reduce((sum, loan) => sum + loan.amount, 0);

      // Get repayments
      const repaymentsResponse = await api.get('/repayments');
      const repayments = Array.isArray(repaymentsResponse.data) ? repaymentsResponse.data : [];
      const totalRepayments = repayments.reduce((sum, repayment) => sum + repayment.amount, 0);

      // Calculate monthly stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyLoans = loans.filter(loan => new Date(loan.created_at) >= monthStart);
      const monthlyRepayments = repayments.filter(repayment => new Date(repayment.created_at) >= monthStart);

      // Get recent activity (combine loans and repayments, sort by date)
      const recentActivity = [...loans, ...repayments]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          type: 'amount' in item ? 'repayment' : 'loan',
          amount: item.amount,
          date: item.created_at,
          status: item.status || item.loan_status
        }));

      setStats({
        totalUsers,
        activeLoans: activeLoans.length,
        pendingLoans: pendingLoans.length,
        totalBalance,
        totalRepayments,
        monthlyStats: {
          loans: monthlyLoans.length,
          repayments: monthlyRepayments.length,
          growth: ((monthlyLoans.length - monthlyRepayments.length) / monthlyLoans.length) * 100
        },
        recentActivity
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(
        err.response?.data?.message ??
        (err.request ? 'Network error' : 'Unexpected error')
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white shadow rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-full ${color} bg-opacity-80`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900">
            {typeof value === 'number' && title.toLowerCase().includes('balance') 
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
              : value}
          </p>
          {subtext && (
            <p className="text-sm text-gray-500">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ item }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center">
        <div className={`p-2 rounded-full ${item.type === 'loan' ? 'bg-blue-100' : 'bg-green-100'} mr-3`}>
          {item.type === 'loan' ? (
            <CreditCardIcon className="h-5 w-5 text-blue-600" />
          ) : (
            <BanknotesIcon className="h-5 w-5 text-green-600" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {item.type === 'loan' ? 'New Loan' : 'Repayment'}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(item.date).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount)}
        </p>
        <p className={`text-xs ${
          item.status === 'approved' || item.status === 'completed' ? 'text-green-600' : 
          item.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {item.status}
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Microfinance stats overview</p>
          <button
            className="mt-2 inline-flex items-center text-sm text-blue-600 hover:underline"
            onClick={fetchDashboardData}
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/reports"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
            View Reports
          </Link>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{username}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-300 text-red-700 p-4 rounded-md flex items-start space-x-2">
          <ExclamationCircleIcon className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={UsersIcon}
              color="bg-blue-500"
            />
            <StatCard
              title="Active Loans"
              value={stats.activeLoans}
              icon={CreditCardIcon}
              color="bg-green-500"
              subtext={`${stats.pendingLoans} pending`}
            />
            <StatCard
              title="Total Balance"
              value={stats.totalBalance}
              icon={BanknotesIcon}
              color="bg-purple-500"
            />
            <StatCard
              title="Total Repayments"
              value={stats.totalRepayments}
              icon={ChartBarIcon}
              color="bg-yellow-500"
            />
          </div>

          {/* Monthly Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white shadow rounded-2xl p-5 col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.monthlyStats.loans}</p>
                  <p className="text-sm text-gray-500">New Loans</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.monthlyStats.repayments}</p>
                  <p className="text-sm text-gray-500">Repayments</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <p className="text-2xl font-bold text-gray-900">{Math.abs(stats.monthlyStats.growth).toFixed(1)}%</p>
                    {stats.monthlyStats.growth > 0 ? (
                      <ArrowUpIcon className="h-5 w-5 text-green-500 ml-1" />
                    ) : (
                      <ArrowDownIcon className="h-5 w-5 text-red-500 ml-1" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Growth</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-2xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="divide-y divide-gray-200">
                {stats.recentActivity.map((item) => (
                  <ActivityItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;