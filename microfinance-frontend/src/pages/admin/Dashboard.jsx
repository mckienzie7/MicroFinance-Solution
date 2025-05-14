import { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  UsersIcon,
  CreditCardIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const username = user?.username || 'Admin';

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLoans: 0,
    totalBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const usersResponse = await api.post('/users', { admin: 'True' });
      const normalUsers = usersResponse.data.filter((user) => !user.admin);

      const loansResponse = await api.post('/loans', { admin: 'True' });
      const activeLoans = loansResponse.data.filter((loan) =>
        ['approved', 'active'].includes(loan.status.toLowerCase())
      );

      const balanceResponse = await api.get('/company/balance', {
        data: { admin: 'True' },
      });

      setStats({
        totalUsers: normalUsers.length,
        activeLoans: activeLoans.length,
        totalBalance: balanceResponse.data?.balance || 0,
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
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white shadow rounded-2xl p-5 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color} bg-opacity-80`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
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
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UsersIcon className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">{username}</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          />
          <StatCard
            title="Total Balance"
            value={`$${stats.totalBalance.toLocaleString()}`}
            icon={BanknotesIcon}
            color="bg-purple-500"
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;