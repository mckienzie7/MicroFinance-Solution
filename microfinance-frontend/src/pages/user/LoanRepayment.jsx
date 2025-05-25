import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import RepaymentTransactions from '../../components/RepaymentTransactions';
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const LoanRepayment = () => {
  const { user, isAuthenticated } = useAuth();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    loan_id: '',
    amount: '',
    payment_method: 'bank_transfer',
    description: 'Loan repayment'
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  
  // Selected loan for payment
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // Fetch loans on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchLoans();
    }
  }, [isAuthenticated, user]);
  
  // Fetch loans from API
  const fetchLoans = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const accountsResponse = await api.get('/accounts/me');
      const userAccounts = accountsResponse.data;

      if (!userAccounts || userAccounts.length === 0) {
        const errorMsg = 'No account found. Please create an account first.';
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }

      const userAccount = userAccounts[0];
      const loansResponse = await api.get('/loans');
      
      // Filter loans to show only those that are active/approved and have a remaining balance
      const activeLoans = loansResponse.data.filter(loan => {
        const validStatus = loan.loan_status === 'active' || 
                          loan.status === 'active' || 
                          loan.loan_status === 'approved' || 
                          loan.status === 'approved';
        
        const remainingBalance = Number(loan.remaining_balance || loan.amount || 0);
        const hasBalance = remainingBalance > 0;
        
        return validStatus && hasBalance;
      });
      
      // Sort by date (newest first)
      activeLoans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setLoans(activeLoans);
      
      if (activeLoans.length > 0) {
        setSelectedLoan(activeLoans[0]);
        setPaymentForm(prev => ({ 
          ...prev, 
          loan_id: activeLoans[0].id,
          amount: '' // Reset amount when loan changes
        }));
      }
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError('Failed to load loans. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
    
    if (name === 'loan_id') {
      const loan = loans.find(l => l.id === value);
      setSelectedLoan(loan || null);
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate remaining balance for a loan
  const getRemainingBalance = (loan) => {
    const balance = loan.remaining_balance || loan.amount || 0;
    return parseFloat(balance);
  };

  // Get suggested payment amounts
  const getSuggestedAmounts = (loan) => {
    const balance = getRemainingBalance(loan);
    return [
      balance * 0.25, // 25% of remaining balance
      balance * 0.5,  // 50% of remaining balance
      balance         // Full balance
    ];
  };

  // Handle suggested amount click
  const handleSuggestedAmountClick = (amount) => {
    setPaymentForm(prev => ({
      ...prev,
      amount: amount.toFixed(2)
    }));
    // Clear any amount-related errors
    setFormErrors(prev => ({ ...prev, amount: null }));
  };
  
  // Validate the payment form
  const validateForm = () => {
    const errors = {};
    
    if (!paymentForm.loan_id) {
      errors.loan_id = 'Please select a loan to repay';
    }
    
    if (!paymentForm.amount || isNaN(paymentForm.amount) || parseFloat(paymentForm.amount) <= 0) {
      errors.amount = 'Please enter a valid payment amount';
    } else if (selectedLoan && parseFloat(paymentForm.amount) > getRemainingBalance(selectedLoan)) {
      errors.amount = `Payment amount cannot exceed the remaining balance of ${formatCurrency(getRemainingBalance(selectedLoan))}`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Submit loan payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const selectedLoanExists = loans.some(loan => String(loan.id) === String(paymentForm.loan_id));
      
      if (!selectedLoanExists) {
        setError('The selected loan could not be found. Please select a valid loan and try again.');
        return;
      }
      
      const paymentData = {
        loan_id: paymentForm.loan_id,
        amount: parseFloat(paymentForm.amount),
        payment_method: 'bank_transfer',
        user_id: user.id,
        description: paymentForm.description.trim() || 'Loan repayment'
      };
      
      const response = await api.post('/repayments/make-payment', paymentData);
      
      setSuccessMessage(`Payment of ${formatCurrency(parseFloat(paymentForm.amount))} processed successfully!`);
      
      setPaymentForm(prev => ({
        ...prev,
        amount: '',
        description: 'Loan repayment'
      }));
      
      await fetchLoans();
    } catch (err) {
      console.error('Error processing payment:', err);
      
      if (err.response) {
        if (err.response.status === 500) {
          setError('Server error: The payment could not be processed. Please try again later or contact support.');
        } else if (err.response.status === 404) {
          if (err.response.data?.error === 'Loan not found') {
            setError('The selected loan could not be found. It may have been fully paid or removed. Please refresh the page and try again.');
            fetchLoans();
          } else {
            setError('Payment endpoint not found. Please contact support.');
          }
        } else {
          setError(`Payment failed: ${err.response.data?.error || err.response.data?.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        setError('Network error: Could not connect to the server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Loan Repayment</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Make a Payment</h2>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
                <span className="ml-2 text-red-700">{error}</span>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span className="ml-2 text-green-700">{successMessage}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmitPayment} className="space-y-6">
            {/* Loan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Loan
              </label>
              <select
                name="loan_id"
                value={paymentForm.loan_id}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm
                  ${formErrors.loan_id ? 'border-red-300' : ''}`}
              >
                <option value="">Select a loan</option>
                {loans.map(loan => (
                  <option key={loan.id} value={loan.id}>
                    Loan #{loan.id} - Balance: {formatCurrency(getRemainingBalance(loan))}
                  </option>
                ))}
              </select>
              {formErrors.loan_id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.loan_id}</p>
              )}
            </div>

            {/* Selected Loan Details */}
            {selectedLoan && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Loan Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Original Amount</p>
                    <p className="text-base font-medium text-gray-900">
                      {formatCurrency(selectedLoan.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining Balance</p>
                    <p className="text-base font-medium text-gray-900">
                      {formatCurrency(getRemainingBalance(selectedLoan))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={handleInputChange}
                  className={`block w-full pl-7 pr-12 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
                    ${formErrors.amount ? 'border-red-300' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {formErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
              )}

              {/* Suggested Amounts */}
              {selectedLoan && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500 mb-2">Suggested amounts:</p>
                  <div className="flex flex-wrap gap-2">
                    {getSuggestedAmounts(selectedLoan).map((amount, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestedAmountClick(amount)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                  ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                    Processing...
                  </>
                ) : (
                  'Make Payment'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Transaction History Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Repayment History</h2>
          </div>
          
          {selectedLoan ? (
            <RepaymentTransactions loanId={selectedLoan.id} />
          ) : (
            <div className="p-6 text-center text-gray-500">
              <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">Select a loan to view its repayment history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanRepayment;
