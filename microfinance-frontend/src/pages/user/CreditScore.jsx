import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LightBulbIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const CreditScore = () => {
  const [scoreData, setScoreData] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loanEligibility, setLoanEligibility] = useState(null);
  const [scoreComparison, setScoreComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isComprehensive, setIsComprehensive] = useState(false);
  
  // Calculate score metrics
  const score = scoreData?.credit_score || 0;
  const maxScore = 850;
  const scorePercentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 45; // 2πr where r=45
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;
  
  // Determine score color based on value
  const getScoreColor = (score) => {
    if (score >= 750) return 'text-green-500';
    if (score >= 650) return 'text-blue-500';
    if (score >= 550) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'good':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'fair':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'needs improvement':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const scoreColor = getScoreColor(score);
  
  // Fetch comprehensive credit score data from API
  const fetchCreditScore = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
        'Content-Type': 'application/json'
      };

      // Try comprehensive credit score first
      try {
        const [scoreResponse, historyResponse, eligibilityResponse, comparisonResponse] = await Promise.all([
          api.get('/api/v1/comprehensive-credit-score', { headers }),
          api.get('/api/v1/comprehensive-credit-score/history', { headers }),
          api.get('/api/v1/comprehensive-credit-score/loan-eligibility', { headers }),
          api.get('/api/v1/comprehensive-credit-score/comparison', { headers })
        ]);
        
        setScoreData(scoreResponse.data);
        setScoreHistory(historyResponse.data.history || []);
        setLoanEligibility(eligibilityResponse.data.loan_eligibility || null);
        setScoreComparison(comparisonResponse.data || null);
        setIsComprehensive(true);
        
      } catch (comprehensiveError) {
        console.error('Error fetching comprehensive credit score, falling back to old system:', comprehensiveError);
        
        // Fallback to old credit score system
        const [scoreResponse, historyResponse] = await Promise.all([
          api.get('/api/v1/credit-score', { headers }),
          api.get('/api/v1/credit-score/history', { headers })
        ]);
        
        setScoreData(scoreResponse.data);
        setScoreHistory(historyResponse.data.history || []);
        setIsComprehensive(false);
      }
      
    } catch (err) {
      console.error('Error fetching credit score:', err);
      setError('Failed to load your credit score. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCreditScore();
  }, []);
  
  if (isLoading && !scoreData) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-lg">Loading your AI credit score...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">AI Credit Score</h2>
        <button 
          onClick={fetchCreditScore}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={isLoading}
        >
          <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {scoreData && (
        <>
          {/* System Type Indicator */}
          {isComprehensive && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">Comprehensive AI Credit Score System</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Enhanced</span>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {(isComprehensive 
                ? ['overview', 'breakdown', 'factors', 'eligibility', 'comparison', 'history', 'recommendations']
                : ['overview', 'factors', 'history', 'recommendations']
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
                  {tab === 'breakdown' ? 'Score Breakdown' : tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Score Card */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-semibold mb-6 text-center">Your Credit Score</h3>
                
                <div className="flex flex-col items-center">
                  <div className="relative w-56 h-56 mx-auto mb-6">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className={scoreColor}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-gray-900">{score}</span>
                      <span className="text-gray-500 text-lg">out of {maxScore}</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className={`text-2xl font-bold mb-2 ${scoreColor}`}>
                      {scoreData.score_rating}
                    </p>
                    <p className="text-gray-600 text-lg">
                      Your credit score is {scoreData.score_rating.toLowerCase()}, which means you 
                      {score >= 650 ? ' qualify for better loan terms.' : ' may face higher interest rates.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Insights Card */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-semibold mb-6 flex items-center">
                  <LightBulbIcon className="h-6 w-6 mr-2 text-yellow-500" />
                  AI Insights
                </h3>
                
                <div className="space-y-4">
                  {scoreData.insights && scoreData.insights.length > 0 ? (
                    scoreData.insights.map((insight, index) => (
                      <div key={index} className="flex items-start p-4 bg-blue-50 rounded-lg">
                        <ChartBarIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-800">{insight}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No insights available yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Factors Tab */}
          {activeTab === 'factors' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold mb-6">Factors Affecting Your Score</h3>
              
              <div className="space-y-6">
                {scoreData.factors && scoreData.factors.length > 0 ? (
                  scoreData.factors.map((factor, index) => (
                    <div key={index} className="border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {getStatusIcon(factor.status)}
                          <span className="ml-3 font-semibold text-lg">{factor.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm px-3 py-1 rounded-full ${
                            factor.status === 'excellent' ? 'bg-green-100 text-green-800' :
                            factor.status === 'good' ? 'bg-blue-100 text-blue-800' :
                            factor.status === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {factor.status}
                          </span>
                          <span className={`text-sm font-medium ${
                            factor.score_impact > 0 ? 'text-green-600' : 
                            factor.score_impact < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {factor.score_impact > 0 ? '+' : ''}{factor.score_impact} points
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{factor.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded ${
                          factor.impact === 'high' ? 'bg-red-100 text-red-700' :
                          factor.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {factor.impact} impact
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl">No factor analysis available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <ClockIcon className="h-6 w-6 mr-2 text-blue-500" />
                Credit Score History
              </h3>
              
              {scoreHistory && scoreHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.max(...scoreHistory.map(h => h.score))}
                      </div>
                      <div className="text-sm text-green-800">Highest Score</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{score}</div>
                      <div className="text-sm text-blue-800">Current Score</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {Math.min(...scoreHistory.map(h => h.score))}
                      </div>
                      <div className="text-sm text-yellow-800">Lowest Score</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {scoreHistory.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <div className="text-lg font-semibold">{entry.score}</div>
                          <div className="ml-4 text-gray-600">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center">
                          {entry.change > 0 ? (
                            <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-1" />
                          ) : entry.change < 0 ? (
                            <ArrowTrendingDownIcon className="h-5 w-5 text-red-500 mr-1" />
                          ) : null}
                          <span className={`text-sm ${
                            entry.change > 0 ? 'text-green-600' : 
                            entry.change < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {entry.change > 0 ? '+' : ''}{entry.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ClockIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">No history data available</p>
                </div>
              )}
            </div>
          )}

          {/* Score Breakdown Tab (Comprehensive only) */}
          {activeTab === 'breakdown' && isComprehensive && scoreData.score_breakdown && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold mb-6">Detailed Score Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(scoreData.score_breakdown).map(([component, data]) => (
                  <div key={component} className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-3 capitalize">
                      {component.replace('_', ' ')}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Component Score:</span>
                        <span className="font-semibold">{data.score}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-semibold">{(data.weight * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contribution:</span>
                        <span className="font-semibold text-blue-600">{data.contribution} points</span>
                      </div>
                      <div className="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(data.score / 850) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loan Eligibility Tab (Comprehensive only) */}
          {activeTab === 'eligibility' && isComprehensive && loanEligibility && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 mr-2 text-green-500" />
                Loan Eligibility Assessment
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Eligibility Status */}
                <div className="space-y-6">
                  <div className={`p-6 rounded-lg border-2 ${
                    loanEligibility.eligible 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center mb-4">
                      {loanEligibility.eligible ? (
                        <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
                      ) : (
                        <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
                      )}
                      <div>
                        <h4 className="text-xl font-semibold">
                          {loanEligibility.eligible ? 'Eligible for Loans' : 'Not Eligible'}
                        </h4>
                        <p className={`text-sm ${
                          loanEligibility.eligible ? 'text-green-700' : 'text-red-700'
                        }`}>
                          Status: {loanEligibility.status}
                        </p>
                      </div>
                    </div>
                    
                    {loanEligibility.eligible && (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Loan Amount:</span>
                          <span className="font-semibold text-green-600">
                            ETB {loanEligibility.max_loan_amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Recommended Amount:</span>
                          <span className="font-semibold">
                            ETB {loanEligibility.recommended_amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interest Rate Range:</span>
                          <span className="font-semibold">
                            {loanEligibility.interest_rate_range?.[0]}% - {loanEligibility.interest_rate_range?.[1]}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Approval Probability:</span>
                          <span className="font-semibold text-blue-600">
                            {loanEligibility.approval_probability}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loan Terms */}
                {loanEligibility.terms && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Loan Terms</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Repayment Period:</span>
                        <span className="font-semibold">
                          {loanEligibility.terms.min_repayment_period} - {loanEligibility.terms.max_repayment_period} months
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Collateral Required:</span>
                        <span className={`font-semibold ${
                          loanEligibility.terms.collateral_required ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {loanEligibility.terms.collateral_required ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Guarantor Required:</span>
                        <span className={`font-semibold ${
                          loanEligibility.terms.guarantor_required ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {loanEligibility.terms.guarantor_required ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Score Comparison Tab (Comprehensive only) */}
          {activeTab === 'comparison' && isComprehensive && scoreComparison && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold mb-6">Score Comparison</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User vs Average */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Your Score vs Average</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Your Score:</span>
                      <span className="text-2xl font-bold text-blue-600">{scoreComparison.user_score}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Average Score:</span>
                      <span className="text-xl font-semibold text-gray-600">
                        {scoreComparison.average_scores?.overall}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-lg border-2 border-dashed">
                      <span className="text-gray-700">Difference:</span>
                      <span className={`text-xl font-bold ${
                        scoreComparison.comparison?.difference_from_average >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {scoreComparison.comparison?.difference_from_average >= 0 ? '+' : ''}
                        {scoreComparison.comparison?.difference_from_average}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Percentile Ranking */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Percentile Ranking</h4>
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          className="text-gray-200"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                        <circle
                          className="text-blue-500"
                          strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - scoreComparison.user_percentile / 100)}`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="40"
                          cx="50"
                          cy="50"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">
                          {scoreComparison.user_percentile}th
                        </span>
                        <span className="text-xs text-gray-500">percentile</span>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      You score better than {scoreComparison.user_percentile}% of users
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Averages */}
              {scoreComparison.average_scores && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-lg font-semibold mb-4">Category Averages</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(scoreComparison.average_scores)
                      .filter(([key]) => key !== 'overall')
                      .map(([category, avgScore]) => (
                      <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900">{avgScore}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {category.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <ArrowTrendingUpIcon className="h-6 w-6 mr-2 text-green-500" />
                Improvement Recommendations
              </h3>
              
              <div className="space-y-4">
                {scoreData.recommendations && scoreData.recommendations.length > 0 ? (
                  scoreData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <p className="text-green-800 font-medium">{recommendation}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ArrowTrendingUpIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl">No recommendations available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreditScore;
