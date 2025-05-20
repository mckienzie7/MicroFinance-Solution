import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const CreditScore = () => {
  const { user } = useAuth();
  const [creditScore, setCreditScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loanAssessment, setLoanAssessment] = useState(null);
  const [formData, setFormData] = useState({
    loan_amount: 5000,
    loan_period: 12
  });

  useEffect(() => {
    fetchCreditScore();
  }, []);

  const fetchCreditScore = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${user.id}/credit-score`);
      setCreditScore(response.data);
    } catch (err) {
      setError('Failed to fetch credit score. You may need to create an account first.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'loan_period' ? parseInt(value) : parseFloat(value)
    });
  };

  const handleLoanEvaluation = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.post(`/users/${user.id}/loan-evaluation`, formData);
      setLoanAssessment(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to evaluate loan. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 700) return 'text-green-500';
    if (score >= 650) return 'text-yellow-500';
    if (score >= 600) return 'text-yellow-600';
    if (score >= 550) return 'text-orange-500';
    return 'text-red-600';
  };

  const getScoreIcon = (score) => {
    if (score >= 750) return <ShieldCheckIcon className="h-8 w-8 text-green-600" />;
    if (score >= 700) return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
    if (score >= 650) return <ArrowTrendingUpIcon className="h-8 w-8 text-yellow-500" />;
    if (score >= 600) return <QuestionMarkCircleIcon className="h-8 w-8 text-yellow-600" />;
    if (score >= 550) return <ArrowTrendingDownIcon className="h-8 w-8 text-orange-500" />;
    return <ExclamationCircleIcon className="h-8 w-8 text-red-600" />;
  };

  const getScoreCategory = (score) => {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    if (score >= 600) return 'Average';
    if (score >= 550) return 'Below Average';
    return 'Poor';
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'very low': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-green-50 text-green-700';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'moderate to high': return 'bg-orange-100 text-orange-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'very high': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Credit Profile</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {loading && !error ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {creditScore && (
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
              <div className="px-6 py-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Your Credit Score</h2>
                    <p className="text-sm text-gray-500 mt-1">{creditScore.reason}</p>
                  </div>
                  {getScoreIcon(creditScore.score)}
                </div>
                
                <div className="mt-6">
                  <div className="flex items-baseline">
                    <span className={`text-5xl font-bold ${getScoreColor(creditScore.score)}`}>
                      {creditScore.score}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">/ 850</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-600">
                    Category: <span className={getScoreColor(creditScore.score)}>{getScoreCategory(creditScore.score)}</span>
                  </p>
                </div>
                
                <div className="mt-6">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getScoreColor(creditScore.score).replace('text-', 'bg-')}`}
                      style={{ width: `${(creditScore.score / 850) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>300</span>
                    <span>850</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 px-6 py-4">
                <h3 className="text-sm font-medium text-gray-700">Score Factors</h3>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-start">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      Account Score: {creditScore.factors.account_score}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      Loan History Score: {creditScore.factors.loan_score}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 bg-blue-50">
              <h2 className="text-lg font-semibold text-blue-800">Loan Eligibility Check</h2>
              <p className="text-sm text-blue-600 mt-1">
                Check if you qualify for a loan and get personalized recommendations
              </p>
            </div>
            
            <div className="px-6 py-4">
              <form onSubmit={handleLoanEvaluation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Amount
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="loan_amount"
                      value={formData.loan_amount}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      min="500"
                      max="50000"
                      step="100"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Period (months)
                  </label>
                  <select
                    name="loan_period"
                    value={formData.loan_period}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                    <option value="48">48 months</option>
                    <option value="60">60 months</option>
                  </select>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Check Eligibility'}
                  </button>
                </div>
              </form>
            </div>
            
            {loanAssessment && (
              <div className="border-t border-gray-200 px-6 py-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Loan Assessment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded p-3">
                    <p className="text-xs text-gray-500">Approval Odds</p>
                    <p className="text-lg font-medium">{loanAssessment.risk_assessment.approval_odds}</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded p-3">
                    <p className="text-xs text-gray-500">Credit Risk</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(loanAssessment.risk_assessment.credit_risk)}`}>
                      {loanAssessment.risk_assessment.credit_risk}
                    </span>
                  </div>
                  
                  <div className="border border-gray-200 rounded p-3">
                    <p className="text-xs text-gray-500">Recommended Interest Rate</p>
                    <p className="text-lg font-medium">{loanAssessment.recommended_interest_rate}%</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded p-3">
                    <p className="text-xs text-gray-500">Max Recommended Amount</p>
                    <p className="text-lg font-medium">${loanAssessment.max_recommended_amount.toLocaleString()}</p>
                  </div>
                </div>
                
                {loanAssessment.risk_assessment.risk_factors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-700 mb-1">Risk Factors:</p>
                    <ul className="text-sm text-red-600 list-disc pl-5">
                      {loanAssessment.risk_assessment.risk_factors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-4">
                  <button
                    onClick={() => {
                      window.location.href = '/loan-application';
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Apply for Loan
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CreditScore;
