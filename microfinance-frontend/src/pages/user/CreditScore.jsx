import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const CreditScore = () => {
  const [score, setScore] = useState(80);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Calculate score metrics
  const maxScore = 100;
  const scorePercentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 45; // 2πr where r=45
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference;
  
  // Determine score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const scoreColor = getScoreColor(score);
  
  // Factors affecting credit score
  const factors = [
    { 
      name: 'Payment History', 
      status: 'excellent',
      impact: 'high',
      description: 'You have made all your payments on time.',
      icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
    },
    { 
      name: 'Credit Utilization', 
      status: 'good',
      impact: 'medium',
      description: 'You are using 30% of your available credit.',
      icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
    },
    { 
      name: 'Loan Repayment', 
      status: 'fair',
      impact: 'medium',
      description: 'You have repaid 70% of your loans on time.',
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    },
    { 
      name: 'Credit History Length', 
      status: 'needs improvement',
      impact: 'low',
      description: 'Your credit history is relatively new.',
      icon: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    }
  ];
  
  // Recommendations for improving credit score
  const recommendations = [
    'Make all loan payments on time',
    'Keep credit utilization below 30%',
    'Maintain a mix of different types of credit',
    'Avoid applying for multiple new loans in a short period',
    'Regularly check your credit report for errors'
  ];
  
  // Fetch credit score data from API
  const fetchCreditScore = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch from your API
      // const response = await api.get('/user/credit-score');
      // setScore(response.data.score);
      
      // For now, we'll use the mock data
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching credit score:', err);
      setError('Failed to load your credit score. Please try again later.');
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCreditScore();
  }, []);
  
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI Credit Score</h2>
        <button 
          onClick={fetchCreditScore}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Score Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Your Credit Score</h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className={scoreColor}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{score}</span>
                  <span className="text-gray-500 text-sm">out of {maxScore}</span>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-lg font-medium">
                  {score >= 80 ? 'Excellent' : 
                   score >= 60 ? 'Good' : 
                   score >= 40 ? 'Fair' : 'Poor'}
                </p>
                <p className="text-gray-600 mt-2">
                  Your credit score is {score >= 60 ? 'above' : 'below'} average, which means you 
                  {score >= 60 ? ' qualify for better loan terms.' : ' may face higher interest rates.'}
                </p>
              </div>
            </div>
          )}
        </div>
        

        
        {/* Factors Affecting Score */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Factors Affecting Your Score</h3>
          
          <div className="space-y-4">
            {factors.map((factor, index) => (
              <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {factor.icon}
                    <span className="ml-2 font-medium">{factor.name}</span>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    factor.status === 'excellent' ? 'bg-green-100 text-green-800' :
                    factor.status === 'good' ? 'bg-blue-100 text-blue-800' :
                    factor.status === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {factor.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{factor.description}</p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <span>Impact: </span>
                  <span className={`ml-1 font-medium ${
                    factor.impact === 'high' ? 'text-red-600' :
                    factor.impact === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {factor.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Improve Your Score</h3>
          
          <ul className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-6">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out flex items-center justify-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2" />
              Apply for Credit Coaching
            </button>
          </div>
        </div>
      </div>
      
      {/* Additional Information */}
      <div className="bg-blue-50 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">About Your Credit Score</h4>
            <p className="mt-1 text-sm text-blue-700">
              This AI-powered credit score is calculated based on your financial history, loan repayment behavior, and other factors. 
              It is updated monthly and may differ from traditional credit bureau scores. Use this as a guide to improve your financial health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditScore;
