import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    products: 0,
    // orders: 0,
    serviceRequests: 0,
    users: 0,
    pendingRequests: 0,
    completedRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [productsRes, serviceRequestsRes, usersRes] = await Promise.all([
        apiRequest('/products?limit=1000'),
        // apiRequest('/orders'),
        apiRequest('/service-requests?limit=1000'),
        apiRequest('/users?limit=1000')
      ]);

      const pendingRequests = serviceRequestsRes.data.filter(req => req.status === 'pending').length;
      const completedRequests = serviceRequestsRes.data.filter(req => req.status === 'completed').length;

      setStats({
        products: productsRes.data.length,
        // orders: ordersRes.data.length,
        serviceRequests: serviceRequestsRes.data.length,
        users: usersRes.data.length,
        pendingRequests,
        completedRequests
      });
    } catch (err) {
      setError('Failed to fetch dashboard statistics');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Total Products',
      value: stats.products,
      icon: '📦',
      color: 'bg-blue-500',
      link: '/admin/products'
    },
    // {
    //   title: 'Total Orders',
    //   value: stats.orders,
    //   icon: '🛒',
    //   color: 'bg-green-500',
    //   link: '/admin/orders'
    // },
    {
      title: 'Service Requests',
      value: stats.serviceRequests,
      icon: '🔧',
      color: 'bg-purple-500',
      link: '/admin/service-requests'
    },
    {
      title: 'Total Users',
      value: stats.users,
      icon: '👥',
      color: 'bg-orange-500',
      link: '/admin/users'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: '⏳',
      color: 'bg-yellow-500',
      link: '/admin/service-requests'
    },
    {
      title: 'Completed Requests',
      value: stats.completedRequests,
      icon: '✅',
      color: 'bg-green-600',
      link: '/admin/service-requests'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Products',
      description: 'Add, edit, or remove products from inventory',
      icon: '📦',
      link: '/admin/products',
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'Service Requests',
      description: 'View and manage customer service requests',
      icon: '🔧',
      link: '/admin/service-requests',
      color: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      title: 'Service Types',
      description: 'Configure service and equipment types',
      icon: '⚙️',
      link: '/admin/service-types',
      color: 'bg-gray-50 hover:bg-gray-100'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to your admin control panel</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview Statistics</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardCards.map((card, index) => (
              <Link
                key={index}
                to={card.link}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-md ${card.color}`}>
                      <span className="text-2xl">{card.icon}</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {card.title}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {card.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`${action.color} border border-gray-200 rounded-lg p-6 transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">{action.icon}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="text-center py-8">
              <span className="text-2xl">📊</span>
              <p className="mt-2 text-gray-500">Activity tracking coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage; 