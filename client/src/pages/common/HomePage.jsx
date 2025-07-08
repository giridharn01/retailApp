import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../utils/api';

const HomePage = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Refetch data when navigating back to home page
  useEffect(() => {
    if (location.pathname === '/') {
      fetchHomeData();
    }
  }, [location.pathname]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch featured products (limit to 6 most recent or popular products)
      const productsRes = await apiRequest('/products?limit=6&sort=-createdAt');
      
      // Fetch service types for services section
      const servicesRes = await apiRequest('/service-types');

      setFeaturedProducts(productsRes.data || []);
      setServices(servicesRes.data || []);
    } catch (err) {
      console.error('Error fetching home data:', err);
      setError('Failed to load some content. Please refresh the page.');
      
      // Fallback to static data if API fails
      setFeaturedProducts([
        {
          _id: 'fallback-1',
          name: 'Sample Product',
          description: 'High-quality product for your needs',
          price: 999,
          image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
        }
      ]);

      setServices([
        {
          _id: 'service-1',
          name: 'Electrical Services',
          description: 'Professional electrical solutions'
        },
        {
          _id: 'service-2',
          name: 'Hardware Supply',
          description: 'Quality hardware supplies'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (serviceName) => {
    const iconMap = {
      'electrical': '⚡',
      'hardware': '🔧',
      'agri': '🌾',
      'agricultural': '🌾',
      'tech': '💻',
      'technology': '💻',
      'service': '🔧',
      'repair': '🔧',
      'supply': '📦'
    };

    const serviceLower = serviceName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (serviceLower.includes(key)) {
        return icon;
      }
    }
    return '⚙️'; // Default icon
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-32">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              <span className="block">Palani andavar</span>
              <span className="block text-yellow-400 mt-2">Electrical • Hardware • Agri-Tech</span>
            </h1>
            <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto">
              Your trusted partner for innovative electrical solutions, quality hardware, and cutting-edge agricultural technology.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                to="/products"
                className="inline-block bg-yellow-400 text-blue-900 px-8 py-3 rounded-md font-semibold hover:bg-yellow-300 transition-colors"
              >
                Explore Products
              </Link>
              <Link
                to="/service-request"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-blue-50 transition-colors"
              >
                Request Service
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      {!isAdmin && (
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Our Services
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Comprehensive solutions for all your electrical, hardware, and agricultural needs
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-md bg-yellow-50 p-4">
                <div className="text-sm text-yellow-700">{error}</div>
              </div>
            )}

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <div className="p-8">
                    <div className="text-5xl mb-6">{getServiceIcon(service.name)}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {service.description || 'Professional service for all your needs'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Products Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Featured Products
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our latest and most popular products for your home, business, and farm
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'}
                    alt={product.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {product.description || 'High-quality product for your needs'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{product.price}
                    </span>
                    <Link
                      to={`/products/${product._id}`}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {featuredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      {!isAdmin && (
        <div className="bg-blue-600">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-20">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Need Professional Help?
              </h2>
              <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
                Our team of experts is ready to assist you with any electrical, hardware, or agri-tech needs.
                Get in touch today for a consultation.
              </p>
              <div className="mt-8">
                <Link
                  to="/service-request"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-blue-50 transition-colors"
                >
                  Request Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;