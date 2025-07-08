import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">Retail & Agri-Tech</Link>
      <nav className="space-x-4 flex items-center">
        <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
        <Link to="/cart" className="text-gray-700 hover:text-blue-600">Cart</Link>
        {user && <Link to="/orders" className="text-gray-700 hover:text-blue-600">Orders</Link>}
        {user && <Link to="/services" className="text-gray-700 hover:text-blue-600">Services</Link>}
        {user && user.role === 'admin' && <Link to="/admin" className="text-gray-700 hover:text-blue-600">Admin</Link>}
        {!user ? (
          <Link to="/signin" className="text-gray-700 hover:text-blue-600">Sign In</Link>
        ) : (
          <>
            <span className="text-gray-700">{user.name}</span>
            <button onClick={handleSignOut} className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Sign Out</button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header; 