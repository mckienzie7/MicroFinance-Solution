import React from 'react';

const LoanRepayment = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Loan Repayment</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">Make a loan repayment:</p>
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Loan ID</label>
            <input type="text" className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input type="number" className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Make Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoanRepayment;
