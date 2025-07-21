import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ModernPaymentForm from '../../components/payments/ModernPaymentForm';
import api from '../../services/api';
import {
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const Withdrawal = () => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [accountLoading, setAccountLoading] = useState(true);

  useEffect(() => {
    fetchAccountInfo();
    fetchRecentTransactions();
  }, []);

  const fetchAccountInfo = async () => {
    try {
      const response = await api.get('/api/v1/accounts/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
        }
      });
      
      if (response.data && response.data.length > 0) {
        setAccountInfo(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching account info:', error);
    } finally {
      setAccountLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await api.get('/api/v1/transactions/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
        }
      });
      
      if (response.data) {
        const withdrawals = response.data
          .filter(transaction => transaction.transaction_type === 'withdrawal')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setRecentTransactions(withdrawals);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleWithdrawal = async (paymentData) => {
    setLoading(true);
    try {
      const response = await api.post('/api/v1/stripe/withdraw', {
        amount: paymentData.amount,
        payment_method_id: 'pm_card_visa', // Mock payment method
        user_id: user.id,
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh account info and transactions
      await fetchAccountInfo();
      await fetchRecentTransactions();
      
      // Reset form
      setAmount('');
      
      return response.data;
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      throw new Error(error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount).replace('ETB', 'ETB ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvailableBalance = () => {
    if (!accountInfo) return 0;
    // Keep a minimum balance of 100 ETB
    const minimumBalance = 100;
    return Math.max(0, accountInfo.balance - minimumBalance);
  };

  const getSuggestedAmounts = () => {
    const availableBalance = getAvailableBalance();
    if (availableBalance <= 0) return [];
    
    const amounts = [
      Math.min(100, availableBalance),
      Math.min(500, availableBalance),
      Math.min(1000, availableBalance),
      Math.min(availableBalance * 0.5, availableBalance),
      availableBalance
    ];
    
    return [...new Set(amounts)].filter(amount => amount > 0).sort((a, b) => a - b);
  };

  if (accountLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  const availableBalance = getAvailableBalance();
  const suggestedAmounts = getSuggestedAmounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Withdraw Funds
          </h1>
          <p className="text-xl text-gray-600">
            Access your funds quickly and securely
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Balance Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BanknotesIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Account Balance</h3>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {accountInfo ? formatCurrency(accountInfo.balance) : formatCurrency(0)}
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 font-medium">Available for Withdrawal</span>
                  <span className="text-xl font-bold text-blue-800">{formatCurrency(availableBalance)}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  *Minimum balance of 100 ETB must be maintained
                </p>
              </div>
              
              {accountInfo && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Account Number</span>
                    <span className="font-mono text-gray-900">{accountInfo.account_number}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Account Type</span>
                    <span className="font-semibold text-gray-900 capitalize">{accountInfo.account_type}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Status</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      {accountInfo.status}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Withdrawal Amounts */}
            {suggestedAmounts.length > 0 ? (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <CurrencyDollarIcon className="w-6 h-6 mr-3 text-blue-600" />
                  Quick Amounts
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {suggestedAmounts.map((suggestedAmount, index) => (
                    <button
                      key={index}
                      onClick={() => setAmount(suggestedAmount.toString())}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-center font-semibold text-gray-700 hover:text-blue-700"
                    >
                      {formatCurrency(suggestedAmount)}
                    </button>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Quick Tip</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Click on any amount above to quickly fill the withdrawal form.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Insufficient Balance</h3>
                <p className="text-gray-600 text-sm">
                  You need to maintain a minimum balance of 100 ETB. Please deposit more funds to make withdrawals.
                </p>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-1">
            {availableBalance > 0 ? (
              <ModernPaymentForm
                type="withdrawal"
                amount={amount}
                onAmountChange={setAmount}
                onSubmit={handleWithdrawal}
                loading={loading}
              />
            ) : (
              <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ExclamationTriangleIcon className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Cannot Process Withdrawal</h3>
                <p className="text-gray-600 mb-6">
                  Your current balance is too low to make a withdrawal. You must maintain a minimum balance of 100 ETB.
                </p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-bold">{formatCurrency(accountInfo?.balance || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Minimum Required:</span>
                    <span className="font-bold">100 ETB</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Available for Withdrawal:</span>
                    <span className="font-bold text-red-600">{formatCurrency(availableBalance)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-blue-600" />
                Recent Withdrawals
              </h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {recentTransactions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentTransactions.map((transaction, index) => (
                    <div key={transaction.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                            <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Withdrawal</p>
                            <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">-{formatCurrency(Math.abs(transaction.amount))}</p>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No recent withdrawals</p>
                  <p className="text-sm text-gray-400 mt-1">Your withdrawal history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Information */}
        <div className="mt-16 bg-white rounded-3xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Withdrawal Security & Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure Processing</h4>
              <p className="text-gray-600">All withdrawals are processed securely with multiple verification steps.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Instant Transfer</h4>
              <p className="text-gray-600">Funds are transferred to your selected payment method immediately.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BanknotesIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Minimum Balance</h4>
              <p className="text-gray-600">A minimum balance of 100 ETB must be maintained in your account.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdrawal;