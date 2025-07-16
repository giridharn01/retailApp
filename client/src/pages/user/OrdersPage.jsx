import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiRequest } from '../../utils/api';
import { io } from 'socket.io-client';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('all');
    const [statusUpdates, setStatusUpdates] = useState([]);
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);
    const location = useLocation();

    useEffect(() => {
        fetchOrders();
        
        // If navigating from checkout, show the new order
        if (location.state?.order) {
            setSelectedOrder(location.state.order);
        }
    }, [location.state]);

    // --- Socket.IO real-time updates ---
    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            withCredentials: true,
        });
        socket.on('orderStatusChanged', (event) => {
            fetchOrders(true); // Silent refresh
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchOrders = async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
            }
            const response = await apiRequest('/orders');
            const newOrders = response.data;
            
            // Check for status changes if this is a silent refresh
            if (silent && orders.length > 0) {
                const updates = [];
                newOrders.forEach(newOrder => {
                    const oldOrder = orders.find(o => o._id === newOrder._id);
                    if (oldOrder && oldOrder.status !== newOrder.status) {
                        updates.push({
                            orderNumber: newOrder.orderNumber,
                            oldStatus: oldOrder.status,
                            newStatus: newOrder.status
                        });
                    }
                });
                
                if (updates.length > 0) {
                    setStatusUpdates(updates);
                    setShowUpdateNotification(true);
                    // Auto-hide notification after 5 seconds
                    setTimeout(() => setShowUpdateNotification(false), 5000);
                }
            }
            
            setOrders(newOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            if (!silent) {
                setLoading(false);
            }
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

    const isRecentUpdate = (order) => {
        // Check if order has recent status history updates (last 5 minutes)
        if (order.statusHistory && order.statusHistory.length > 0) {
            const latestUpdate = order.statusHistory[order.statusHistory.length - 1];
            const updateTime = new Date(latestUpdate.timestamp);
            const now = new Date();
            const timeDiff = now - updateTime;
            return timeDiff < 5 * 60 * 1000; // 5 minutes
        }
        return false;
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        return order.status === filter;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Status Update Notification */}
            {showUpdateNotification && (
                <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-pulse">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <span className="font-medium">Order status updated!</span>
                        <div className="text-sm opacity-90">
                            {statusUpdates.map((update, index) => (
                                <div key={index}>
                                    Order #{update.orderNumber}: {update.oldStatus} → {update.newStatus}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowUpdateNotification(false)}
                        className="ml-2 text-white hover:text-gray-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                
                {/* Refresh Controls */}
                <div className="flex items-center space-x-4">
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

            {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h2>
                    <p className="text-gray-600">You haven't placed any orders yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredOrders.map((order) => (
                        <div key={order._id} className={`bg-white rounded-lg shadow-md overflow-hidden ${isRecentUpdate(order) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
                            {/* Order Header */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Order #{order.orderNumber}
                                            </h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                            {isRecentUpdate(order) && (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Updated
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Placed on {formatDate(order.createdAt)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Total: ₹{order.totalAmount}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
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
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                                        {/* Order Tracking */}
                                        <div>
                                            <h4 className="text-lg font-semibold mb-4">Order Tracking</h4>
                                            
                                            {/* Tracking Timeline */}
                                            <div className="space-y-4">
                                                {order.statusHistory.map((status, index) => (
                                                    <div key={index} className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                                            {index < order.statusHistory.length - 1 && (
                                                                <div className="w-0.5 h-8 bg-gray-300 mx-auto mt-1"></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                                                                    {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600">
                                                                {formatDate(status.timestamp)}
                                                            </p>
                                                            {status.note && (
                                                                <p className="text-sm text-gray-500 mt-1">{status.note}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Shipping Address */}
                                            <div className="mt-6">
                                                <h5 className="font-semibold mb-2">Shipping Address</h5>
                                                <div className="bg-white p-3 rounded-lg text-sm">
                                                    <p className="font-medium">{order.shippingAddress.name}</p>
                                                    <p>{order.shippingAddress.street}</p>
                                                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                                                    <p>{order.shippingAddress.country}</p>
                                                    <p className="mt-1">📞 {order.shippingAddress.phone}</p>
                                                </div>
                                            </div>

                                            {/* Payment Info */}
                                            <div className="mt-4">
                                                <h5 className="font-semibold mb-2">Payment Information</h5>
                                                <div className="bg-white p-3 rounded-lg text-sm">
                                                    <p><span className="font-medium">Method:</span> {order.payment?.method?.toUpperCase() || 'Not set'}</p>
                                                                                                    <p><span className="font-medium">Status:</span> {order.payment?.status || 'Not set'}</p>
                                                {order.payment?.transactionId && (
                                                    <p><span className="font-medium">Transaction ID:</span> {order.payment.transactionId}</p>
                                                )}
                                                </div>
                                            </div>

                                            {/* Order Summary */}
                                            <div className="mt-4">
                                                <h5 className="font-semibold mb-2">Order Summary</h5>
                                                <div className="bg-white p-3 rounded-lg text-sm space-y-1">
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
            )}
        </div>
    );
};

export default OrdersPage; 