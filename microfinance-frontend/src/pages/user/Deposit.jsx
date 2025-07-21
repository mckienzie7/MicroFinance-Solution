import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ModernPaymentForm from '../../components/payments/ModernPaymentForm';
import api from '../../services/api';
import {
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Deposit = () => {
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
        const deposits = response.data
          .filter(transaction => transaction.transaction_type === 'deposit')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setRecentTransactions(deposits);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleDeposit = async (paymentData) => {
    setLoading(true);
    try {
      const response = await api.post('/api/v1/stripe/deposit', {
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
      console.error('Error processing deposit:', error);
      throw new Error(error.response?.data?.error || 'Deposit failed');
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

  const suggestedAmounts = [100, 500, 1000, 2000, 5000];

  if (accountLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Make a Deposit
          </h1>
          <p className="text-xl text-gray-600">
            Add funds to your account securely and instantly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Balance Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BanknotesIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Current Balance</h3>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {accountInfo ? formatCurrency(accountInfo.balance) : formatCurrency(0)}
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

            {/* Quick Deposit Amounts */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <ArrowTrendingUpIcon className="w-6 h-6 mr-3 text-green-600" />
                Quick Amounts
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {suggestedAmounts.map((suggestedAmount) => (
                  <button
                    key={suggestedAmount}
                    onClick={() => setAmount(suggestedAmount.toString())}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-center font-semibold text-gray-700 hover:text-green-700"
                  >
                    {formatCurrency(suggestedAmount)}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Quick Tip</p>
                    <p className="text-xs text-green-700 mt-1">
                      Click on any amount above to quickly fill the deposit form.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-1">
            <ModernPaymentForm
              type="deposit"
              amount={amount}
              onAmountChange={setAmount}
              onSubmit={handleDeposit}
              loading={loading}
            />
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-green-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-green-600" />
                Recent Deposits
              </h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {recentTransactions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentTransactions.map((transaction, index) => (
                    <div key={transaction.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Deposit</p>
                            <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+{formatCurrency(transaction.amount)}</p>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No recent deposits</p>
                  <p className="text-sm text-gray-400 mt-1">Your deposit history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 bg-white rounded-3xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Deposit with Us?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Instant Processing</h4>
              <p className="text-gray-600">Your deposits are processed instantly and reflected in your account immediately.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BanknotesIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure Transactions</h4>
              <p className="text-gray-600">All transactions are encrypted and secured with industry-standard protocols.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowTrendingUpIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Grow Your Savings</h4>
              <p className="text-gray-600">Start building your financial future with our competitive savings rates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposit;