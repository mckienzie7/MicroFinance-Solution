import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Deposit from '../../components/stripe/Deposit';
import Withdraw from '../../components/stripe/Withdraw';
import StripePayment from '../../components/StripePayment';

const StripeTest = () => {
  const { user } = useAuth();
  const [testAmount, setTestAmount] = useState(25);

  const handleTestPayment = async (paymentMethodId) => {
    console.log('Test payment with method ID:', paymentMethodId);
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Test payment completed');
        resolve({ success: true });
      }, 2000);
    });
  };

  const handleTransactionSuccess = () => {
    console.log('Transaction successful!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Stripe Integration Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Deposit Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Deposit Component</h2>
          {user ? (
            <Deposit 
              user={user} 
              onTransactionSuccess={handleTransactionSuccess}
            />
          ) : (
            <p className="text-gray-500">Please log in to test deposits</p>
          )}
        </div>

        {/* Withdraw Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Withdraw Component</h2>
          {user ? (
            <Withdraw 
              user={user} 
              onTransactionSuccess={handleTransactionSuccess}
              accountBalance={1000} // Mock balance for testing
            />
          ) : (
            <p className="text-gray-500">Please log in to test withdrawals</p>
          )}
        </div>

        {/* Loan Repayment Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Loan Repayment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Amount
              </label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(parseFloat(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                step="0.01"
              />
            </div>
            {testAmount > 0 && (
              <StripePayment
                amount={testAmount}
                handlePayment={handleTestPayment}
              />
            )}
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Integration Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span>Stripe Elements Provider: Active</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span>Deposit Component: Enhanced with UI/UX</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span>Withdraw Component: Enhanced with balance validation</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            <span>Loan Repayment: Enhanced with better styling</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            <span>Backend Integration: Requires API endpoints</span>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Card Numbers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Successful Payments:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>4242 4242 4242 4242 (Visa)</li>
              <li>5555 5555 5555 4444 (Mastercard)</li>
              <li>3782 822463 10005 (American Express)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Test Details:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>Expiry: Any future date</li>
              <li>CVC: Any 3-4 digits</li>
              <li>ZIP: Any 5 digits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeTest;