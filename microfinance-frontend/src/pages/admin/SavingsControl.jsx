import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const SavingsControl = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        setLoading(true);
        const response = await api.get('/accounts/<account_id>/deposit', {
          params: { page: currentPage, limit: itemsPerPage }
        });
        setDeposits(response.data.deposits || []);
        setTotalPages(response.data.totalPages || 1);
        setError('');
      } catch (err) {
        console.error('Error fetching deposits:', err);
        setError('Failed to load deposits');
      } finally {
        setLoading(false);
      }
    };

    fetchDeposits();
  }, [currentPage]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Savings Deposits</h2>
        <p className="mt-1 text-sm text-gray-600">All customer deposits in the system</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="px-4 py-3 sm:px-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">All Deposits</h3>
        </div>

        {loading ? (
          <div className="p-6 flex justify-center">
            <div className="animate-pulse space-y-3 w-full">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Deposit ID</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {deposits.length > 0 ? (
                  deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{deposit.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{deposit.userName}</div>
                            <div className="text-xs text-gray-500">{deposit.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-green-600">
                        {formatCurrency(deposit.amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(deposit.date)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          {deposit.type}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                      No deposits found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 sm:px-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-gray-500">
            Showing {deposits.length} of {itemsPerPage * totalPages} deposits
          </p>
          <div className="flex items-center space-x-1">
            <button
              className="px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {[...Array(totalPages).keys()].map((page) => (
              <button
                key={page + 1}
                onClick={() => setCurrentPage(page + 1)}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === page + 1 ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page + 1}
              </button>
            ))}

            <button
              className="px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsControl;
