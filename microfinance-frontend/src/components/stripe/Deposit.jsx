import React, { useState } from 'react';
import StripeForm from './StripeForm';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

const Deposit = ({ user, onTransactionSuccess }) => {
  const [amount, setAmount] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = (response) => {
    console.log('Deposit successful:', response);
    setPaymentSuccess(true);
    setPaymentError(null);
    setAmount('');
    setIsProcessing(false);
    if (onTransactionSuccess) {
      onTransactionSuccess();
    }
    // Clear success message after 5 seconds
    setTimeout(() => setPaymentSuccess(false), 5000);
  };

  const handlePaymentError = (error) => {
    console.error('Deposit failed:', error);
    setPaymentError(error.message || 'Deposit failed. Please try again.');
    setPaymentSuccess(false);
    setIsProcessing(false);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow positive numbers
    if (value === '' || (parseFloat(value) > 0 && !isNaN(value))) {
      setAmount(value);
      setPaymentError(null);
      setPaymentSuccess(false);
    }
  };

  const handlePaymentStart = () => {
    setIsProcessing(true);
    setPaymentError(null);
    setPaymentSuccess(false);
  };

  const suggestedAmounts = [25, 50, 100, 250, 500];

  const handleSuggestedAmount = (suggestedAmount) => {
    setAmount(suggestedAmount.toString());
    setPaymentError(null);
    setPaymentSuccess(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deposit Amount
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Suggested Amounts */}
      <div>
        <p className="text-sm text-gray-600 mb-2">Quick amounts:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedAmounts.map((suggestedAmount) => (
            <button
              key={suggestedAmount}
              type="button"
              onClick={() => handleSuggestedAmount(suggestedAmount)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              {formatCurrency(suggestedAmount)}
            </button>
          ))}
        </div>
      </div>

      {/* Success Message */}
      {paymentSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-green-700 text-sm font-medium">
              Deposit successful! Your balance will be updated shortly.
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-700 text-sm">{paymentError}</span>
          </div>
        </div>
      )}

      {/* Stripe Payment Form */}
      {amount && parseFloat(amount) > 0 && (
        <div className="border-t pt-4">
          <StripeForm
            amount={parseFloat(amount)}
            description={`Deposit ${formatCurrency(parseFloat(amount))} to savings account`}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onPaymentStart={handlePaymentStart}
            user={user}
            buttonText={`Deposit ${formatCurrency(parseFloat(amount))}`}
            isProcessing={isProcessing}
          />
        </div>
      )}
    </div>
  );
};

export default Deposit;
