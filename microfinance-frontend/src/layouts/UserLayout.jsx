import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfileDisplay from '../components/common/UserProfileDisplay';
import { 
  HomeIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  DocumentTextIcon, 
  UserCircleIcon, 
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Debug logging for user object in UserLayout
  console.log('UserLayout - User object:', user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/user/dashboard', icon: HomeIcon },
    { name: 'Savings Account', href: '/user/savings', icon: BanknotesIcon },
    { name: 'Apply for Loan', href: '/user/apply-loan', icon: BanknotesIcon },
    { name: 'My Loans', href: '/user/loans', icon: CreditCardIcon },
    { name: 'Loan Repayment', href: '/user/pay-loan', icon: CreditCardIcon },
    { name: 'AI Credit Score', href: '/user/credit-score', icon: DocumentTextIcon },
    { name: 'Profile', href: '/user/profile', icon: UserCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        {/* Overlay */}
        <div 
          className={`fixed inset-0 bg-gray-600 ${sidebarOpen ? 'opacity-75' : 'opacity-0 pointer-events-none'} transition-opacity ease-linear duration-300`}
          onClick={() => setSidebarOpen(false)}
        ></div>
        
        {/* Sidebar */}
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition ease-in-out duration-300`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">

          <div className="flex items-center justify-center">
                                    <Link to="/" className="flex items-center">
                                      
                                      <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-400 bg-clip-text text-transparent">
                                        MF-Solution
                                      </span>
                                    </Link>
                                  </div>

            <div className="flex-shrink-0 flex items-center justify-center px-4">
              <h1 className="text-xl font-bold">
                
              <span className="text-gray-900">User</span>
              <span className="ml-1 text-sm text-gray-500">Portal</span>
              </h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => 
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <UserProfileDisplay user={user} onLogout={handleLogout} />
            
          </div>
        </div>
        
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Force sidebar to shrink to fit close icon */}
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">

            <div className="flex items-center justify-center">
                                    <Link to="/" className="flex items-center">
                                      
                                      <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-400 bg-clip-text text-transparent">
                                        MF-Solution
                                      </span>
                                    </Link>
                                  </div>

            <div className="flex items-center justify-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold">
                
                <span className="text-gray-900">User</span>
                <span className="ml-1 text-sm text-gray-500">Portal</span>
              </h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => 
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full">
              <UserProfileDisplay user={user} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
