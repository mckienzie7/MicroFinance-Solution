import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ModernPaymentForm from '../../components/payments/ModernPaymentForm';
import RepaymentTransactions from '../../components/RepaymentTransactions';
import {
  CreditCardIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const LoanRepayment = () => {
  const { user, isAuthenticated } = useAuth();
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchLoans();
    }
  }, [isAuthenticated, user]);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const accountsResponse = await api.get('/api/v1/accounts/me');
      const userAccounts = accountsResponse.data;

      if (!userAccounts || userAccounts.length === 0) {
        setError('No account found. Please create an account first.');
        return;
      }

      const loansResponse = await api.get('/api/v1/loans');
      
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
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError('Failed to load loans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentData) => {
    setPaymentLoading(true);
    try {
      const response = await api.post('/api/v1/stripe/repay_loan', {
        loan_id: selectedLoan.id,
        amount: paymentData.amount,
        payment_method_id: 'pm_card_visa', // Mock payment method
        user_id: user.id,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh loans after successful payment
      await fetchLoans();
      
      // Reset form
      setPaymentAmount('');
      
      return response.data;
    } catch (err) {
      console.error('Error processing payment:', err);
      throw new Error(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRemainingBalance = (loan) => {
    const balance = loan.remaining_balance || loan.amount || 0;
    return parseFloat(balance);
  };

  const getTotalAmountDue = (loan) => {
    const principal = getRemainingBalance(loan);
    const interestRate = parseFloat(loan.interest_rate || 0) / 100;
    const interest = principal * interestRate;
    return principal + interest;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your loans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Loans</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No Active Loans</h3>
          <p className="text-gray-600 mb-6">
            Great news! You don't have any active loans to repay at the moment.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Loan Repayment
          </h1>
          <p className="text-xl text-gray-600">
            Make payments towards your active loans securely
          </p>
        </div>

        {!selectedLoan ? (
          /* Loan Selection */
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Select a Loan to Repay</h2>
              <p className="text-gray-600">Choose from your active loans below</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200"
                  onClick={() => setSelectedLoan(loan)}
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCardIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Loan #{loan.id.slice(-8)}
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Active
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium">Outstanding Amount</span>
                        <span className="text-2xl font-bold text-purple-600">{formatCurrency(getRemainingBalance(loan))}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Total Due (with interest)</span>
                        <span className="font-semibold text-pink-600">{formatCurrency(getTotalAmountDue(loan))}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Interest Rate</span>
                        <span className="font-semibold">{loan.interest_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Repayment Period</span>
                        <span className="font-semibold">{loan.repayment_period} months</span>
                      </div>
                    </div>

                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center">
                      Make Payment
                      <BanknotesIcon className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Payment Form */
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedLoan(null)}
                className="flex items-center text-purple-600 hover:text-purple-800 font-semibold transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Loans
              </button>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900">
                  Loan #{selectedLoan.id.slice(-8)}
                </h2>
                <p className="text-gray-600">Outstanding: {formatCurrency(getRemainingBalance(selectedLoan))}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Loan Details Card */}
              <div className="lg:col-span-1 bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <ClockIcon className="w-6 h-6 mr-3 text-purple-600" />
                  Loan Details
                </h3>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                    <div className="text-center mb-4">
                      <p className="text-gray-600 font-medium mb-1">Outstanding Principal</p>
                      <p className="text-3xl font-bold text-purple-600">{formatCurrency(getRemainingBalance(selectedLoan))}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 font-medium mb-1">Total Due (with interest)</p>
                      <p className="text-2xl font-bold text-pink-600">{formatCurrency(getTotalAmountDue(selectedLoan))}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Loan ID</span>
                      <span className="font-mono text-gray-900">#{selectedLoan.id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Interest Rate</span>
                      <span className="font-semibold text-gray-900">{selectedLoan.interest_rate}%</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Repayment Period</span>
                      <span className="font-semibold text-gray-900">{selectedLoan.repayment_period} months</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600 font-medium">Status</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Payment Information</p>
                        <p className="text-xs text-blue-700 mt-1">
                          You can make partial or full payments. Any amount you pay will reduce your outstanding balance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <div className="lg:col-span-1">
                <ModernPaymentForm
                  type="loan_repayment"
                  amount={paymentAmount}
                  onAmountChange={setPaymentAmount}
                  onSubmit={handlePayment}
                  loading={paymentLoading}
                  loanInfo={selectedLoan}
                />
              </div>

              {/* Transaction History */}
              <div className="lg:col-span-1 bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Repayment History
                  </h3>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  <RepaymentTransactions loanId={selectedLoan.id} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanRepayment;