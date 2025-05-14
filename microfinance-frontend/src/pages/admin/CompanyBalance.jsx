import React, { useState, useEffect } from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const CompanyBalance = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const response = await api.get('/company/balance');
        setBalance(response.data.balance || 0);
      } catch (err) {
        console.error('Error fetching company balance:', err);
        setError('Failed to load company balance');
        setBalance(100000);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Company Balance</h2>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Current financial status</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700 text-sm sm:text-base">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 sm:p-8 text-white">
          <h3 className="text-lg sm:text-xl font-medium mb-2">Total Balance</h3>
          {loading ? (
            <div className="animate-pulse h-10 sm:h-12 bg-white bg-opacity-20 rounded w-40 sm:w-48"></div>
          ) : (
            <div className="flex items-center flex-col sm:flex-row">
              <div className="mb-3 sm:mb-0 sm:mr-4 p-2 sm:p-3 bg-white bg-opacity-20 rounded-full">
                <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <p className="text-3xl sm:text-5xl font-bold text-center sm:text-left">{formatCurrency(balance)}</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 rounded-lg p-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Last Updated</p>
              <p className="text-sm sm:text-base text-gray-700">{new Date().toLocaleDateString()}</p>
            </div>
            <button
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyBalance;
