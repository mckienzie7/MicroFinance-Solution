import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const navigation = {
  main: [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
};

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-400 bg-clip-text text-transparent">
                MF-Solution
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Moved before auth section */}
          <div className="hidden lg:flex lg:mx-8 lg:flex-1 lg:justify-center">
            <div className="flex gap-x-8">
              {navigation.main.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 whitespace-nowrap"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Auth Section */}
          <div className="hidden lg:flex lg:items-center lg:gap-x-6">
            {user ? (
              <div className="flex items-center gap-x-4">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <span className="mr-2">Welcome, {user.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <ArrowRightOnRectangleIcon className="mr-1 h-5 w-5" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 whitespace-nowrap"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 z-50 bg-gray-900/50" onClick={closeMobileMenu} />
          <div className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <Link to="/" className="-m-1.5 p-1.5" onClick={closeMobileMenu}>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  MicroFinance Solution
                </span>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={closeMobileMenu}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.main.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                      onClick={closeMobileMenu}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6">
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <span className="mr-2 font-medium">Welcome, {user.name}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          closeMobileMenu();
                        }}
                        className="flex w-full items-center justify-start text-sm font-medium text-gray-700 hover:text-blue-600"
                      >
                        <ArrowRightOnRectangleIcon className="mr-1 h-5 w-5" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Link
                        to="/login"
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        onClick={closeMobileMenu}
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        className="-mx-3 block rounded-lg bg-blue-600 px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-blue-500"
                        onClick={closeMobileMenu}
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;