import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { 
  DocumentArrowDownIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1E40AF',
  },
  subHeader: {
    fontSize: 18,
    marginBottom: 10,
    color: '#1E40AF',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    display: 'table',
    width: '100%',
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
  },
});

// PDF Document component
const SavingsPDFDocument = ({ accountData, transactions, statistics }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>Savings Account Report</Text>
        
        <Text style={styles.subHeader}>Account Information</Text>
        <Text style={styles.text}>Account Number: {accountData.account_number}</Text>
        <Text style={styles.text}>Current Balance: ${accountData.balance.toFixed(2)}</Text>
        <Text style={styles.text}>Account Status: {accountData.status}</Text>
        
        <Text style={styles.subHeader}>Transaction Summary</Text>
        <Text style={styles.text}>Total Deposits: ${statistics.totalDeposits.toFixed(2)}</Text>
        <Text style={styles.text}>Total Withdrawals: ${statistics.totalWithdrawals.toFixed(2)}</Text>
        <Text style={styles.text}>Number of Transactions: {statistics.totalTransactions}</Text>
        
        <Text style={styles.subHeader}>Recent Transactions</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Date</Text>
            <Text style={styles.tableCell}>Type</Text>
            <Text style={styles.tableCell}>Amount</Text>
          </View>
          {transactions.slice(0, 10).map((transaction, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>
                {new Date(transaction.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.tableCell}>{transaction.transaction_type}</Text>
              <Text style={styles.tableCell}>
                ${Math.abs(transaction.amount).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  </Document>
);

const SavingsReport = ({ accountData, transactions }) => {
  const [statistics, setStatistics] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransactions: 0,
    monthlyData: [],
  });

  useEffect(() => {
    calculateStatistics();
  }, [transactions]);

  const calculateStatistics = () => {
    const stats = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalTransactions: transactions.length,
      monthlyData: {},
    };

    // Process transactions
    transactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount);
      const date = new Date(transaction.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      if (transaction.transaction_type === 'deposit') {
        stats.totalDeposits += amount;
      } else if (transaction.transaction_type === 'withdrawal') {
        stats.totalWithdrawals += amount;
      }

      // Aggregate monthly data
      if (!stats.monthlyData[monthYear]) {
        stats.monthlyData[monthYear] = {
          deposits: 0,
          withdrawals: 0,
        };
      }

      if (transaction.transaction_type === 'deposit') {
        stats.monthlyData[monthYear].deposits += amount;
      } else if (transaction.transaction_type === 'withdrawal') {
        stats.monthlyData[monthYear].withdrawals += amount;
      }
    });

    setStatistics(stats);
  };

  // Prepare data for charts
  const monthlyChartData = {
    labels: Object.keys(statistics.monthlyData),
    datasets: [
      {
        label: 'Deposits',
        data: Object.values(statistics.monthlyData).map(data => data.deposits),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: 'Withdrawals',
        data: Object.values(statistics.monthlyData).map(data => data.withdrawals),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
      },
    ],
  };

  const balanceHistoryData = {
    labels: Object.keys(statistics.monthlyData),
    datasets: [
      {
        label: 'Balance History',
        data: Object.values(statistics.monthlyData).map((data, index, array) => {
          const previousBalance = index > 0 
            ? array.slice(0, index).reduce((acc, curr) => acc + curr.deposits - curr.withdrawals, 0)
            : 0;
          return previousBalance + data.deposits - data.withdrawals;
        }),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Savings Report</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <BanknotesIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-blue-600">Total Deposits</p>
                <p className="text-xl font-semibold text-blue-900">
                  ${statistics.totalDeposits.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-red-600">Total Withdrawals</p>
                <p className="text-xl font-semibold text-red-900">
                  ${statistics.totalWithdrawals.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-green-600">Net Savings</p>
                <p className="text-xl font-semibold text-green-900">
                  ${(statistics.totalDeposits - statistics.totalWithdrawals).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Transaction History</h3>
            <div className="h-80">
              <Bar data={monthlyChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Balance History</h3>
            <div className="h-80">
              <Line data={balanceHistoryData} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }} />
            </div>
          </div>
        </div>

        {/* PDF Download Button */}
        <div className="mt-6">
          <PDFDownloadLink
            document={<SavingsPDFDocument 
              accountData={accountData}
              transactions={transactions}
              statistics={statistics}
            />}
            fileName="savings-report.pdf"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {({ blob, url, loading, error }) =>
              loading ? (
                'Generating PDF...'
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Download PDF Report
                </>
              )
            }
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
};

export default SavingsReport; 