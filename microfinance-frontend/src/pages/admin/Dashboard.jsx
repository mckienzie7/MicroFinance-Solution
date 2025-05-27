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
    activeUsers: 0,
    pendingVerifications: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/v1/users', {
        params: { admin: true },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && Array.isArray(response.data)) {
        // Process dashboard data
        const totalUsers = response.data.length;
        const activeUsers = response.data.filter(user => user.is_verified).length;
        const pendingVerifications = response.data.filter(user => !user.is_verified).length;

        setStats({
          totalUsers,
          activeUsers,
          pendingVerifications
        });
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

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
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {subtext && (
            <p className="text-sm text-gray-500">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">User Management Overview</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={UsersIcon}
              color="bg-blue-500"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={CreditCardIcon}
              color="bg-green-500"
            />
            <StatCard
              title="Pending Verifications"
              value={stats.pendingVerifications}
              icon={ChartBarIcon}
              color="bg-yellow-500"
            />
          </div>

          {/* User Statistics */}
          <div className="bg-white shadow rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                <p className="text-sm text-gray-500">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingVerifications}</p>
                </div>
                <p className="text-sm text-gray-500">Pending Verifications</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;