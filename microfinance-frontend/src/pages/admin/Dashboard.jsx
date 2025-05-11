import { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  // Mock data - in a real app, this would come from an API
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeLoans: 0,
    pendingApplications: 0,
    totalDisbursed: 0,
    recentLoans: [],
    recentUsers: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = () => {
      setIsLoading(true);
      
      // Mock data
      setTimeout(() => {
        setStats({
          totalUsers: 156,
          activeLoans: 42,
          pendingApplications: 8,
          totalDisbursed: 125000,
          recentLoans: [
            { id: 1, user: 'John Doe', amount: 5000, status: 'Active', date: '2025-05-01' },
            { id: 2, user: 'Jane Smith', amount: 3000, status: 'Pending', date: '2025-05-03' },
            { id: 3, user: 'Robert Johnson', amount: 7500, status: 'Active', date: '2025-05-05' },
            { id: 4, user: 'Emily Davis', amount: 2000, status: 'Pending', date: '2025-05-07' }
          ],
          recentUsers: [
            { id: 1, name: 'Michael Brown', email: 'michael@example.com', date: '2025-05-06' },
            { id: 2, name: 'Sarah Wilson', email: 'sarah@example.com', date: '2025-05-05' },
            { id: 3, name: 'David Taylor', email: 'david@example.com', date: '2025-05-04' },
            { id: 4, name: 'Lisa Anderson', email: 'lisa@example.com', date: '2025-05-02' }
          ]
        });
        setIsLoading(false);
      }, 1000);
    };

    fetchDashboardData();
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
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of microfinance operations and statistics
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
              title="Total Users" 
              value={stats.totalUsers} 
              icon={UsersIcon}
              color="bg-blue-500"
            />
            <StatCard 
              title="Active Loans" 
              value={stats.activeLoans} 
              icon={CreditCardIcon}
              color="bg-green-500"
            />
            <StatCard 
              title="Pending Applications" 
              value={stats.pendingApplications} 
              icon={ExclamationCircleIcon}
              color="bg-yellow-500"
            />
            <StatCard 
              title="Total Disbursed" 
              value={`$${stats.totalDisbursed.toLocaleString()}`} 
              icon={BanknotesIcon}
              color="bg-purple-500"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent Loans */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Loan Applications
                </h3>
              </div>
              <div className="overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {stats.recentLoans.map((loan) => (
                        <li key={loan.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {loan.user}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                ${loan.amount} - {loan.date}
                              </p>
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                loan.status === 'Active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {loan.status}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6">
                    <a
                      href="#"
                      className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View all
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recently Registered Users
                </h3>
              </div>
              <div className="overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                      {stats.recentUsers.map((user) => (
                        <li key={user.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {user.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.date}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6">
                    <a
                      href="#"
                      className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View all
                    </a>
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
