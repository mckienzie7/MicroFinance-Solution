import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const SavingsControl = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get all accounts
      const accountsResponse = await api.get('/accounts');
      const accounts = accountsResponse.data;
      
      // Get all users first
      const usersResponse = await api.get('/users');
      const users = usersResponse.data;
      const userMap = new Map(users.map(user => [user.id, user]));
      
      // Then get transactions for each account
      const allTransactions = [];
      for (const account of accounts) {
        try {
          const transactionsResponse = await api.get(`/accounts/${account.id}/transactions`);
          const accountTransactions = transactionsResponse.data.map(transaction => {
            const user = userMap.get(account.user_id);
            return {
              ...transaction,
              accountNumber: account.account_number,
              accountType: account.account_type,
              userName: user?.fullname || 'Unknown',
              userId: account.user_id
            };
          });
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
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{transaction.userName}</div>
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
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
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

      {/* Transaction Details Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Transaction Details</h3>
                      <button
                        onClick={() => setShowModal(false)}
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedTransaction.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">User ID</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedTransaction.userId}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedTransaction.accountNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Type</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedTransaction.accountType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                        <p className="mt-1">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(selectedTransaction.transaction_type)}`}>
                            {selectedTransaction.transaction_type?.charAt(0).toUpperCase() + selectedTransaction.transaction_type?.slice(1)}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedTransaction.amount)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedTransaction.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsControl;

