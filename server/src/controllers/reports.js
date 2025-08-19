const Order = require('../models/Order');
const ServiceRequest = require('../models/ServiceRequest');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get sales report for specified period
// @route   GET /api/reports/sales
// @access  Private/Admin
exports.getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        // Default to last 30 days if no date range specified
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);

        // Build aggregation pipeline based on groupBy parameter
        let dateFormat;
        switch (groupBy) {
            case 'hour':
                dateFormat = "%Y-%m-%d %H:00";
                break;
            case 'day':
                dateFormat = "%Y-%m-%d";
                break;
            case 'week':
                dateFormat = "%Y-%U";
                break;
            case 'month':
                dateFormat = "%Y-%m";
                break;
            case 'year':
                dateFormat = "%Y";
                break;
            default:
                dateFormat = "%Y-%m-%d";
        }

        const salesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: dateFormat,
                            date: "$createdAt"
                        }
                    },
                    totalSales: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Get top selling products in the period
        const topProducts = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: "$items.subtotal" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" }
        ]);

        // Get sales by status
        const salesByStatus = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);

        // Calculate summary statistics
        const totalSales = salesData.reduce((sum, item) => sum + item.totalSales, 0);
        const totalOrders = salesData.reduce((sum, item) => sum + item.orderCount, 0);
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        // Get customer analytics
        const customerAnalytics = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: "$user",
                    totalSpent: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            { $unwind: "$customer" }
        ]);

        res.json({
            success: true,
            data: {
                period: { startDate: start, endDate: end },
                summary: {
                    totalSales,
                    totalOrders,
                    averageOrderValue: Math.round(averageOrderValue * 100) / 100
                },
                salesData,
                topProducts,
                salesByStatus,
                customerAnalytics
            }
        });

    } catch (error) {
        console.error('Sales report error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate sales report'
        });
    }
};

// @desc    Get service requests report for specified period
// @route   GET /api/reports/services
// @access  Private/Admin
exports.getServiceReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        // Default to last 30 days if no date range specified
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);

        // Build aggregation pipeline based on groupBy parameter
        let dateFormat;
        switch (groupBy) {
            case 'hour':
                dateFormat = "%Y-%m-%d %H:00";
                break;
            case 'day':
                dateFormat = "%Y-%m-%d";
                break;
            case 'week':
                dateFormat = "%Y-%U";
                break;
            case 'month':
                dateFormat = "%Y-%m";
                break;
            case 'year':
                dateFormat = "%Y";
                break;
            default:
                dateFormat = "%Y-%m-%d";
        }

        const serviceData = await ServiceRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: dateFormat,
                            date: "$createdAt"
                        }
                    },
                    requestCount: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Get requests by status
        const requestsByStatus = await ServiceRequest.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get requests by service type
        const requestsByServiceType = await ServiceRequest.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: "$serviceType",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Calculate completion rate and average response time
        const completionStats = await ServiceRequest.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                        }
                    },
                    pending: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
                        }
                    },
                    inProgress: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0]
                        }
                    },
                    cancelled: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Get monthly trends for longer periods
        const monthlyTrends = await ServiceRequest.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$createdAt"
                        }
                    },
                    requests: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const stats = completionStats[0] || { total: 0, completed: 0, pending: 0, inProgress: 0, cancelled: 0 };
        const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

        res.json({
            success: true,
            data: {
                period: { startDate: start, endDate: end },
                summary: {
                    totalRequests: stats.total,
                    completedRequests: stats.completed,
                    pendingRequests: stats.pending,
                    inProgressRequests: stats.inProgress,
                    cancelledRequests: stats.cancelled,
                    completionRate: Math.round(completionRate * 100) / 100
                },
                serviceData,
                requestsByStatus,
                requestsByServiceType,
                monthlyTrends
            }
        });

    } catch (error) {
        console.error('Service report error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate service report'
        });
    }
};

// @desc    Get combined dashboard report
// @route   GET /api/reports/dashboard
// @access  Private/Admin
exports.getDashboardReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Default to last 30 days if no date range specified
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);

        // Get sales summary
        const salesSummary = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalAmount" },
                    totalOrders: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            }
        ]);

        // Get service summary
        const serviceSummary = await ServiceRequest.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: null,
                    totalRequests: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Get daily sales data for sales chart
        const salesData = await Order.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    totalSales: { $sum: "$totalAmount" },
                    orderCount: { $sum: 1 },
                    averageOrder: { $avg: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Get service requests by type
        const requestsByServiceType = await ServiceRequest.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: "$serviceType",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get service requests by status
        const requestsByStatus = await ServiceRequest.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get daily trends for both sales and services
        const dailyTrends = await Promise.all([
            Order.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt"
                            }
                        },
                        sales: { $sum: "$totalAmount" },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ]),
            ServiceRequest.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt"
                            }
                        },
                        serviceRequests: { $sum: 1 }
                    }
                },
                { $sort: { "_id": 1 } }
            ])
        ]);

        // Merge daily trends
        const mergedTrends = {};
        dailyTrends[0].forEach(item => {
            mergedTrends[item._id] = { ...item, serviceRequests: 0 };
        });
        dailyTrends[1].forEach(item => {
            if (mergedTrends[item._id]) {
                mergedTrends[item._id].serviceRequests = item.serviceRequests;
            } else {
                mergedTrends[item._id] = { _id: item._id, sales: 0, orders: 0, serviceRequests: item.serviceRequests };
            }
        });

        const sales = salesSummary[0] || { totalSales: 0, totalOrders: 0, averageOrderValue: 0 };
        const services = serviceSummary[0] || { totalRequests: 0, completed: 0 };

        res.json({
            success: true,
            data: {
                period: { startDate: start, endDate: end },
                summary: {
                    sales: {
                        totalRevenue: sales.totalSales,  // Fixed: use totalRevenue instead of totalSales
                        totalOrders: sales.totalOrders,
                        averageOrderValue: Math.round(sales.averageOrderValue * 100) / 100
                    },
                    services: {
                        totalRequests: services.totalRequests,
                        completedRequests: services.completed,
                        completionRate: services.totalRequests > 0 ? Math.round((services.completed / services.totalRequests) * 100 * 100) / 100 : 0
                    }
                },
                salesData,              // Added: for SalesRevenueTrendChart
                requestsByServiceType,  // Added: for ServiceBreakdownPieChart  
                requestsByStatus,       // Added: for service status analysis
                trends: Object.values(mergedTrends).sort((a, b) => a._id.localeCompare(b._id))
            }
        });

    } catch (error) {
        console.error('Dashboard report error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate dashboard report'
        });
    }
};
