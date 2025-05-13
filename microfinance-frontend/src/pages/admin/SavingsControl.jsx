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
  
  // Generate more mock data for pagination demo
  const generateMockDeposits = () => {
    const mockData = [];
    for (let i = 1; i <= 45; i++) { // 45 items = 5 pages
      mockData.push({
        id: `DEP${i.toString().padStart(3, '0')}`,
        userId: `USR${Math.floor(Math.random() * 1000)}`,
        userName: [
          'John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'Michael Wilson',
          'Sarah Brown', 'David Miller', 'Lisa Taylor', 'James Anderson', 'Jennifer Thomas'
        ][Math.floor(Math.random() * 10)],
        amount: Math.floor(Math.random() * 5000) + 100,
        date: new Date(2025, 4, Math.floor(Math.random() * 30) + 1).toISOString().split('T')[0],
        type: Math.random() > 0.3 ? 'savings' : 'fixed deposit',
        status: 'completed'
      });
    }
    return mockData;
  };

  const mockDeposits = generateMockDeposits();

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint for deposits
        // const response = await api.get('/savings/deposits', {
        //   params: { page: currentPage, limit: itemsPerPage }
        // });
        // setDeposits(response.data.deposits || []);
        // setTotalPages(response.data.totalPages || 1);
        
        // Using mock data for now
        setTimeout(() => {
          // Calculate pagination
          const totalItems = mockDeposits.length;
          const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage);
          setTotalPages(calculatedTotalPages);
          
          // Get current page items
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedDeposits = mockDeposits.slice(startIndex, endIndex);
          setDeposits(paginatedDeposits);
          
          setLoading(false);
        }, 500); // Simulate API delay
      } catch (err) {
        console.error('Error fetching deposits:', err);
        setError('Failed to load deposits');
        setLoading(false);
      }
    };

    fetchDeposits();
  }, [currentPage]); // Refetch when page changes

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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Savings Deposits</h2>
        <p className="mt-2 text-gray-600">All customer deposits in the system</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Deposits Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">All Deposits</h3>
        </div>
        
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
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deposits.length > 0 ? (
                  deposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{deposit.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{deposit.userName}</div>
                            <div className="text-sm text-gray-500">{deposit.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(deposit.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(deposit.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {deposit.type}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No deposits found
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
            Showing {deposits.length} of {itemsPerPage * totalPages} deposits
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
    </div>
  );
};

export default SavingsControl;
