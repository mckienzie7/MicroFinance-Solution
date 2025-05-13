import React from 'react';

const CreditScore = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">AI Credit Score</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Your Credit Score</h3>
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200"
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="10"
                />
                <circle
                  className="text-blue-500"
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="10"
                  strokeDasharray="283"
                  strokeDashoffset="56"
                  style={{ transition: 'stroke-dashoffset 0.3s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                80/100
              </div>
            </div>
          </div>
          <div>
            <p className="text-gray-600">
              Your AI-powered credit score is calculated based on your financial history and behavior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditScore;
