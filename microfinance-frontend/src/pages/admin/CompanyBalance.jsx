import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const CompanyBalance = () => {
  const [balance, setBalance] = useState(0);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [totalLoansGiven, setTotalLoansGiven] = useState(0);
  const [totalRepaymentsReceived, setTotalRepaymentsReceived] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculate growth rate (for demonstration - would be calculated from real data)
  const growthRate = totalDeposits > 0 ? ((balance / totalDeposits) * 100 - 100).toFixed(1) : 0;

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    try {
      setLoading(true);
      setError('');
      
      try {
        // Fetch all transactions
        const transactionsResponse = await api.get('/api/v1/transactions');
        
        if (transactionsResponse.data && Array.isArray(transactionsResponse.data)) {
          // Process each transaction type separately
          let depositSum = 0;
          let loanDisbursementSum = 0;
          let loanRepaymentSum = 0;
          
          // Log all transactions for debugging
          console.log('All transactions:', transactionsResponse.data);
          
          // Log all transactions for detailed debugging
          console.log('All transactions with details:');
          transactionsResponse.data.forEach(transaction => {
            console.log(`Transaction ID: ${transaction.id}`);
            console.log(`  Type: ${transaction.transaction_type}`);
            console.log(`  Amount: ${transaction.amount}`);
            console.log(`  Raw Amount Type: ${typeof transaction.amount}`);
            console.log(`  Parsed Amount: ${parseFloat(transaction.amount)}`);
          });

          // Process each transaction
          transactionsResponse.data.forEach(transaction => {
            // Check if transaction_type is exactly 'loan_repayment' (case sensitive)
            if (transaction.transaction_type === 'loan_repayment') {
              console.log('Found loan repayment transaction:', transaction);
            }
            
            // Make sure amount is a number
            let amount;
            try {
              amount = Math.abs(parseFloat(transaction.amount || 0));
              if (isNaN(amount)) {
                console.error('Invalid amount for transaction:', transaction);
                amount = 0;
              }
            } catch (err) {
              console.error('Error parsing amount:', err, transaction);
              amount = 0;
            }
            
            // Check transaction type case-insensitively
            const transactionType = transaction.transaction_type?.toLowerCase();
            
            // Log the normalized transaction type
            console.log(`Normalized transaction type: ${transactionType}`);
            
            if (transactionType === 'deposit') {
              depositSum += amount;
              console.log(`Added ${amount} to deposits total`);
            } else if (transactionType === 'loan_disbursement' || transactionType === 'loan disbursement') {
              loanDisbursementSum += amount;
              console.log(`Added ${amount} to loan disbursements total`);
            } else if (transactionType === 'loan_repayment' || transactionType === 'loan repayment') {
              loanRepaymentSum += amount;
              console.log(`Added ${amount} to loan repayments total`);
            } else {
              // Ignore other transaction types
              console.log(`Ignored transaction type: ${transaction.transaction_type}`);
            }
          });
          
          // Calculate company balance
          const companyBalance = depositSum + loanRepaymentSum - loanDisbursementSum;
          
          console.log('Financial Data Summary:', 
                      '\nDeposits:', depositSum,
                      '\nLoan Disbursements:', loanDisbursementSum,
                      '\nLoan Repayments:', loanRepaymentSum,
                      '\nNet Balance:', companyBalance);
          
          // Update state with calculated values
          setBalance(companyBalance);
          setTotalDeposits(depositSum);
          setTotalLoansGiven(loanDisbursementSum);
          setTotalRepaymentsReceived(loanRepaymentSum);
        } else {
          console.error('Invalid transaction data format:', transactionsResponse.data);
          setError('Invalid data received from server');
        }
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError('Failed to load financial data. Please check if the backend server is running.');
      }
    } catch (err) {
      console.error('Error in fetchBalanceData:', err);
      // Don't set fallback values - we want to show the error to the user
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Company Financial Overview</h2>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Current financial status</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700 text-sm sm:text-base">{error}</p>
        </div>
      )}
      
      <div className="flex justify-end mb-6">
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={fetchBalanceData}
        >
          Refresh Data
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Balance Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                <h3 className="text-lg font-medium mb-2">Company Balance</h3>
                <div className="flex items-center">
                  <div className="p-3 bg-white bg-opacity-20 rounded-full mr-4">
                    <ChartBarIcon className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(balance)}</p>
                </div>
                <p className="mt-2 text-sm text-white text-opacity-80">Total available funds</p>
              </div>
            </div>
            
            {/* Total Deposits Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <h3 className="text-lg font-medium mb-2">Total Deposits</h3>
                <div className="flex items-center">
                  <div className="p-3 bg-white bg-opacity-20 rounded-full mr-4">
                    <BanknotesIcon className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(totalDeposits)}</p>
                </div>
                <p className="mt-2 text-sm text-white text-opacity-80">Growth rate: {growthRate}%</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loans Given Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-orange-100 rounded-full mr-3">
                    <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">Total Loans Given</h3>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(totalLoansGiven)}</p>
                <p className="text-sm text-gray-500">Money disbursed as loans</p>
              </div>
            </div>
            
            {/* Repayments Received Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-full mr-3">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">Total Repayments Received</h3>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(totalRepaymentsReceived)}</p>
                <p className="text-sm text-gray-500">Money received from loan repayments</p>
              </div>
            </div>
          </div>
          
          {/* Financial Summary Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Financial Summary</h3>
              <p className="text-gray-700 mb-4">
                The company balance represents the total available funds, calculated as:<br />
                <span className="font-medium">Deposits + Loan Repayments - Loan Disbursements = {formatCurrency(balance)}</span>
              </p>
              <div className="space-y-2 text-gray-700">
                <p>• Total deposits received: {formatCurrency(totalDeposits)}</p>
                <p>• Total loans given: {formatCurrency(totalLoansGiven)}</p>
                <p>• Total repayments received: {formatCurrency(totalRepaymentsReceived)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBalance;
