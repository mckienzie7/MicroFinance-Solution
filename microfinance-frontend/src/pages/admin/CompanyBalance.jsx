import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Cell, 
  Pie,
  BarChart, 
  Bar,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter,
  ScatterChart
} from 'recharts';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowsRightLeftIcon,
  ChartPieIcon,
  ClockIcon,
  CalendarDaysIcon,
  FunnelIcon,
  PresentationChartLineIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  ShieldCheckIcon,
  FireIcon,
  SparklesIcon,
  EyeIcon,
  ArrowPathIcon,
  FaceSmileIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const CompanyBalance = () => {
  const [companyData, setCompanyData] = useState(null);
  const [loanAnalytics, setLoanAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('12months');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({});

  useEffect(() => {
    fetchCompanyData();
    fetchLoanAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Animate numbers when data changes
  useEffect(() => {
    if (companyData) {
      animateValue('balance', 0, companyData.overview?.company_balance || 0, 2000);
      animateValue('customers', 0, companyData.overview?.total_customers || 0, 1500);
      animateValue('profit', 0, companyData.overview?.profit_loss || 0, 2500);
      animateValue('loans', 0, companyData.loans?.active_loans || 0, 1800);
    }
  }, [companyData]);

  const animateValue = (key, start, end, duration) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (end - start) * easeOutCubic(progress);
      
      setAnimatedValues(prev => ({ ...prev, [key]: current }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/company/overview');
      if (!response.ok) throw new Error('Failed to fetch company data');
      const data = await response.json();
      setCompanyData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchLoanAnalytics = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/company/loan-analytics');
      if (!response.ok) throw new Error('Failed to fetch loan analytics');
      const data = await response.json();
      setLoanAnalytics(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchCompanyData(), fetchLoanAnalytics()]);
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount).replace('ETB', 'ETB ');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'profit': return <ArrowTrendingUpIcon className="w-6 h-6" />;
      case 'loss': return <ArrowTrendingDownIcon className="w-6 h-6" />;
      default: return <ChartBarIcon className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'profit': return 'text-green-600 bg-green-100';
      case 'loss': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Error loading company data: {error}
      </div>
    );
  }

  const pieChartData = loanAnalytics?.status_breakdown ? 
    Object.entries(loanAnalytics.status_breakdown).map(([status, data]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: data.count,
      amount: data.amount
    })) : [];

  const trendData = companyData?.trends?.map(trend => ({
    ...trend,
    profit: trend.repayments - trend.loans_issued + (trend.deposits * 0.1)
  })) || [];

  // Advanced data calculations
  const performanceScore = companyData ? Math.min(100, Math.max(0, 
    (companyData.overview?.profit_loss || 0) / 1000 * 10 + 
    (100 - (companyData.loans?.loan_default_rate || 0)) + 
    Math.min(50, (companyData.overview?.total_customers || 0) * 2)
  )) : 0;

  const healthStatus = performanceScore >= 80 ? 'Excellent' : 
                      performanceScore >= 60 ? 'Good' : 
                      performanceScore >= 40 ? 'Fair' : 'Needs Attention';

  const healthColor = performanceScore >= 80 ? 'text-green-600' : 
                     performanceScore >= 60 ? 'text-blue-600' : 
                     performanceScore >= 40 ? 'text-yellow-600' : 'text-red-600';

  // Advanced chart data
  const profitabilityData = trendData.map(trend => ({
    ...trend,
    roi: ((trend.repayments - trend.loans_issued) / Math.max(trend.loans_issued, 1)) * 100,
    growth_rate: trend.deposits > 0 ? ((trend.deposits - trend.withdrawals) / trend.deposits) * 100 : 0
  }));

  const riskMetrics = [
    { name: 'Low Risk', value: 65, color: '#10B981' },
    { name: 'Medium Risk', value: 25, color: '#F59E0B' },
    { name: 'High Risk', value: 10, color: '#EF4444' }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: PresentationChartLineIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'performance', name: 'Performance', icon: FireIcon },
    { id: 'risk', name: 'Risk Analysis', icon: ShieldCheckIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Financial Command Center
              </h1>
              <p className="text-gray-600 mt-2">Advanced analytics for your microfinance empire</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${companyData?.overview?.status === 'profit' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-sm font-medium text-gray-700">Live Data</span>
              </div>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Score Banner */}
        <div className="mb-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Business Health Score</h2>
              <div className="flex items-center space-x-4">
                <div className="text-5xl font-bold">{Math.round(performanceScore)}</div>
                <div>
                  <div className={`text-lg font-semibold ${healthColor.replace('text-', 'text-white')}`}>{healthStatus}</div>
                  <div className="text-sm opacity-80">Out of 100 points</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <SparklesIcon className="w-16 h-16 opacity-70 mb-2" />
              <div className="text-sm opacity-80">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          <div className="mt-4 bg-white bg-opacity-20 rounded-full h-3">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${performanceScore}%` }}
            ></div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Animated Company Balance Card */}
          <div className="group relative bg-gradient-to-br from-violet-500 via-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <BuildingLibraryIcon className="w-8 h-8 opacity-80" />
                <div className="text-xs bg-white/20 px-2 py-1 rounded-full">BALANCE</div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Company Balance</h3>
              <p className="text-3xl font-bold mb-2 font-mono">
                {formatCurrency(animatedValues.balance || 0)}
              </p>
              <div className="flex items-center space-x-2">
                {getStatusIcon(companyData?.overview?.status)}
                <span className="text-sm font-medium">
                  {companyData?.overview?.status?.toUpperCase() || 'STABLE'}
                </span>
              </div>
            </div>
          </div>

          {/* Animated Customers Card */}
          <div className="group relative bg-gradient-to-br from-rose-500 via-pink-500 to-pink-700 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <UsersIcon className="w-8 h-8 opacity-80" />
                <div className="text-xs bg-white/20 px-2 py-1 rounded-full">CUSTOMERS</div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Total Customers</h3>
              <p className="text-3xl font-bold mb-2 font-mono">
                {Math.round(animatedValues.customers || 0)}
              </p>
              <div className="flex items-center space-x-2">
                <FaceSmileIcon className="w-4 h-4" />
                <span className="text-sm">Active Accounts</span>
              </div>
            </div>
          </div>

          {/* Animated Profit Card */}
          <div className="group relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <CurrencyDollarIcon className="w-8 h-8 opacity-80" />
                <div className="text-xs bg-white/20 px-2 py-1 rounded-full">PROFIT</div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Total Profit</h3>
              <p className="text-3xl font-bold mb-2 font-mono">
                {formatCurrency(animatedValues.profit || 0)}
              </p>
              <div className="flex items-center space-x-2">
                <ArrowTrendingUpIcon className="w-4 h-4" />
                <span className="text-sm">Interest Earned</span>
              </div>
            </div>
          </div>

          {/* Animated Loans Card */}
          <div className="group relative bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <CreditCardIcon className="w-8 h-8 opacity-80" />
                <div className="text-xs bg-white/20 px-2 py-1 rounded-full">LOANS</div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Active Loans</h3>
              <p className="text-3xl font-bold mb-2 font-mono">
                {Math.round(animatedValues.loans || 0)}
              </p>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-4 h-4" />
                <span className="text-sm">{formatCurrency(companyData?.loans?.active_loan_amount || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-xl">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Advanced Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Enhanced Financial Trends */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <PresentationChartLineIcon className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-bold">Financial Performance Trends</h3>
                  </div>
                  <select 
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="6months">6 Months</option>
                    <option value="12months">12 Months</option>
                    <option value="24months">24 Months</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={profitabilityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month_name" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(value), name]}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="deposits" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Deposits" />
                    <Area yAxisId="left" type="monotone" dataKey="repayments" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Repayments" />
                    <Bar yAxisId="left" dataKey="loans_issued" fill="#ffc658" name="Loans Issued" />
                    <Line yAxisId="right" type="monotone" dataKey="roi" stroke="#ff7300" strokeWidth={3} name="ROI %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Enhanced Loan Distribution */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center mb-6">
                  <ChartPieIcon className="w-6 h-6 text-purple-600 mr-3" />
                  <h3 className="text-xl font-bold">Loan Portfolio</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} loans`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {pieChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm font-medium">{entry.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-bold">Risk Assessment Dashboard</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{value: 100 - (companyData?.loans?.loan_default_rate || 0)}]}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="#10B981" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <h4 className="font-semibold text-green-600">Loan Success Rate</h4>
                  <p className="text-2xl font-bold">{(100 - (companyData?.loans?.loan_default_rate || 0)).toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{value: Math.min(100, performanceScore)}]}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="#3B82F6" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <h4 className="font-semibold text-blue-600">Business Health</h4>
                  <p className="text-2xl font-bold">{Math.round(performanceScore)}/100</p>
                </div>
                <div className="text-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{value: Math.min(100, (companyData?.transactions?.total_deposits / Math.max(companyData?.transactions?.total_withdrawals, 1)) * 20)}]}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="#F59E0B" />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <h4 className="font-semibold text-yellow-600">Liquidity Ratio</h4>
                  <p className="text-2xl font-bold">{((companyData?.transactions?.total_deposits / Math.max(companyData?.transactions?.total_withdrawals, 1)) || 0).toFixed(1)}:1</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Advanced Analytics Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer Growth Analysis */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <UsersIcon className="w-6 h-6 text-blue-600 mr-3" />
                  Customer Growth Analysis
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="deposits" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="withdrawals" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Profitability Breakdown */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-6 flex items-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600 mr-3" />
                  Profitability Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profitabilityData.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month_name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'ROI']} />
                    <Bar dataKey="roi" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-8">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                <FireIcon className="w-8 h-8 mb-4 opacity-80" />
                <h3 className="text-lg font-semibold mb-2">Performance Score</h3>
                <p className="text-3xl font-bold">{Math.round(performanceScore)}/100</p>
                <p className="text-sm opacity-80 mt-2">{healthStatus}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                <ArrowTrendingUpIcon className="w-8 h-8 mb-4 opacity-80" />
                <h3 className="text-lg font-semibold mb-2">Growth Rate</h3>
                <p className="text-3xl font-bold">+{((companyData?.overview?.profit_loss || 0) / 1000 * 100).toFixed(1)}%</p>
                <p className="text-sm opacity-80 mt-2">Monthly Average</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
                <CheckCircleIcon className="w-8 h-8 mb-4 opacity-80" />
                <h3 className="text-lg font-semibold mb-2">Success Rate</h3>
                <p className="text-3xl font-bold">{(100 - (companyData?.loans?.loan_default_rate || 0)).toFixed(1)}%</p>
                <p className="text-sm opacity-80 mt-2">Loan Repayment</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="space-y-8">
            {/* Risk Analysis */}
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <ExclamationCircleIcon className="w-6 h-6 text-red-600 mr-3" />
                Risk Analysis Dashboard
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-4">Risk Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={riskMetrics}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {riskMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-semibold text-green-800">Low Risk Indicators</h5>
                    <ul className="text-sm text-green-700 mt-2 space-y-1">
                      <li>• Strong repayment history</li>
                      <li>• Diversified loan portfolio</li>
                      <li>• Healthy cash flow</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h5 className="font-semibold text-yellow-800">Medium Risk Factors</h5>
                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                      <li>• Seasonal fluctuations</li>
                      <li>• Market competition</li>
                      <li>• Economic conditions</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h5 className="font-semibold text-red-800">High Risk Alerts</h5>
                    <ul className="text-sm text-red-700 mt-2 space-y-1">
                      <li>• Default rate: {(companyData?.loans?.loan_default_rate || 0).toFixed(2)}%</li>
                      <li>• Overdue payments monitoring</li>
                      <li>• Concentration risk assessment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Recent Activities */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <ClockIcon className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-bold">Live Activity Feed</h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Real-time updates</span>
            </div>
          </div>
          <div className="space-y-3">
            {companyData?.recent_activities?.slice(0, 8).map((activity, index) => (
              <div key={index} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                  activity.type === 'loan' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                }`}>
                  {activity.type === 'loan' ? <CreditCardIcon className="w-5 h-5" /> : <BanknotesIcon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleString()}</p>
                </div>
                <div className={`text-lg font-bold ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {activity.amount > 0 ? '+' : ''}{formatCurrency(activity.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyBalance;