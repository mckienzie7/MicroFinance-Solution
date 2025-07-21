import React, { useState } from 'react';
import {
  CreditCardIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BanknotesIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const ModernPaymentForm = ({ 
  type = 'deposit', // 'deposit', 'withdrawal', 'loan_repayment'
  amount,
  onAmountChange,
  onSubmit,
  loading = false,
  loanInfo = null // For loan repayments
}) => {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardInputChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }

    setCardData(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!amount || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    if (!cardData.expiryDate || cardData.expiryDate.length < 5) {
      newErrors.expiryDate = 'Please enter a valid expiry date';
    }

    if (!cardData.cvv || cardData.cvv.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV';
    }

    if (!cardData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter the cardholder name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        amount: parseFloat(amount),
        paymentMethod: {
          cardNumber: cardData.cardNumber.replace(/\s/g, ''),
          expiryDate: cardData.expiryDate,
          cvv: cardData.cvv,
          cardholderName: cardData.cardholderName
        }
      });
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'deposit':
        return {
          title: 'Make a Deposit',
          subtitle: 'Add funds to your account securely',
          icon: BanknotesIcon,
          color: 'from-green-500 to-emerald-600',
          buttonText: 'Deposit Now'
        };
      case 'withdrawal':
        return {
          title: 'Withdraw Funds',
          subtitle: 'Transfer money from your account',
          icon: BanknotesIcon,
          color: 'from-blue-500 to-indigo-600',
          buttonText: 'Withdraw Now'
        };
      case 'loan_repayment':
        return {
          title: 'Loan Repayment',
          subtitle: 'Make a payment towards your loan',
          icon: CreditCardIcon,
          color: 'from-purple-500 to-pink-600',
          buttonText: 'Pay Now'
        };
      default:
        return {
          title: 'Payment',
          subtitle: 'Complete your transaction',
          icon: CreditCardIcon,
          color: 'from-gray-500 to-gray-600',
          buttonText: 'Pay Now'
        };
    }
  };

  const config = getTypeConfig();

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h3>
        <p className="text-gray-600 mb-6">
          Your {type.replace('_', ' ')} of <span className="font-bold text-green-600">{amount} ETB</span> has been processed successfully.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="font-mono text-gray-900">TXN-{Date.now().toString().slice(-8)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Date:</span>
            <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <button
          onClick={() => setShowSuccess(false)}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200"
        >
          Make Another Payment
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.color} p-8 text-white text-center`}>
        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <config.icon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{config.title}</h2>
        <p className="text-white text-opacity-90">{config.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Loan Info (for loan repayments) */}
        {type === 'loan_repayment' && loanInfo && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-purple-900 mb-2">Loan Information</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Loan ID:</span>
                <span className="font-mono">{loanInfo.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Outstanding Balance:</span>
                <span className="font-semibold text-purple-700">{loanInfo.amount} ETB</span>
              </div>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Amount (ETB)
          </label>
          <div className="relative">
            <BanknotesIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className={`pl-12 w-full px-4 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-lg font-semibold ${
                errors.amount ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="0.00"
              min="1"
              step="0.01"
            />
          </div>
          {errors.amount && (
            <p className="text-red-500 text-sm flex items-center">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              {errors.amount}
            </p>
          )}
        </div>

        {/* Card Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <ShieldCheckIcon className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700">Secure Payment</span>
          </div>

          {/* Card Number */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Card Number
            </label>
            <div className="relative">
              <CreditCardIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={cardData.cardNumber}
                onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                className={`pl-12 w-full px-4 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-mono ${
                  errors.cardNumber ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
              />
            </div>
            {errors.cardNumber && (
              <p className="text-red-500 text-sm flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.cardNumber}
              </p>
            )}
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Expiry Date
              </label>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={cardData.expiryDate}
                  onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                  className={`pl-10 w-full px-3 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-mono ${
                    errors.expiryDate ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="MM/YY"
                  maxLength="5"
                />
              </div>
              {errors.expiryDate && (
                <p className="text-red-500 text-xs flex items-center">
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  {errors.expiryDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                CVV
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={cardData.cvv}
                  onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                  className={`pl-10 w-full px-3 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-mono ${
                    errors.cvv ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="123"
                  maxLength="4"
                />
              </div>
              {errors.cvv && (
                <p className="text-red-500 text-xs flex items-center">
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  {errors.cvv}
                </p>
              )}
            </div>
          </div>

          {/* Cardholder Name */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Cardholder Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={cardData.cardholderName}
                onChange={(e) => handleCardInputChange('cardholderName', e.target.value)}
                className={`pl-12 w-full px-4 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${
                  errors.cardholderName ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="John Doe"
              />
            </div>
            {errors.cardholderName && (
              <p className="text-red-500 text-sm flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.cardholderName}
              </p>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-900">Secure Transaction</p>
              <p className="text-xs text-blue-700 mt-1">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r ${config.color} text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none flex items-center justify-center`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Processing...
            </>
          ) : (
            <>
              {config.buttonText}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ModernPaymentForm;