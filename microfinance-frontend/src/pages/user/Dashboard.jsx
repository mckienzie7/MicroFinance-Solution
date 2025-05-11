import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCardIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  // For development: Use mock user data
  const user = {
    email: 'user@example.com',
    name: 'Test User'
  };
  
  // Mock data - in a real app, this would come from an API
  const [stats, setStats] = useState({
    activeLoans: 0,
    pendingApplications: 0,
    totalRepaid: 0,
    nextPayment: null,
    recentTransactions: [],
    loanHistory: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchUserDashboardData = () => {
      setIsLoading(true);
      
      // Mock data
      setTimeout(() => {
        setStats({
          activeLoans: 1,
          pendingApplications: 1,
          totalRepaid: 2500,
          nextPayment: {
            amount: 500,
            dueDate: '2025-05-15'
          },
          recentTransactions: [
            { id: 1, type: 'Payment', amount: 500, status: 'Completed', date: '2025-04-15' },
            { id: 2, type: 'Disbursement', amount: 5000, status: 'Completed', date: '2025-03-01' }
          ],
          loanHistory: [
            { 
              id: 1, 
              amount: 5000, 
              status: 'Active', 
              startDate: '2025-03-01',
              endDate: '2025-09-01',
              progress: 30
            },
            { 
              id: 2, 
              amount: 2000, 
              status: 'Pending', 
              startDate: '2025-05-01',
              endDate: null,
              progress: 0
            }
          ]
        });
        setIsLoading(false);
      }, 1000);
    };

    fetchUserDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.firstName || 'User'}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of your loans and financial status
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Active Loans" 
              value={stats.activeLoans} 
              icon={CreditCardIcon}
              color="bg-blue-500"
            />
            <StatCard 
              title="Pending Applications" 
              value={stats.pendingApplications} 
              icon={ClockIcon}
              color="bg-yellow-500"
            />
            <StatCard 
              title="Total Repaid" 
              value={`$${stats.totalRepaid.toLocaleString()}`} 
              icon={CheckCircleIcon}
              color="bg-green-500"
            />
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-md p-3 bg-red-500">
                    <ExclamationCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Next Payment Due</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">
                          {stats.nextPayment ? `$${stats.nextPayment.amount} on ${stats.nextPayment.dueDate}` : 'No payment due'}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  to="/user/apply-loan"
                  className="btn-primary text-center"
                >
                  Apply for a New Loan
                </Link>
                <Link
                  to="/user/loans"
                  className="btn-secondary text-center"
                >
                  View My Loans
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Loan History */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  My Loans
                </h3>
              </div>
              <div className="overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {stats.loanHistory.map((loan) => (
                        <li key={loan.id} className="py-4">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  Loan #{loan.id}
                                </p>
                                <p className="text-sm text-gray-500">
                                  ${loan.amount} - {loan.startDate}
                                </p>
                              </div>
                              <div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  loan.status === 'Active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : loan.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {loan.status}
                                </span>
                              </div>
                            </div>
                            {loan.status === 'Active' && (
                              <div className="w-full">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                  <span>Progress</span>
                                  <span>{loan.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${loan.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6">
                    <Link
                      to="/user/loans"
                      className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View all loans
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Transactions
                </h3>
              </div>
              <div className="overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {stats.recentTransactions.map((transaction) => (
                        <li key={transaction.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {transaction.type}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                ${transaction.amount} - {transaction.date}
                              </p>
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                transaction.status === 'Completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
