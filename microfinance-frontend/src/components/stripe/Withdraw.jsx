import React, { useState } from 'react';
import StripeForm from './StripeForm';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  BanknotesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Withdraw = ({ user, onTransactionSuccess, accountBalance = 0 }) => {
  const [amount, setAmount] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = (response) => {
    console.log('Withdrawal successful:', response);
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
    console.error('Withdrawal failed:', error);
    setPaymentError(error.message || 'Withdrawal failed. Please try again.');
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

  const suggestedAmounts = [25, 50, 100, 250].filter(amt => amt <= accountBalance);

  const handleSuggestedAmount = (suggestedAmount) => {
    setAmount(suggestedAmount.toString());
    setPaymentError(null);
    setPaymentSuccess(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  const isAmountValid = amount && parseFloat(amount) > 0 && parseFloat(amount) <= accountBalance;
  const exceedsBalance = amount && parseFloat(amount) > accountBalance;

  return (
    <div className="space-y-4">
      {/* Available Balance Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center">
          <BanknotesIcon className="h-5 w-5 text-blue-400 mr-2" />
          <span className="text-blue-700 text-sm">
            Available Balance: <span className="font-semibold">{formatCurrency(accountBalance)}</span>
          </span>
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Withdrawal Amount
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BanknotesIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={accountBalance}
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              exceedsBalance ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isProcessing}
          />
        </div>
        {exceedsBalance && (
          <p className="mt-1 text-sm text-red-600">
            Amount exceeds available balance
          </p>
        )}
      </div>

      {/* Suggested Amounts */}
      {suggestedAmounts.length > 0 && (
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
      )}

      {/* Warning for low balance */}
      {accountBalance < 100 && accountBalance > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <span className="text-yellow-700 text-sm">
              Your account balance is low. Consider making a deposit soon.
            </span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {paymentSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-green-700 text-sm font-medium">
              Withdrawal successful! Your balance will be updated shortly.
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
      {isAmountValid && (
        <div className="border-t pt-4">
          <StripeForm
            amount={parseFloat(amount)}
            description={`Withdraw ${formatCurrency(parseFloat(amount))} from savings account`}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onPaymentStart={handlePaymentStart}
            user={user}
            buttonText={`Withdraw ${formatCurrency(parseFloat(amount))}`}
            isProcessing={isProcessing}
            transactionType="withdrawal"
          />
        </div>
      )}
    </div>
  );
};

export default Withdraw;
