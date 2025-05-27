import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ClockIcon,
  FunnelIcon
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
  const itemsPerPage = 10;

  // We'll fetch real loan data from the API instead of using mock data

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
            amount: loan.amount,
            purpose: loan.purpose,
            creditScore: loan.credit_score || 70, // Default if not provided
            status: loan.loan_status?.toLowerCase() || 'pending',
            applicationDate: loan.created_at || loan.application_date,
            documents: loan.documents || ['application.pdf'],
            term: loan.repayment_period || 12,
            interestRate: loan.interest_rate || '8.5'
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
    const options = { month: 'short', day: 'numeric' };
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

  // Get credit score color
  const getCreditScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 70) return 'bg-green-400';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mx-auto p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Loan Applications</h2>
          <p className="mt-1 text-gray-600 text-sm md:text-base">Review and manage loans</p>
        </div>
        
        {/* Filter controls - Desktop */}
        <div className="hidden md:flex space-x-2">
          <button 
            onClick={() => setFilter('pending')} 
            className={`px-3 py-1 rounded-md text-sm ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('approved')} 
            className={`px-3 py-1 rounded-md text-sm ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          >
            Approved
          </button>
          <button 
            onClick={() => setFilter('rejected')} 
            className={`px-3 py-1 rounded-md text-sm ${filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          >
            Rejected
          </button>
          <button 
            onClick={() => setFilter('all')} 
            className={`px-3 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          >
            All
          </button>
        </div>

        {/* Filter controls - Mobile */}
        <div className="md:hidden w-full">
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center justify-between w-full px-3 py-2 border rounded-md bg-white text-gray-700"
          >
            <span>Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
            <FunnelIcon className="h-5 w-5" />
          </button>
          
          {showMobileFilters && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button 
                onClick={() => { setFilter('pending'); setShowMobileFilters(false); }} 
                className={`px-3 py-2 rounded-md text-sm ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                Pending
              </button>
              <button 
                onClick={() => { setFilter('approved'); setShowMobileFilters(false); }} 
                className={`px-3 py-2 rounded-md text-sm ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                Approved
              </button>
              <button 
                onClick={() => { setFilter('rejected'); setShowMobileFilters(false); }} 
                className={`px-3 py-2 rounded-md text-sm ${filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                Rejected
              </button>
              <button 
                onClick={() => { setFilter('all'); setShowMobileFilters(false); }} 
                className={`px-3 py-2 rounded-md text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                All
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-sm">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-pulse space-y-4 w-full">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Term & Rate
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="relative px-3 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.length > 0 ? (
                  loans.map((loan) => (
                    <tr key={loan.id}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.customerName}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(loan.amount)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.term}m @ {loan.interestRate}%
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(loan.status)}`}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(loan.applicationDate)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {loan.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(loan.id, 'approved')}
                                className="text-green-600 hover:text-green-900"
                                disabled={actionLoading}
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleAction(loan.id, 'rejected')}
                                className="text-red-600 hover:text-red-900"
                                disabled={actionLoading}
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No loans found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs sm:text-sm text-gray-500">
            Showing {loans.length} of {loans.length} loans
          </p>
          <div className="flex items-center space-x-1">
            <button 
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(totalPages, 5)).keys()].map(page => (
                <button
                  key={page + 1}
                  onClick={() => setCurrentPage(page + 1)}
                  className={`px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm rounded-md ${currentPage === page + 1 ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {page + 1}
                </button>
              ))}
              {totalPages > 5 && (
                <span className="px-2 text-gray-500">...</span>
              )}
            </div>
            
            <button 
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loan Details Modal */}
      {showModal && selectedLoan && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Loan Details
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Loan ID</p>
                        <p className="text-sm font-medium">{selectedLoan.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(selectedLoan.status)}`}>
                          {selectedLoan.status.charAt(0).toUpperCase() + selectedLoan.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-medium">{selectedLoan.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Customer ID</p>
                        <p className="text-sm font-medium">{selectedLoan.customerId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-medium">{formatCurrency(selectedLoan.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Term</p>
                        <p className="text-sm font-medium">{selectedLoan.term} months</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Interest</p>
                        <p className="text-sm font-medium">{selectedLoan.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Purpose</p>
                        <p className="text-sm font-medium">{selectedLoan.purpose}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="text-sm font-medium">{formatDate(selectedLoan.applicationDate)}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-500">Credit Score</p>
                        <div className="flex items-center">
                          <div className="h-2 w-full bg-gray-200 rounded-full">
                            <div className={`h-2 ${getCreditScoreColor(selectedLoan.creditScore)} rounded-full`} style={{ width: `${selectedLoan.creditScore}%` }}></div>
                          </div>
                          <span className="ml-2 text-xs">{selectedLoan.creditScore}/100</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Documents</h4>
                      <div className="bg-gray-50 p-2 rounded-md">
                        {selectedLoan.documents.map((doc, index) => (
                          <div key={index} className="flex items-center py-1">
                            <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-xs">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                {selectedLoan.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 py-2 bg-green-600 text-xs sm:text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      onClick={() => handleAction(selectedLoan.id, 'approved')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 py-2 bg-red-600 text-xs sm:text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={() => handleAction(selectedLoan.id, 'rejected')}
                      disabled={actionLoading}
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveLoans;