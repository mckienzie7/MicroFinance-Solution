import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const LoanRepayment = () => {
  const { user } = useAuth();
  const [activeLoans, setActiveLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [repaymentSchedule, setRepaymentSchedule] = useState([]);

  // Add immediate logging when component renders
  console.log('LoanRepayment component rendering');
  console.log('Current user state:', user);

  useEffect(() => {
    console.log('Component mounted, checking user...');
    console.log('User from context:', user);
    
    if (!user) {
      console.error('No user found in context');
      setError('Please log in to view your loans');
      setLoading(false);
      return;
    }

    if (!user.id) {
      console.error('User ID is missing');
      setError('User information is incomplete');
      setLoading(false);
      return;
    }

    console.log('User authenticated, fetching loans...');
    fetchActiveLoans();
  }, [user]);

  const fetchActiveLoans = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user is loaded
      if (!user || !user.id) {
        console.error('User not loaded:', user);
        setError('User information not available');
        return;
      }
      
      console.log('Fetching loans for user:', user);
      console.log('User ID:', user.id);
      
      // Use the same endpoint as MyLoans
      const response = await api.get('/loans');
      console.log('Full API Response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format');
      }

      // Log all loans before filtering
      console.log('All loans before filtering:', response.data);
      
      // Filter for active loans and sort by creation date (newest first)
      const loans = response.data
        .filter(loan => {
          console.log('Checking loan:', {
            loanId: loan.id,
            loanAccountId: loan.account_id,
            loanUserId: loan.account?.user_id,
            currentUserId: user.id,
            loanStatus: loan.loan_status,
            account: loan.account
          });

          // Check if loan belongs to user's account
          const isUserLoan = loan.account && String(loan.account.user_id) === String(user.id);
          const isActive = loan.loan_status === 'active';
          
          console.log('Loan check results:', {
            isUserLoan,
            isActive,
            userIdsMatch: String(loan.account?.user_id) === String(user.id)
          });

          return isUserLoan && isActive;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      console.log('Filtered active loans:', loans);
      setActiveLoans(loans);

      // Add debug info about the state
      console.log('Current state after setting loans:', {
        activeLoans: loans,
        selectedLoan,
        loading,
        error
      });
    } catch (err) {
      console.error('Error fetching loans:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.error || 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const fetchRepaymentSchedule = async (loanId) => {
    try {
      console.log('Fetching repayment schedule for loan:', loanId);
      const response = await api.get(`/loans/${loanId}/repayment-schedule`);
      console.log('Repayment schedule:', response.data);
      setRepaymentSchedule(response.data);
    } catch (err) {
      console.error('Error fetching repayment schedule:', err);
      setRepaymentSchedule([]);
    }
  };

  const handleLoanSelect = async (loan) => {
    console.log('Selected loan:', loan);
    setSelectedLoan(loan);
    setPaymentAmount(loan.monthly_payment.toFixed(2));
    await fetchRepaymentSchedule(loan.id);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedLoan || !paymentAmount) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      console.log('Making payment for loan:', selectedLoan.id, 'Amount:', paymentAmount);
      const response = await api.post(`/loans/${selectedLoan.id}/repayments`, {
        amount: parseFloat(paymentAmount)
      });
      console.log('Payment response:', response.data);

      setSuccess('Payment processed successfully');
      await fetchActiveLoans();
      await fetchRepaymentSchedule(selectedLoan.id);
      setPaymentAmount('');
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.error || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const getNextPayment = () => {
    if (!repaymentSchedule.length) return null;
    return repaymentSchedule.find(payment => payment.status === 'pending');
  };

  // Add debug render logging
  useEffect(() => {
    console.log('Component state updated:', {
      activeLoans,
      selectedLoan,
      loading,
      error
    });
  }, [activeLoans, selectedLoan, loading, error]);

  if (loading && !activeLoans.length) {
    return <div className="text-center py-4">Loading...</div>;
  }

  // Add debug render logging
  console.log('Rendering with state:', {
    activeLoans,
    selectedLoan,
    loading,
    error
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Loan Repayments</h1>
          <p className="mt-2 text-sm text-gray-700">
            View your active loans and make payments
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          <p>{success}</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Loans List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Active Loans</h2>
          {activeLoans.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No active loans found</p>
              <p className="text-sm text-gray-400 mt-2">
                You don't have any active loans at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedLoan?.id === loan.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => handleLoanSelect(loan)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(loan.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {loan.repayment_period} months • {loan.interest_rate}% APR
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(loan.monthly_payment)}/mo
                      </p>
                      <p className="text-sm text-gray-500">
                        Remaining: {formatCurrency(loan.remaining_balance)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Form */}
        {selectedLoan && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Make Payment</h2>
            
            <div className="mb-6 space-y-4">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Next Payment Due</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {getNextPayment() ? formatCurrency(getNextPayment().amount) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Due Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {getNextPayment() ? formatDate(getNextPayment().due_date) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Remaining Balance</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(selectedLoan.remaining_balance)}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700">
                  Payment Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="payment-amount"
                    id="payment-amount"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    min={selectedLoan.monthly_payment}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Make Payment'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanRepayment; 