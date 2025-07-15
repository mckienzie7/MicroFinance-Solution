import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const CreditScoreAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [userScores, setUserScores] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRetraining, setIsRetraining] = useState(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [analyticsRes, usersRes] = await Promise.all([
        api.get('/admin/credit-score/analytics'),
        api.get('/admin/credit-scores')
      ]);
      
      setAnalytics(analyticsRes.data);
      setUserScores(usersRes.data.users_scores || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load credit score analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await api.get(`/admin/credit-score/${userId}`);
      setUserDetails(response.data);
      setSelectedUser(userId);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details');
    }
  };

  const retrainModel = async () => {
    setIsRetraining(true);
    try {
      const response = await api.post('/admin/credit-score/retrain');
      alert(response.data.message);
      await fetchAnalytics(); // Refresh data
    } catch (err) {
      console.error('Error retraining model:', err);
      alert('Failed to retrain model');
    } finally {
      setIsRetraining(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getScoreColor = (score) => {
    if (!score || score === 'N/A') return 'text-gray-500';
    if (score >= 750) return 'text-green-500';
    if (score >= 650) return 'text-blue-500';
    if (score >= 550) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreIcon = (rating) => {
    switch (rating?.toLowerCase()) {
      case 'excellent':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'good':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'poor':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (isLoading && !analytics) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-lg">Loading credit score analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Credit Score Analytics</h1>
        <div className="flex space-x-3">
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={retrainModel}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            disabled={isRetraining}
          >
            <CogIcon className={`h-5 w-5 ${isRetraining ? 'animate-spin' : ''}`} />
            {isRetraining ? 'Retraining...' : 'Retrain AI Model'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'users', 'details'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_users}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.average_score || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Highest Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.highest_score || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <ArrowTrendingDownIcon className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Lowest Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.lowest_score || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          {analytics.score_distribution && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Score Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(analytics.score_distribution).map(([category, count]) => (
                  <div key={category} className="text-center p-4 rounded-lg border">
                    <div className={`text-3xl font-bold mb-2 ${
                      category === 'excellent' ? 'text-green-500' :
                      category === 'good' ? 'text-blue-500' :
                      category === 'fair' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {count}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">{category}</div>
                    {analytics.score_ranges && analytics.score_ranges[category] && (
                      <div className="text-xs text-gray-500">
                        {analytics.score_ranges[category].min} - {analytics.score_ranges[category].max}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold">All Users Credit Scores</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userScores.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullname}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-semibold ${getScoreColor(user.credit_score)}`}>
                        {user.credit_score}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getScoreIcon(user.score_rating)}
                        <span className="ml-2 text-sm text-gray-900">
                          {user.score_rating}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => {
                          fetchUserDetails(user.user_id);
                          setActiveTab('details');
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div>
          {userDetails ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">User Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{userDetails.user_info?.fullname}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{userDetails.user_info?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Credit Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(userDetails.credit_score)}`}>
                      {userDetails.credit_score}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="font-medium">{userDetails.score_rating}</p>
                  </div>
                </div>
              </div>

              {/* Factors */}
              {userDetails.factors && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Credit Score Factors</h3>
                  <div className="space-y-4">
                    {userDetails.factors.map((factor, index) => (
                      <div key={index} className="border-b pb-4 last:border-0">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{factor.name}</h4>
                          <span className={`px-2 py-1 rounded text-sm ${
                            factor.status === 'excellent' ? 'bg-green-100 text-green-800' :
                            factor.status === 'good' ? 'bg-blue-100 text-blue-800' :
                            factor.status === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {factor.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {userDetails.recommendations && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
                  <ul className="space-y-2">
                    {userDetails.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500">Select a user to view details</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditScoreAnalytics;