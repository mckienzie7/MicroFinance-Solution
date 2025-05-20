import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const LoanApproval = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/loans', {
        params: { admin: "True" }
      });
      setLoans(response.data);
    } catch (err) {
      setError('Failed to fetch loans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loanId) => {
    try {
      setActionLoading(true);
      setError(''); // Clear any previous errors
      const response = await api.post(`/loans/${loanId}/approve`);
      
      if (response.data) {
        setLoans(loans.map(loan => 
          loan.id === loanId ? { ...loan, loan_status: 'active', ...response.data } : loan
        ));
        setShowModal(false);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.error('Error approving loan:', err);
      if (err.response) {
        setError(err.response.data?.error || 'Failed to approve loan');
      } else if (err.request) {
        setError('No response from server. Please try again.');
      } else {
        setError(err.message || 'Failed to approve loan');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (loanId) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.post(`/loans/${loanId}/reject`, {
        reason: rejectionReason
      });
      setLoans(loans.map(loan => 
        loan.id === loanId ? { ...loan, loan_status: 'rejected', ...response.data } : loan
      ));
      setShowModal(false);
      setRejectionReason('');
    } catch (err) {
      setError('Failed to reject loan');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-blue-100 text-blue-800'
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Loan Applications</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and manage loan applications
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Term</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loans.map((loan) => (
                    <tr key={loan.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {loan.customer_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {formatCurrency(loan.amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {loan.repayment_period} months
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadge(loan.loan_status)}`}>
                          {loan.loan_status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(loan.created_at)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
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
        </div>
      </div>

      {/* Loan Details Modal */}
      {showModal && selectedLoan && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Loan Details
                    </h3>
                    
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Amount</p>
                          <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedLoan.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Interest Rate</p>
                          <p className="mt-1 text-sm text-gray-900">{selectedLoan.interest_rate}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Term</p>
                          <p className="mt-1 text-sm text-gray-900">{selectedLoan.repayment_period} months</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Monthly Payment</p>
                          <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedLoan.monthly_payment)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">Purpose</p>
                        <p className="mt-1 text-sm text-gray-900">{selectedLoan.purpose}</p>
                      </div>

                      {selectedLoan.repayment_schedule && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">Repayment Schedule</p>
                          <div className="border rounded-md divide-y">
                            {selectedLoan.repayment_schedule.map((payment, index) => (
                              <div key={index} className="p-3 flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium">Payment {payment.payment_number}</p>
                                  <p className="text-xs text-gray-500">Due: {formatDate(payment.due_date)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                                  <p className="text-xs text-gray-500">
                                    Remaining: {formatCurrency(payment.remaining_balance)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedLoan.loan_status === 'pending' && (
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
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={() => handleReject(selectedLoan.id)}
                      disabled={actionLoading}
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
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

export default LoanApproval; 