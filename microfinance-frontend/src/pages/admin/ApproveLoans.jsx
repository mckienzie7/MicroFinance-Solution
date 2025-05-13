import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ClockIcon
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
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const itemsPerPage = 10;

  // Generate mock loan data
  const generateMockLoans = () => {
    const purposes = [
      'Business Expansion', 'Education', 'Home Improvement', 
      'Debt Consolidation', 'Medical Expenses', 'Vehicle Purchase',
      'Wedding Expenses', 'Travel', 'Emergency Funds'
    ];
    
    const statuses = ['pending', 'approved', 'rejected'];
    const mockData = [];
    
    for (let i = 1; i <= 35; i++) {
      const status = i <= 20 ? 'pending' : statuses[Math.floor(Math.random() * statuses.length)];
      mockData.push({
        id: `LOAN${i.toString().padStart(3, '0')}`,
        customerId: `USR${Math.floor(Math.random() * 1000)}`,
        customerName: [
          'John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'Michael Wilson',
          'Sarah Brown', 'David Miller', 'Lisa Taylor', 'James Anderson', 'Jennifer Thomas'
        ][Math.floor(Math.random() * 10)],
        amount: Math.floor(Math.random() * 15000) + 1000,
        purpose: purposes[Math.floor(Math.random() * purposes.length)],
        creditScore: Math.floor(Math.random() * 40) + 60, // 60-100
        status: status,
        applicationDate: new Date(2025, 4, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
        documents: ['income_proof.pdf', 'id_verification.pdf', 'bank_statements.pdf'],
        term: Math.floor(Math.random() * 24) + 6, // 6-30 months
        interestRate: (Math.random() * 10 + 5).toFixed(2) // 5-15%
      });
    }
    return mockData;
  };

  const mockLoans = generateMockLoans();

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint for loans
        // const response = await api.get('/loans', {
        //   params: { page: currentPage, limit: itemsPerPage, status: filter }
        // });
        // setLoans(response.data.loans || []);
        // setTotalPages(response.data.totalPages || 1);
        
        // Using mock data for now
        setTimeout(() => {
          // Filter loans based on status
          const filteredLoans = filter === 'all' 
            ? mockLoans 
            : mockLoans.filter(loan => loan.status === filter);
            
          // Calculate pagination
          const totalItems = filteredLoans.length;
          const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
          setTotalPages(calculatedTotalPages || 1);
          
          // Get current page items
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedLoans = filteredLoans.slice(startIndex, endIndex);
          setLoans(paginatedLoans);
          
          setLoading(false);
        }, 500); // Simulate API delay
      } catch (err) {
        console.error('Error fetching loans:', err);
        setError('Failed to load loan applications');
        setLoading(false);
      }
    };

    fetchLoans();
  }, [currentPage, filter]); // Refetch when page or filter changes

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle loan approval
  const handleApprove = async (loanId) => {
    setActionLoading(true);
    try {
      // Replace with actual API call
      // await api.put(`/loans/${loanId}/approve`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setLoans(prevLoans => 
        prevLoans.map(loan => 
          loan.id === loanId ? { ...loan, status: 'approved' } : loan
        )
      );
      
      setShowModal(false);
    } catch (err) {
      console.error('Error approving loan:', err);
      setError('Failed to approve loan');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle loan rejection
  const handleReject = async (loanId) => {
    setActionLoading(true);
    try {
      // Replace with actual API call
      // await api.put(`/loans/${loanId}/reject`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setLoans(prevLoans => 
        prevLoans.map(loan => 
          loan.id === loanId ? { ...loan, status: 'rejected' } : loan
        )
      );
      
      setShowModal(false);
    } catch (err) {
      console.error('Error rejecting loan:', err);
      setError('Failed to reject loan');
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Loan Applications</h2>
          <p className="mt-2 text-gray-600">Review and manage loan applications</p>
        </div>
        
        {/* Filter controls */}
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('pending')} 
            className={`px-4 py-2 rounded-md ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('approved')} 
            className={`px-4 py-2 rounded-md ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          >
            Approved
          </button>
          <button 
            onClick={() => setFilter('rejected')} 
            className={`px-4 py-2 rounded-md ${filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          >
            Rejected
          </button>
          <button 
            onClick={() => setFilter('all')} 
            className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
          >
            All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.length > 0 ? (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loan.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.customerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(loan.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.purpose}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(loan.applicationDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(loan.status)}`}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          
                          {loan.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleApprove(loan.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                              <button 
                                onClick={() => handleReject(loan.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
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
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No loan applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {loans.length} of {filter === 'all' ? mockLoans.length : mockLoans.filter(loan => loan.status === filter).length} applications
          </p>
          <div className="flex items-center space-x-2">
            <button 
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {[...Array(totalPages).keys()].map(page => (
                <button
                  key={page + 1}
                  onClick={() => setCurrentPage(page + 1)}
                  className={`px-3 py-1 rounded-md ${currentPage === page + 1 ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {page + 1}
                </button>
              ))}
            </div>
            
            <button 
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                      Loan Application Details
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Loan ID</p>
                        <p className="font-medium">{selectedLoan.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(selectedLoan.status)}`}>
                          {selectedLoan.status.charAt(0).toUpperCase() + selectedLoan.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium">{selectedLoan.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Customer ID</p>
                        <p className="font-medium">{selectedLoan.customerId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-medium">{formatCurrency(selectedLoan.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Term</p>
                        <p className="font-medium">{selectedLoan.term} months</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Interest Rate</p>
                        <p className="font-medium">{selectedLoan.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Purpose</p>
                        <p className="font-medium">{selectedLoan.purpose}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Application Date</p>
                        <p className="font-medium">{formatDate(selectedLoan.applicationDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Credit Score</p>
                        <div className="flex items-center">
                          <div className="h-2 w-24 bg-gray-200 rounded-full">
                            <div className={`h-2 ${getCreditScoreColor(selectedLoan.creditScore)} rounded-full`} style={{ width: `${selectedLoan.creditScore}%` }}></div>
                          </div>
                          <span className="ml-2 text-sm">{selectedLoan.creditScore}/100</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Documents</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        {selectedLoan.documents.map((doc, index) => (
                          <div key={index} className="flex items-center py-1">
                            <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-sm">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedLoan.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => handleApprove(selectedLoan.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => handleReject(selectedLoan.id)}
                      disabled={actionLoading}
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
