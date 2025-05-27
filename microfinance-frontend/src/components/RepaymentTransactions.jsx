import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowPathIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const RepaymentTransactions = ({ loanId }) => {
  const [repayments, setRepayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      console.log('Fetching repayments for user:', user.id);
      fetchRepayments();
    }
  }, [user, loanId]);

  const fetchRepayments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch repayment transactions for the user
      console.log('Fetching repayments with user_id:', user.id);
      const response = await api.post('/api/v1/repayment_transactions', {
        user_id: user.id
      });
      
      const allRepayments = response.data || [];
      console.log('All repayments length:', allRepayments.length);
      
      // Fetch repayment details for each transaction
      const repaymentDetailsPromises = allRepayments.map(async (transaction) => {
        try {
          const repaymentResponse = await api.get(`/api/v1/repayments/${transaction.repayment_id}`);
          return {
            ...transaction,
            repayment: repaymentResponse.data
          };
        } catch (err) {
          console.error(`Error fetching repayment details for ${transaction.repayment_id}:`, err);
          return transaction;
        }
      });

      const repaymentsWithDetails = await Promise.all(repaymentDetailsPromises);
      console.log('Repayments with details:', repaymentsWithDetails);

      // Filter transactions for the current loan
      const loanRepayments = loanId 
        ? repaymentsWithDetails.filter(transaction => {
            console.log('Checking transaction with repayment:', transaction);
            const isMatch = transaction.repayment && transaction.repayment.loan_id === loanId;
            console.log('Is match?', isMatch);
            return isMatch;
          })
        : repaymentsWithDetails;

      // Sort repayments by date (newest first)
      const sortedRepayments = loanRepayments.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      console.log('Filtered and sorted repayments:', sortedRepayments);
      setRepayments(sortedRepayments);

      // Calculate total paid for this loan
      const total = sortedRepayments.reduce((sum, repayment) => {
        const amount = parseFloat(repayment.amount || 0);
        console.log('Adding amount:', amount);
        return sum + amount;
      }, 0);
      
      console.log('Total paid:', total);
      setTotalPaid(Math.abs(total));

      // Fetch loan details to get remaining balance if loanId is provided
      if (loanId) {
        const loanResponse = await api.get(`/api/v1/loans/${loanId}`);
        console.log('Loan details:', loanResponse.data);
        const loanData = loanResponse.data;
        const remainingBal = parseFloat(loanData.amount) - Math.abs(total);
        console.log('Calculated remaining balance:', remainingBal);
        setRemainingBalance(remainingBal);
      }
    } catch (err) {
      console.error('Error fetching repayments:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to load repayment history. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2">Loading repayment history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
          <span className="ml-2 text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800">Total Paid</h3>
          <p className="mt-2 text-2xl font-semibold text-blue-900">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        {loanId && (
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800">Remaining Balance</h3>
            <p className="mt-2 text-2xl font-semibold text-green-900">
              {formatCurrency(remainingBalance)}
            </p>
          </div>
        )}
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-800">Total Transactions</h3>
          <p className="mt-2 text-2xl font-semibold text-purple-900">
            {repayments.length}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {repayments.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                    {formatDate(transaction.created_at)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-500 mr-2" />
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${transaction.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {transaction.status || 'completed'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">
                      Transaction ID: {transaction.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {transaction.description || 'Loan Repayment'}
                    </span>
                    {!loanId && transaction.loan_id && (
                      <span className="text-xs text-gray-500">
                        Loan ID: {transaction.loan_id}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {repayments.length === 0 && (
        <div className="text-center py-8">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No repayments yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Once you make a payment, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default RepaymentTransactions; 