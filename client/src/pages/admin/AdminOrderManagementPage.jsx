import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../utils/api';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'ready-for-pickup', label: 'Ready for Pickup' },
  { value: 'cancelled', label: 'Cancelled' },
];

const AdminOrderManagementPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState({});
    const [editingTracking, setEditingTracking] = useState(false);
    const [trackingData, setTrackingData] = useState({
        trackingNumber: '',
        carrier: '',
        estimatedDelivery: ''
    });

    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, []);

    // --- Polling-based real-time updates (Vercel-compatible) ---
    useEffect(() => {
        console.log('AdminOrderManagementPage setting up polling for real-time updates');
        
        // Poll for updates every 20 seconds for admin pages
        const pollInterval = setInterval(() => {
            fetchOrders(true);
            fetchStats();
        }, 20000);

        // Also poll when admin focuses back on the tab
        const handleFocus = () => {
            fetchOrders(true);
            fetchStats();
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(pollInterval);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const fetchOrders = async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
            }
            const response = await apiRequest('/orders?limit=1000');
            const newOrders = response.data;
            
            setOrders(newOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const fetchStats = async () => {
        try {
            const response = await apiRequest('/orders/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const [updatingStatus, setUpdatingStatus] = useState({});
    const [statusUpdateSuccess, setStatusUpdateSuccess] = useState({});

    const updateOrderStatus = async (orderId, status, note = '') => {
        try {
            // Set loading state for this specific order
            setUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
            
            // Optimistic update - immediately update the local state
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order._id === orderId 
                        ? { ...order, status } 
                        : order
                )
            );

            // Make the API call
            await apiRequest(`/orders/${orderId}`, 'PUT', { status, note });
            
            // Small delay to show the optimistic update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Refresh data to ensure consistency
            await fetchOrders();
            await fetchStats();
            
            // Show success feedback
            const order = orders.find(o => o._id === orderId);
            if (order) {
                // Show success indicator
                setStatusUpdateSuccess(prev => ({ ...prev, [orderId]: true }));
                // Hide success indicator after 2 seconds
                setTimeout(() => {
                    setStatusUpdateSuccess(prev => ({ ...prev, [orderId]: false }));
                }, 2000);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Error updating order status');
            
            // Revert optimistic update on error
            await fetchOrders();
        } finally {
            // Clear loading state
            setUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const updateTracking = async (orderId) => {
        try {
            await apiRequest(`/orders/${orderId}/tracking`, 'PUT', trackingData);
            setEditingTracking(false);
            setTrackingData({ trackingNumber: '', carrier: '', estimatedDelivery: '' });
            fetchOrders();
        } catch (error) {
            console.error('Error updating tracking:', error);
            alert('Error updating tracking information');
        }
    };

    const getStatusIcon = (status) => {
        return null; // No icon needed
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ready-for-pickup':
                return 'bg-green-100 text-green-800';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const isNewOrder = (orderDate) => {
        const now = new Date();
        const orderTime = new Date(orderDate);
        const timeDiff = now - orderTime;
        // Consider order as "new" if it's less than 5 minutes old
        return timeDiff < 5 * 60 * 1000;
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        return order.status === filter;
    });

    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRefs = useRef({});

    // Close dropdown on outside click
    useEffect(() => {
      function handleClickOutside(event) {
        if (openDropdownId !== null && dropdownRefs.current[openDropdownId] && !dropdownRefs.current[openDropdownId].contains(event.target)) {
          setOpenDropdownId(null);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* New Order Notification */}
            {/* Removed new order notification as per edit hint */}

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                
                {/* Refresh Controls */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                            Last updated: {formatTime(new Date())}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Total Orders</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalOrders || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
                    <p className="text-3xl font-bold text-green-600">₹{stats.totalRevenue || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Pending Orders</h3>
                    <p className="text-3xl font-bold text-yellow-600">
                        {stats.statusBreakdown?.find(s => s._id === 'pending')?.count || 0}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Ready for Pickup</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {stats.statusBreakdown?.find(s => s._id === 'ready-for-pickup')?.count || 0}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="ready-for-pickup">Ready for Pickup</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
                {filteredOrders.map((order) => (
                    <div key={order._id} className={`bg-white rounded-lg shadow-md ${isNewOrder(order.createdAt) ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}>
                        {/* Order Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Order #{order.orderNumber}
                                        </h3>
                                        {isNewOrder(order.createdAt) && (
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Customer: {order.user?.name} ({order.user?.email})
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Placed on {formatDate(order.createdAt)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Total: ₹{order.totalAmount}
                                    </p>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                    {/* Status Update */}
                                    <div className="flex items-center space-x-2">
                                        <label className="text-sm font-medium text-gray-700">Status:</label>
                                        <div className="relative" ref={el => dropdownRefs.current[order._id] = el}>
                                            <button
                                                type="button"
                                                disabled={updatingStatus[order._id]}
                                                className={`rounded-2xl px-4 py-1 text-sm font-medium flex items-center justify-center focus:outline-none border border-gray-300 transition-all min-w-[120px] ${getStatusColor(order.status)} ${updatingStatus[order._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={() => setOpenDropdownId(openDropdownId === order._id ? null : order._id)}
                                            >
                                                {updatingStatus[order._id] ? (
                                                    <svg className="animate-spin w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                ) : statusUpdateSuccess[order._id] ? (
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="ml-1 text-xs text-green-600">Updated</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="w-full text-center">{statusOptions.find(opt => opt.value === order.status)?.label || order.status}</span>
                                                        <svg className="ml-2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </>
                                                )}
                                            </button>
                                            {openDropdownId === order._id && !updatingStatus[order._id] && (
                                                <div className="absolute left-0 mt-2 z-50 bg-white shadow-xl rounded-xl py-2 px-2 min-w-[400px] w-max border border-gray-200 max-h-60 overflow-y-auto">
                                                    <div className="flex flex-row gap-2">
                                                        {statusOptions.map((opt, idx) => {
                                                            const isSelected = order.status === opt.value;
                                                            return (
                                                                <div
                                                                    key={opt.value}
                                                                    className={`cursor-pointer flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium transition-all ${getStatusColor(opt.value)}
                                                                        ${isSelected ? 'ring-2 ring-blue-500 border border-blue-400 bg-opacity-90' : ''}
                                                                        hover:ring-2 hover:ring-blue-300 hover:bg-opacity-80`}
                                                                    style={{ minWidth: 0 }}
                                                                    onClick={() => {
                                                                        setOpenDropdownId(null);
                                                                        if (!isSelected) updateOrderStatus(order._id, opt.value);
                                                                    }}
                                                                >
                                                                    <span className="w-full text-center">{opt.label}</span>
                                                                    {isSelected && (
                                                                        <svg className="ml-1 w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                    >
                                        <span>Details</span>
                                        <svg className={`ml-1 w-4 h-4 transition-transform ${selectedOrder?._id === order._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Order Details (Expandable) */}
                        {selectedOrder?._id === order._id && (
                            <div className="p-6 bg-gray-50">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Order Items */}
                                    <div>
                                        <h4 className="text-lg font-semibold mb-4">Order Items</h4>
                                        <div className="space-y-3">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                                                    <img
                                                        src={item.product.image || '/default-product.jpg'}
                                                        alt={item.product.name}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium">{item.product.name}</p>
                                                        <p className="text-sm text-gray-600">
                                                            Qty: {item.quantity} × ₹{item.price}
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold">₹{item.subtotal}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order Management */}
                                    <div>
                                        <h4 className="text-lg font-semibold mb-4">Order Management</h4>

                                        {/* Tracking Information */}
                                        <div className="bg-white p-4 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <h5 className="font-medium">Tracking Information</h5>
                                                <button
                                                    onClick={() => setEditingTracking(!editingTracking)}
                                                    className="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                            
                                            {editingTracking ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Tracking Number"
                                                        value={trackingData.trackingNumber}
                                                        onChange={(e) => setTrackingData({...trackingData, trackingNumber: e.target.value})}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Carrier"
                                                        value={trackingData.carrier}
                                                        onChange={(e) => setTrackingData({...trackingData, carrier: e.target.value})}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={trackingData.estimatedDelivery}
                                                        onChange={(e) => setTrackingData({...trackingData, estimatedDelivery: e.target.value})}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => updateTracking(order._id)}
                                                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingTracking(false)}
                                                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm space-y-1">
                                                    <p><span className="font-medium">Tracking:</span> {order.tracking?.trackingNumber || 'Not set'}</p>
                                                    <p><span className="font-medium">Carrier:</span> {order.tracking?.carrier || 'Not set'}</p>
                                                    <p><span className="font-medium">Est. Delivery:</span> {order.tracking?.estimatedDelivery ? formatDate(order.tracking.estimatedDelivery) : 'Not set'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Details */}
                                    <div>
                                        <h4 className="text-lg font-semibold mb-4">Order Details</h4>
                                        
                                        {/* Shipping Address */}
                                        <div className="bg-white p-4 rounded-lg mb-4">
                                            <h5 className="font-medium mb-2">Shipping Address</h5>
                                            <div className="text-sm">
                                                <p className="font-medium">{order.shippingAddress.name}</p>
                                                <p>{order.shippingAddress.street}</p>
                                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                                                <p>{order.shippingAddress.country}</p>
                                                <p className="mt-1">📞 {order.shippingAddress.phone}</p>
                                            </div>
                                        </div>

                                        {/* Payment Info */}
                                        <div className="bg-white p-4 rounded-lg mb-4">
                                            <h5 className="font-medium mb-2">Payment Information</h5>
                                            <div className="text-sm space-y-1">
                                                <p><span className="font-medium">Method:</span> {order.payment?.method?.toUpperCase() || 'Not set'}</p>
                                                <p><span className="font-medium">Status:</span> {order.payment?.status || 'Not set'}</p>
                                                {order.payment?.transactionId && (
                                                    <p><span className="font-medium">Transaction ID:</span> {order.payment.transactionId}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Order Summary */}
                                        <div className="bg-white p-4 rounded-lg">
                                            <h5 className="font-medium mb-2">Order Summary</h5>
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Subtotal:</span>
                                                    <span>₹{order.subtotal}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Tax:</span>
                                                    <span>₹{order.tax}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Shipping:</span>
                                                    <span>{order.shippingCost === 0 ? 'Free' : `₹${order.shippingCost}`}</span>
                                                </div>
                                                <div className="border-t pt-1 flex justify-between font-semibold">
                                                    <span>Total:</span>
                                                    <span>₹{order.totalAmount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminOrderManagementPage; 