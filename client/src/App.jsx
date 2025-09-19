import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import Navbar from './components/Navbar';

// Lazy load major pages
const HomePage = lazy(() => import('./pages/common/HomePage'));
const LoginPage = lazy(() => import('./pages/common/LoginPage'));
const RegisterPage = lazy(() => import('./pages/common/RegisterPage'));
const ProductListPage = lazy(() => import('./pages/common/ProductListPage'));
const ProductDetailPage = lazy(() => import('./pages/common/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/user/CartPage'));
const CheckoutPage = lazy(() => import('./pages/user/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/user/OrdersPage'));
const ServiceRequestPage = lazy(() => import('./pages/user/ServiceRequestPage'));
const UserProfilePage = lazy(() => import('./pages/user/UserProfilePage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProductManagementPage = lazy(() => import('./pages/admin/AdminProductManagementPage'));
const AdminOrderManagementPage = lazy(() => import('./pages/admin/AdminOrderManagementPage'));
const AdminServiceRequestManagementPage = lazy(() => import('./pages/admin/AdminServiceRequestManagementPage'));
const AdminServiceTypesPage = lazy(() => import('./pages/admin/AdminServiceTypesPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));

// Protected Route component
const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

// Customer-only Route component (excludes admins)
const CustomerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 relative">
          <Navbar />
          <main className="container mx-auto px-4 py-8 relative z-10">
            <Suspense fallback={<div className="flex justify-center items-center min-h-[40vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>}>
              <Routes>
                {/* Common Routes */}
                {/* Make product list the landing page */}
                <Route path="/" element={<ProductListPage />} />
                {/* Preserve HomePage at /home in case anything links to it */}
                <Route path="/home" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />

                {/* User Routes */}
                  <Route path="/cart" element={<CustomerRoute><CartPage /></CustomerRoute>} />
                  <Route path="/checkout" element={<CustomerRoute><CheckoutPage /></CustomerRoute>} />
                  <Route path="/orders" element={<CustomerRoute><OrdersPage /></CustomerRoute>} />
                  <Route path="/orders/:id" element={<CustomerRoute><OrdersPage /></CustomerRoute>} />
                  <Route path="/service-request" element={<CustomerRoute><ServiceRequestPage /></CustomerRoute>} />
                <Route path="/profile" element={<PrivateRoute><UserProfilePage /></PrivateRoute>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<PrivateRoute requireAdmin><AdminDashboardPage /></PrivateRoute>} />
                <Route path="/admin/products" element={<PrivateRoute requireAdmin><AdminProductManagementPage /></PrivateRoute>} />
                  <Route path="/admin/orders" element={<PrivateRoute requireAdmin><AdminOrderManagementPage /></PrivateRoute>} />
                <Route path="/admin/service-requests" element={<PrivateRoute requireAdmin><AdminServiceRequestManagementPage /></PrivateRoute>} />
                <Route path="/admin/service-types" element={<PrivateRoute requireAdmin><AdminServiceTypesPage /></PrivateRoute>} />
                <Route path="/admin/users" element={<PrivateRoute requireAdmin><AdminUsersPage /></PrivateRoute>} />
                <Route path="/admin/reports" element={<PrivateRoute requireAdmin><AdminReportsPage /></PrivateRoute>} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App; 