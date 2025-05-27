import { useState, useEffect } from 'react';
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  ChartBarIcon,
  TableCellsIcon,
  ArrowPathIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../../services/api';

const Reports = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('loans'); // loans, repayments, users
  const [timeRange, setTimeRange] = useState('month'); // week, month, year, all
  const [chartView, setChartView] = useState('overview'); // overview, trend, distribution
  const [reportData, setReportData] = useState({
    loans: [],
    repayments: [],
    users: [],
    summary: {
      totalLoans: 0,
      totalRepayments: 0,
      averageLoanAmount: 0,
      repaymentRate: 0,
      defaultRate: 0,
      activeUsers: 0
    },
    charts: {
      loanTrends: [],
      repaymentDistribution: [],
      userGrowth: [],
      statusDistribution: []
    }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch loans
      const loansResponse = await api.get('/api/v1/loans', { 
        params: { admin: 'True' },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });
      const loans = Array.isArray(loansResponse.data) ? loansResponse.data : [];

      // Fetch repayments
      const repaymentsResponse = await api.get('/api/v1/repayments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });
      const repayments = Array.isArray(repaymentsResponse.data) ? repaymentsResponse.data : [];

      // Fetch users
      const usersResponse = await api.get('/api/v1/users', { 
        params: { admin: 'True' },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_id')}`,
          'Content-Type': 'application/json'
        }
      });
      const users = Array.isArray(usersResponse.data) ? usersResponse.data.filter(u => !u.admin) : [];

      // Calculate summary statistics
      const activeLoans = loans.filter(loan => ['approved', 'active'].includes(loan.status?.toLowerCase()));
      const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0);
      const totalRepaidAmount = repayments.reduce((sum, repayment) => sum + repayment.amount, 0);
      const defaultedLoans = loans.filter(loan => loan.status?.toLowerCase() === 'defaulted');

      // Prepare chart data
      const loanTrends = prepareLoanTrends(loans);
      const repaymentDistribution = prepareRepaymentDistribution(repayments);
      const userGrowth = prepareUserGrowth(users);
      const statusDistribution = prepareStatusDistribution(loans);

      const summary = {
        totalLoans: loans.length,
        totalRepayments: repayments.length,
        averageLoanAmount: totalLoanAmount / (activeLoans.length || 1),
        repaymentRate: (totalRepaidAmount / totalLoanAmount) * 100 || 0,
        defaultRate: (defaultedLoans.length / loans.length) * 100 || 0,
        activeUsers: users.length
      };

      setReportData({
        loans,
        repayments,
        users,
        summary,
        charts: {
          loanTrends,
          repaymentDistribution,
          userGrowth,
          statusDistribution
        }
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.response?.data?.message || 'Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  };

  const prepareLoanTrends = (loans) => {
    const monthlyData = {};
    loans.forEach(loan => {
      const date = new Date(loan.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthYear,
          totalAmount: 0,
          count: 0
        };
      }
      monthlyData[monthYear].totalAmount += loan.amount;
      monthlyData[monthYear].count += 1;
    });
    return Object.values(monthlyData);
  };

  const prepareRepaymentDistribution = (repayments) => {
    const distribution = {};
    repayments.forEach(repayment => {
      const amount = Math.floor(repayment.amount / 1000) * 1000; // Group by thousands
      const range = `${(amount / 1000)}k-${(amount / 1000 + 1)}k`;
      distribution[range] = (distribution[range] || 0) + 1;
    });
    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count
    }));
  };

  const prepareUserGrowth = (users) => {
    const monthlyData = {};
    users.forEach(user => {
      const date = new Date(user.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthYear,
          users: 0
        };
      }
      monthlyData[monthYear].users += 1;
    });
    return Object.values(monthlyData);
  };

  const prepareStatusDistribution = (loans) => {
    const distribution = {};
    loans.forEach(loan => {
      const status = loan.status || 'Unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return Object.entries(distribution).map(([status, value]) => ({
      status,
      value
    }));
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const filterDataByTimeRange = (data) => {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return data;
    }

    return data.filter(item => new Date(item.created_at) >= startDate);
  };

  const getDisplayData = () => {
    const filteredData = filterDataByTimeRange(reportData[reportType]);
    return filteredData.map(item => {
      switch (reportType) {
        case 'loans':
          return {
            id: item.id,
            date: new Date(item.created_at).toLocaleDateString(),
            amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount),
            status: item.status || item.loan_status,
            type: item.type || 'Standard'
          };
        case 'repayments':
          return {
            id: item.id,
            date: new Date(item.created_at).toLocaleDateString(),
            amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount),
            status: item.status,
            method: item.payment_method || 'N/A'
          };
        case 'users':
          return {
            id: item.id,
            name: item.fullname || item.username,
            email: item.email,
            joinDate: new Date(item.created_at).toLocaleDateString(),
            status: item.status || 'Active'
          };
        default:
          return item;
      }
    });
  };

  const downloadReport = () => {
    const data = getDisplayData();
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white shadow rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-full ${color} bg-opacity-80`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900">
            {typeof value === 'number' && title.toLowerCase().includes('amount')
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
              : typeof value === 'number' && title.toLowerCase().includes('rate')
                ? `${value.toFixed(1)}%`
                : value}
          </p>
        </div>
      </div>
    </div>
  );

  const renderCharts = () => {
    switch (chartView) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Loan Trends Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Loan Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.charts.loanTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="totalAmount" stroke="#8884d8" fill="#8884d8" name="Total Amount" />
                  <Area type="monotone" dataKey="count" stroke="#82ca9d" fill="#82ca9d" name="Number of Loans" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Loan Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.charts.statusDistribution}
                    dataKey="value"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {reportData.charts.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Repayment Distribution Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Repayment Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.charts.repaymentDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Number of Repayments" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* User Growth Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">User Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.charts.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#82ca9d" name="New Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      // Add more chart views as needed
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Comprehensive financial reports and statistics</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchReportData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-500" />
            Refresh
          </button>
          <button
            onClick={downloadReport}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Download Report
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-300 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Report Controls */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="loans">Loans Report</option>
              <option value="repayments">Repayments Report</option>
              <option value="users">Users Report</option>
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <CalendarIcon className="h-5 w-5" />
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Loans"
              value={reportData.summary.totalLoans}
              icon={ChartBarIcon}
              color="bg-blue-500"
            />
            <StatCard
              title="Average Loan Amount"
              value={reportData.summary.averageLoanAmount}
              icon={ChartBarIcon}
              color="bg-green-500"
            />
            <StatCard
              title="Repayment Rate"
              value={reportData.summary.repaymentRate}
              icon={ChartBarIcon}
              color="bg-yellow-500"
            />
            <StatCard
              title="Default Rate"
              value={reportData.summary.defaultRate}
              icon={ChartBarIcon}
              color="bg-red-500"
            />
            <StatCard
              title="Active Users"
              value={reportData.summary.activeUsers}
              icon={ChartBarIcon}
              color="bg-purple-500"
            />
            <StatCard
              title="Total Repayments"
              value={reportData.summary.totalRepayments}
              icon={ChartBarIcon}
              color="bg-indigo-500"
            />
          </div>

          {/* Charts Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Visual Analytics</h2>
              <p className="text-sm text-gray-500">Interactive charts and graphs for data analysis</p>
            </div>
            {renderCharts()}
          </div>

          {/* Data Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Details
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {getDisplayData()[0] && Object.keys(getDisplayData()[0]).map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getDisplayData().map((item) => (
                    <tr key={item.id}>
                      {Object.values(item).map((value, index) => (
                        <td
                          key={index}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
