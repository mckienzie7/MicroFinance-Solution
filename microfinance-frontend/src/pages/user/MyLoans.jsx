import React from 'react';

const MyLoans = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">My Loans</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">View your current and past loans here:</p>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Loan data will be populated here */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyLoans;
