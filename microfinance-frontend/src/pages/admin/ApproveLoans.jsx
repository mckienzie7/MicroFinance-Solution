import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ClockIcon,
  FunnelIcon,
  ChartBarIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const ApproveLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [creditScoreData, setCreditScoreData] = useState({});
  const [loadingCreditScores, setLoadingCreditScores] = useState(false);
  const itemsPerPage = 10;

  // Fetch credit score for a specific user
  const fetchUserCreditScore = async (userId) => {
    try {
      const response = await api.get(`/api/v1/admin/credit-score/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (err) {
      console.error(`Error fetching credit score for user ${userId}:`, err);
      return null;
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get all accounts
      const accountsResponse = await api.get('/api/v1/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });
      const accounts = accountsResponse.data;
      
      // Get all users
      const usersResponse = await api.get('/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });
      const users = usersResponse.data;
      const userMap = new Map(users.map(user => [user.id, user]));
      const accountMap = new Map(accounts.map(account => [account.id, account]));
      
      // Then get all loans
      const loansResponse = await api.get('/api/v1/loans', {
        params: { admin: "True" },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (loansResponse.data && Array.isArray(loansResponse.data)) {
        // Format the loan data to match our component's expected structure
        const formattedLoans = loansResponse.data.map(loan => {
          const account = accountMap.get(loan.account_id);
          const user = userMap.get(account?.user_id);
          return {
            id: loan.id,
            customerId: account?.user_id,
            customerName: user?.fullname || 'Unknown',
            customerEmail: user?.email || 'Unknown',
            customerPhone: user?.phone_number || 'Unknown',
            amount: loan.amount,
            purpose: loan.purpose,
            status: loan.loan_status?.toLowerCase() || 'pending',
            applicationDate: loan.created_at || loan.application_date,
            documents: loan.documents || ['application.pdf'],
            term: loan.repayment_period || 12,
            interestRate: loan.interest_rate || '8.5',
            accountBalance: account?.balance || 0,
            accountType: account?.account_type || 'savings'
          };
        });
        
        // Sort loans by date (newest first)
        formattedLoans.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
        
        // Filter loans based on selected filter
        const filteredLoans = filter === 'all' 
          ? formattedLoans 
          : formattedLoans.filter(loan => loan.status === filter);
          
        const totalItems = filteredLoans.length;
        const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
        setTotalPages(calculatedTotalPages || 1);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedLoans = filteredLoans.slice(startIndex, endIndex);
        setLoans(paginatedLoans);

        // Fetch credit scores for all users in current page
        await fetchCreditScoresForLoans(paginatedLoans);
      } else {
        console.warn('API response did not contain valid loan data');
        setLoans([]);
        setError('No loan data available from the server');
      }
    } catch (err) {
      console.error('Error fetching loans:', err);
      if (err.response) {
        switch (err.response.status) {
          case 401:
            setError('Unauthorized. You need admin privileges to view loans.');
            break;
          case 404:
            setError('Loan data not found. The API endpoint may not be available.');
            break;
          default:
            setError(`Failed to load loans: ${err.response.data?.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('Failed to load loans. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch credit scores for all loans in current page
  const fetchCreditScoresForLoans = async (loansList) => {
    setLoadingCreditScores(true);
    const scores = {};
    
    for (const loan of loansList) {
      if (loan.customerId) {
        const scoreData = await fetchUserCreditScore(loan.customerId);
        if (scoreData) {
          scores[loan.customerId] = scoreData;
        }
      }
    }
    
    setCreditScoreData(scores);
    setLoadingCreditScores(false);
  };

  useEffect(() => {
    fetchLoans();
  }, [currentPage, filter]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle loan approval/rejection
  const handleAction = async (loanId, action) => {
    setActionLoading(true);
    try {
      // Send the loan status update to the API
      const endpoint = action === 'approved' ? `/api/v1/loans/${loanId}/approve` : `/api/v1/loans/${loanId}/reject`;
      const response = await api.post(endpoint, {
        reason: action === 'rejected' ? 'Loan application rejected' : undefined
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update the local state to reflect the change
      setLoans(prevLoans => 
        prevLoans.map(loan => 
          loan.id === loanId ? { ...loan, status: action } : loan
        )
      );
      
      setShowModal(false);
    } catch (err) {
      console.error(`Error ${action}ing loan:`, err);
      if (err.response) {
        setError(`Failed to ${action} loan: ${err.response.data?.message || 'Unknown error'}`);
      } else if (err.request) {
        setError(`Failed to ${action} loan: No response from server`);
      } else {
        setError(`Failed to ${action} loan: ${err.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Get credit score color and rating
  const getCreditScoreInfo = (score) => {
    if (score >= 750) return { color: 'text-green-600 bg-green-100', rating: 'Excellent', risk: 'Very Low' };
    if (score >= 650) return { color: 'text-blue-600 bg-blue-100', rating: 'Good', risk: 'Low' };
    if (score >= 550) return { color: 'text-yellow-600 bg-yellow-100', rating: 'Fair', risk: 'Medium' };
    return { color: 'text-red-600 bg-red-100', rating: 'Poor', risk: 'High' };
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate loan risk assessment
  const calculateLoanRisk = (loan, creditScore) => {
    let riskScore = 0;
    const loanAmount = parseFloat(loan.amount);
    const accountBalance = parseFloat(loan.accountBalance);
    
    // Credit score factor (40% weight)
    if (creditScore >= 750) riskScore += 40;
    else if (creditScore >= 650) riskScore += 30;
    else if (creditScore >= 550) riskScore += 20;
    else riskScore += 10;
    
    // Loan to balance ratio (30% weight)
    const loanToBalanceRatio = accountBalance > 0 ? loanAmount / accountBalance : 10;
    if (loanToBalanceRatio <= 2) riskScore += 30;
    else if (loanToBalanceRatio <= 5) riskScore += 20;
    else if (loanToBalanceRatio <= 10) riskScore += 10;
    else riskScore += 5;
    
    // Loan amount factor (20% weight)
    if (loanAmount <= 5000) riskScore += 20;
    else if (loanAmount <= 15000) riskScore += 15;
    else if (loanAmount <= 50000) riskScore += 10;
    else riskScore += 5;
    
    // Term factor (10% weight)
    if (loan.term <= 12) riskScore += 10;
    else if (loan.term <= 24) riskScore += 8;
    else if (loan.term <= 36) riskScore += 6;
    else riskScore += 4;
    
    return riskScore;
  };

  const getRiskLevel = (riskScore) => {
    if (riskScore >= 80) return { level: 'Very Low', color: 'text-green-600 bg-green-50', icon: ShieldCheckIcon };
    if (riskScore >= 60) return { level: 'Low', color: 'text-blue-600 bg-blue-50', icon: CheckCircleIcon };
    if (riskScore >= 40) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-50', icon: ExclamationTriangleIcon };
    return { level: 'High', color: 'text-red-600 bg-red-50', icon: XCircleIcon };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Applications</h1>
        <p className="text-gray-600">Review and manage loan applications with AI-powered credit scoring</p>
        
        {/* Summary Stats */}
        {loans.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-600">Total Applications</p>
                  <p className="text-2xl font-bold text-blue-900">{loans.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {loans.filter(loan => loan.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-600">Approved</p>
                  <p className="text-2xl font-bold text-green-900">
                    {loans.filter(loan => loan.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <XCircleIcon className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">
                    {loans.filter(loan => loan.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loans List */}
      <div className="space-y-4">
        {loans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loan applications found</h3>
            <p className="text-gray-600">There are no loan applications matching your current filter.</p>
          </div>
        ) : (
          loans.map((loan) => {
            const userCreditData = creditScoreData[loan.customerId];
            const creditScore = userCreditData?.credit_score || 0;
            const creditInfo = getCreditScoreInfo(creditScore);
            const riskScore = calculateLoanRisk(loan, creditScore);
            const riskInfo = getRiskLevel(riskScore);
            const RiskIcon = riskInfo.icon;

            return (
              <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{loan.customerName}</h3>
                          <p className="text-sm text-gray-600">{loan.customerEmail}</p>
                          <p className="text-sm text-gray-500">{loan.customerPhone}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(loan.status)}`}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {/* Loan Amount */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Loan Amount</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                          <p className="text-sm text-gray-600">{loan.term} months term</p>
                        </div>

                        {/* Credit Score */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <ChartBarIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">AI Credit Score</span>
                          </div>
                          {loadingCreditScores ? (
                            <div className="animate-pulse">
                              <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </div>
                          ) : creditScore > 0 ? (
                            <>
                              <p className="text-2xl font-bold text-gray-900">{creditScore}</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${creditInfo.color}`}>
                                {creditInfo.rating}
                              </span>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">Score unavailable</p>
                          )}
                        </div>

                        {/* Risk Assessment */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <RiskIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Risk Level</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{riskScore}%</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${riskInfo.color}`}>
                            {riskInfo.level} Risk
                          </span>
                        </div>

                        {/* Account Info */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <BanknotesIcon className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Account Balance</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(loan.accountBalance)}</p>
                          <p className="text-sm text-gray-600 capitalize">{loan.accountType} account</p>
                        </div>
                      </div>

                      {/* Loan Details */}
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Purpose:</span>
                            <p className="text-sm text-gray-900 mt-1">{loan.purpose}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Interest Rate:</span>
                            <p className="text-sm text-gray-900 mt-1">{loan.interestRate}% APR</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Application Date:</span>
                            <p className="text-sm text-gray-900 mt-1">{formatDate(loan.applicationDate)}</p>
                          </div>
                        </div>
                      </div>

                      {/* AI Insights */}
                      {userCreditData && (
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <LightBulbIcon className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-900">AI Recommendations</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {userCreditData.recommendations && userCreditData.recommendations.length > 0 ? (
                              userCreditData.recommendations.slice(0, 2).map((rec, index) => (
                                <div key={index} className="flex items-start space-x-2">
                                  <InformationCircleIcon className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-purple-800">{rec}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-purple-800">No specific recommendations available</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setShowModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </button>

                    {loan.status === 'pending' && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleAction(loan.id, 'rejected')}
                          disabled={actionLoading}
                          className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(loan.id, 'approved')}
                          disabled={actionLoading}
                          className="inline-flex items-center px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-3">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Detailed View Modal */}
      {showModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Loan Application Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Customer Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900 mt-1">{selectedLoan.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900 mt-1">{selectedLoan.customerEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900 mt-1">{selectedLoan.customerPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Account Balance</label>
                    <p className="text-gray-900 mt-1">{formatCurrency(selectedLoan.accountBalance)}</p>
                  </div>
                </div>
              </div>

              {/* Credit Score Details */}
              {creditScoreData[selectedLoan.customerId] && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Credit Assessment</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {creditScoreData[selectedLoan.customerId].credit_score}
                        </div>
                        <div className="text-sm text-gray-600">Credit Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          {getCreditScoreInfo(creditScoreData[selectedLoan.customerId].credit_score).rating}
                        </div>
                        <div className="text-sm text-gray-600">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {calculateLoanRisk(selectedLoan, creditScoreData[selectedLoan.customerId].credit_score)}%
                        </div>
                        <div className="text-sm text-gray-600">Risk Score</div>
                      </div>
                    </div>
                    
                    {/* Credit Factors */}
                    {creditScoreData[selectedLoan.customerId].factors && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Credit Factors</h4>
                        <div className="space-y-3">
                          {creditScoreData[selectedLoan.customerId].factors.map((factor, index) => (
                            <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                              <div>
                                <span className="font-medium text-gray-900">{factor.name}</span>
                                <p className="text-sm text-gray-600">{factor.description}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-sm font-medium ${
                                  factor.score_impact > 0 ? 'text-green-600' : 
                                  factor.score_impact < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {factor.score_impact > 0 ? '+' : ''}{factor.score_impact} pts
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loan Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Loan Amount</label>
                    <p className="text-gray-900 mt-1 text-2xl font-bold">{formatCurrency(selectedLoan.amount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Purpose</label>
                    <p className="text-gray-900 mt-1">{selectedLoan.purpose}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Term</label>
                    <p className="text-gray-900 mt-1">{selectedLoan.term} months</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Interest Rate</label>
                    <p className="text-gray-900 mt-1">{selectedLoan.interestRate}% APR</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Application Date</label>
                    <p className="text-gray-900 mt-1">{formatDate(selectedLoan.applicationDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusBadge(selectedLoan.status)}`}>
                      {selectedLoan.status.charAt(0).toUpperCase() + selectedLoan.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedLoan.status === 'pending' && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleAction(selectedLoan.id, 'rejected')}
                    disabled={actionLoading}
                    className="px-6 py-3 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleAction(selectedLoan.id, 'approved')}
                    disabled={actionLoading}
                    className="px-6 py-3 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    Approve Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveLoans;