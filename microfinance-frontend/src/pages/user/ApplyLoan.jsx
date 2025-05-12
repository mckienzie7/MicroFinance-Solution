import React from 'react';

const ApplyLoan = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Apply for Loan</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">Fill out the loan application form below:</p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Start Application
        </button>
      </div>
    </div>
  );
};

export default ApplyLoan;
