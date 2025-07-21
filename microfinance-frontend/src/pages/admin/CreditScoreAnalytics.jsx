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
  const [isComprehensive, setIsComprehensive] = useState(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try comprehensive credit score analytics first
      try {
        const [analyticsRes, usersRes] = await Promise.all([
          api.get('/api/v1/admin/comprehensive-credit-score/analytics'),
          api.get('/admin/credit-scores') // Keep old endpoint for user list for now
        ]);
        
        setAnalytics(analyticsRes.data);
        setUserScores(usersRes.data.users_scores || []);
        setIsComprehensive(true);
      } catch (comprehensiveError) {
        console.error('Error fetching comprehensive analytics, falling back to old system:', comprehensiveError);
        
        // Fallback to old credit score analytics
        const [analyticsRes, usersRes] = await Promise.all([
          api.get('/admin/credit-score/analytics'),
          api.get('/admin/credit-scores')
        ]);
        
        setAnalytics(analyticsRes.data);
        setUserScores(usersRes.data.users_scores || []);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load credit score analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      // Try comprehensive credit score user details first
      try {
        const response = await api.get(`/api/v1/admin/comprehensive-credit-score/user/${userId}`);
        setUserDetails(response.data);
        setSelectedUser(userId);
      } catch (comprehensiveError) {
        console.error('Error fetching comprehensive user details, falling back to old system:', comprehensiveError);
        
        // Fallback to old credit score user details
        const response = await api.get(`/admin/credit-score/${userId}`);
        setUserDetails(response.data);
        setSelectedUser(userId);
      }
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Score Analytics</h1>
          {isComprehensive && (
            <div className="mt-2 flex items-center">
              <ChartBarIcon className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-sm text-blue-600 font-medium">Comprehensive AI System</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Enhanced</span>
            </div>
          )}
        </div>
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
          {(isComprehensive 
            ? ['overview', 'distribution', 'trends', 'users', 'details']
            : ['overview', 'users', 'details']
          ).map((tab) => (
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

      {/* Distribution Tab (Comprehensive only) */}
      {activeTab === 'distribution' && isComprehensive && analytics && (
        <div className="space-y-6">
          {/* Score Distribution Chart */}
          {analytics.score_distribution && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-6">Detailed Score Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(analytics.score_distribution).map(([category, count]) => (
                  <div key={category} className="bg-gray-50 rounded-lg p-6">
                    <div className="text-center mb-4">
                      <div className={`text-4xl font-bold mb-2 ${
                        category === 'excellent' ? 'text-green-500' :
                        category === 'very_good' ? 'text-blue-500' :
                        category === 'good' ? 'text-indigo-500' :
                        category === 'fair' ? 'text-yellow-500' :
                        category === 'poor' ? 'text-orange-500' :
                        'text-red-500'
                      }`}>
                        {count}
                      </div>
                      <div className="text-lg font-semibold text-gray-700 capitalize mb-1">
                        {category.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {((count / analytics.total_users) * 100).toFixed(1)}% of users
                      </div>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          category === 'excellent' ? 'bg-green-500' :
                          category === 'very_good' ? 'bg-blue-500' :
                          category === 'good' ? 'bg-indigo-500' :
                          category === 'fair' ? 'bg-yellow-500' :
                          category === 'poor' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(count / analytics.total_users) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Distribution */}
          {analytics.risk_distribution && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-6">Risk Level Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(analytics.risk_distribution).map(([riskLevel, count]) => (
                  <div key={riskLevel} className="text-center p-4 rounded-lg border">
                    <div className={`text-2xl font-bold mb-2 ${
                      riskLevel === 'very_low' ? 'text-green-500' :
                      riskLevel === 'low' ? 'text-blue-500' :
                      riskLevel === 'moderate' ? 'text-yellow-500' :
                      riskLevel === 'high' ? 'text-orange-500' :
                      'text-red-500'
                    }`}>
                      {count}%
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      {riskLevel.replace('_', ' ')} Risk
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Affecting Factors */}
          {analytics.top_factors && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-6">Top Factors Affecting Scores</h3>
              <div className="space-y-4">
                {analytics.top_factors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-blue-600 font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{factor.factor}</h4>
                        <p className="text-sm text-gray-600">
                          Average Score: {factor.average_score}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">
                        {factor.impact_percentage}%
                      </div>
                      <div className="text-sm text-gray-500">Impact</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab (Comprehensive only) */}
      {activeTab === 'trends' && isComprehensive && analytics && (
        <div className="space-y-6">
          {/* Overall Trends */}
          {analytics.trends && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-6">Credit Score Trends</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <ArrowTrendingUpIcon className={`h-8 w-8 ${
                      analytics.trends.overall_trend === 'improving' ? 'text-green-500' :
                      analytics.trends.overall_trend === 'declining' ? 'text-red-500' :
                      'text-gray-500'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {analytics.trends.overall_trend}
                  </div>
                  <div className="text-sm text-gray-600">Overall Trend</div>
                </div>

                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    +{analytics.trends.average_monthly_change}
                  </div>
                  <div className="text-sm text-gray-600">Average Monthly Change</div>
                </div>

                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {analytics.trends.users_improving}%
                  </div>
                  <div className="text-sm text-gray-600">Users Improving</div>
                </div>
              </div>

              {/* User Movement */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Improving</span>
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.trends.users_improving}%
                  </div>
                  <div className="text-xs text-gray-500">of users</div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Stable</span>
                    <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                  </div>
                  <div className="text-2xl font-bold text-gray-600">
                    {analytics.trends.users_stable}%
                  </div>
                  <div className="text-xs text-gray-500">of users</div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Declining</span>
                    <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {analytics.trends.users_declining}%
                  </div>
                  <div className="text-xs text-gray-500">of users</div>
                </div>
              </div>
            </div>
          )}

          {/* Average Scores by Category */}
          {analytics.average_scores && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-6">Average Scores by User Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(analytics.average_scores).map(([category, avgScore]) => (
                  <div key={category} className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{avgScore}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {category.replace('_', ' ')}
                    </div>
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(avgScore / 850) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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