import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ArrowDownIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const SavingsControl = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get all accounts
      const accountsResponse = await api.get('/accounts');
      const accounts = accountsResponse.data;
      
      // Then get transactions for each account
      const allTransactions = [];
      for (const account of accounts) {
        try {
          const transactionsResponse = await api.get(`/accounts/${account.id}/transactions`);
          const accountTransactions = transactionsResponse.data.map(transaction => ({
            ...transaction,
            accountNumber: account.account_number,
            accountType: account.account_type,
            userName: account.user?.username || 'Unknown',
            userId: account.user_id
          }));
          allTransactions.push(...accountTransactions);
        } catch (err) {
          console.error(`Error fetching transactions for account ${account.id}:`, err);
        }
      }
      
      // Sort transactions by date (newest first)
      allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Filter transactions based on selected filter
      const filteredTransactions = filter === 'all' 
        ? allTransactions 
        : allTransactions.filter(t => t.transaction_type === filter);
      
      const totalItems = filteredTransactions.length;
      const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
      setTotalPages(calculatedTotalPages || 1);
      
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
      
      setTransactions(paginatedTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      if (err.response) {
        switch (err.response.status) {
          case 401:
            setError('Unauthorized. Please log in again.');
            break;
          case 403:
            setError('You do not have permission to view transactions.');
            break;
          default:
            setError(`Failed to load transactions: ${err.response.data?.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('Failed to load transactions. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filter]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getTransactionTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
        return 'bg-green-100 text-green-800';
      case 'withdrawal':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Savings Transactions</h2>
        <p className="mt-1 text-sm text-gray-600">Monitor all customer deposits and withdrawals</p>
      </div>

      {/* Filter controls */}
      <div className="mb-4 flex space-x-2">
        <button 
          onClick={() => setFilter('all')} 
          className={`px-3 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('deposit')} 
          className={`px-3 py-1 rounded-md text-sm ${filter === 'deposit' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
        >
          Deposits
        </button>
        <button 
          onClick={() => setFilter('withdrawal')} 
          className={`px-3 py-1 rounded-md text-sm ${filter === 'withdrawal' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
        >
          Withdrawals
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="px-4 py-3 sm:px-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Transaction History</h3>
        </div>

        {loading ? (
          <div className="p-6 flex justify-center">
            <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Transaction ID</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{transaction.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{transaction.userName}</div>
                            <div className="text-xs text-gray-500">ID: {transaction.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{transaction.accountNumber}</div>
                        <div className="text-xs text-gray-500">{transaction.accountType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(transaction.transaction_type)}`}>
                          {transaction.transaction_type?.charAt(0).toUpperCase() + transaction.transaction_type?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center">
                          {transaction.transaction_type?.toLowerCase() === 'deposit' ? (
                            <ArrowDownIcon className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <ArrowUpIcon className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={transaction.transaction_type?.toLowerCase() === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(transaction.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                      No transactions found
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
            Showing {transactions.length} of {transactions.length} transactions
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
    </div>
  );
};

export default SavingsControl;

