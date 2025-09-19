import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-indigo- shadow-lg relative z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-800">Palani andavar</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link to="/products" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                Products
              </Link>
              {/* For customers: show links; for guests: show same links but they go to login */}
              {(!isAdmin) && (
                <>
                  <Link to={user ? "/service-request" : "/login"} className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                    Service Request
                  </Link>
                  <Link to={user ? "/orders" : "/login"} className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                    My Orders
                  </Link>
                </>
              )}
              {isAdmin && (
                <div className="flex space-x-8">
                  <Link to="/admin/products" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                    Manage Products
                  </Link>
                  <Link to="/admin/service-requests" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                    Service Requests
                  </Link>
                  <Link to="/admin/service-types" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                    Service Types
                  </Link>
                  <Link to="/admin/orders" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                    Orders
                  </Link>
                  <Link to="/admin/reports" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-700">
                    Reports
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Cart: visible for customers; guests see it but redirect to login */}
            {!isAdmin && (
              <Link to={user ? "/cart" : "/login"} className="relative inline-flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors">
                Cart
                {user && getCartItemCount() > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </Link>
            )}
            {user ? (
              <div className="flex items-center">
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-medium text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden md:block text-sm font-medium">{user.name}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1" role="menu">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Your Profile
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Guest view: show a profile icon that leads to login alongside Login/Register
              <div className="flex items-center space-x-3">
                <Link to="/login" className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-700">
                  {/* Simple user icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75H4.5v-.75z" />
                  </svg>
                </Link>
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center ml-2">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/products"
            className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            Products
          </Link>
          {/* Mobile: show same links for guests but route to login */}
          {!isAdmin && (
            <>
              <Link
                to={user ? "/service-request" : "/login"}
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Service Request
              </Link>
              <Link
                to={user ? "/orders" : "/login"}
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                My Orders
              </Link>
              <Link
                to={user ? "/cart" : "/login"}
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Cart
              </Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link
                to="/admin/products"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Manage Products
              </Link>
              <Link
                to="/admin/service-requests"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Service Requests
              </Link>
              <Link
                to="/admin/service-types"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Service Types
              </Link>
              <Link
                to="/admin/orders"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Orders
              </Link>
              <Link
                to="/admin/reports"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Reports
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 