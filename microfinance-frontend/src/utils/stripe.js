/**
 * Stripe utility functions for the microfinance application
 */

/**
 * Format currency amount for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Convert dollars to cents for Stripe API
 * @param {number} dollars - Amount in dollars
 * @returns {number} Amount in cents
 */
export const dollarsToCents = (dollars) => {
  return Math.round(dollars * 100);
};

/**
 * Convert cents to dollars from Stripe API
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in dollars
 */
export const centsToDollars = (cents) => {
  return cents / 100;
};

/**
 * Validate payment amount
 * @param {number} amount - Amount to validate
 * @param {number} maxAmount - Maximum allowed amount (optional)
 * @param {number} minAmount - Minimum allowed amount (default: 0.01)
 * @returns {object} Validation result with isValid and error message
 */
export const validatePaymentAmount = (amount, maxAmount = null, minAmount = 0.01) => {
  if (!amount || isNaN(amount)) {
    return {
      isValid: false,
      error: 'Please enter a valid amount'
    };
  }

  const numAmount = parseFloat(amount);

  if (numAmount < minAmount) {
    return {
      isValid: false,
      error: `Amount must be at least ${formatCurrency(minAmount)}`
    };
  }

  if (maxAmount && numAmount > maxAmount) {
    return {
      isValid: false,
      error: `Amount cannot exceed ${formatCurrency(maxAmount)}`
    };
  }

  return {
    isValid: true,
    error: null
  };
};

/**
 * Get suggested payment amounts based on a base amount
 * @param {number} baseAmount - Base amount to calculate suggestions from
 * @param {number} maxAmount - Maximum allowed amount (optional)
 * @returns {array} Array of suggested amounts
 */
export const getSuggestedAmounts = (baseAmount, maxAmount = null) => {
  const suggestions = [
    baseAmount * 0.25,
    baseAmount * 0.5,
    baseAmount * 0.75,
    baseAmount
  ];

  // Filter out amounts that exceed the maximum
  const filteredSuggestions = maxAmount 
    ? suggestions.filter(amount => amount <= maxAmount)
    : suggestions;

  // Round to 2 decimal places and remove duplicates
  return [...new Set(filteredSuggestions.map(amount => Math.round(amount * 100) / 100))];
};

/**
 * Handle Stripe errors and return user-friendly messages
 * @param {object} error - Stripe error object
 * @returns {string} User-friendly error message
 */
export const handleStripeError = (error) => {
  if (!error) return 'An unknown error occurred';

  switch (error.type) {
    case 'card_error':
      return error.message || 'Your card was declined. Please try a different card.';
    case 'validation_error':
      return error.message || 'Please check your card information and try again.';
    case 'api_connection_error':
      return 'Network error. Please check your connection and try again.';
    case 'api_error':
      return 'Payment processing error. Please try again later.';
    case 'authentication_error':
      return 'Authentication error. Please refresh the page and try again.';
    case 'rate_limit_error':
      return 'Too many requests. Please wait a moment and try again.';
    default:
      return error.message || 'Payment failed. Please try again.';
  }
};

/**
 * Generate transaction description
 * @param {string} type - Transaction type (deposit, withdrawal, loan_repayment)
 * @param {number} amount - Transaction amount
 * @param {object} details - Additional details (optional)
 * @returns {string} Transaction description
 */
export const generateTransactionDescription = (type, amount, details = {}) => {
  const formattedAmount = formatCurrency(amount);
  
  switch (type) {
    case 'deposit':
      return `Deposit ${formattedAmount} to savings account`;
    case 'withdrawal':
      return `Withdraw ${formattedAmount} from savings account`;
    case 'loan_repayment':
      return `Loan repayment ${formattedAmount}${details.loanId ? ` for loan #${details.loanId}` : ''}`;
    default:
      return `Payment ${formattedAmount}`;
  }
};

/**
 * Check if Stripe is properly loaded
 * @param {object} stripe - Stripe instance
 * @param {object} elements - Stripe Elements instance
 * @returns {object} Status object with isReady and error message
 */
export const checkStripeStatus = (stripe, elements) => {
  if (!stripe || !elements) {
    return {
      isReady: false,
      error: 'Stripe.js has not loaded yet. Please refresh the page and try again.'
    };
  }

  return {
    isReady: true,
    error: null
  };
};

/**
 * Common Stripe card element options
 */
export const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

/**
 * Default suggested amounts for different transaction types
 */
export const defaultSuggestedAmounts = {
  deposit: [25, 50, 100, 250, 500],
  withdrawal: [25, 50, 100, 250],
  loan_repayment: [] // Will be calculated based on loan amount
};