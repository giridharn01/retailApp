const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// Helper function to migrate old order statuses to new ones
const migrateOrderStatuses = async () => {
    try {
        console.log('Running order status migration...');
        
        const statusMapping = {
            'confirmed': 'in-progress',
            'processing': 'in-progress',
            'shipped': 'ready-for-pickup',
            'out-for-delivery': 'ready-for-pickup',
            'delivered': 'ready-for-pickup',
            'refunded': 'cancelled'
        };

        // Find all orders with old status values
        const ordersToUpdate = await Order.find({
            status: { $in: Object.keys(statusMapping) }
        });

        console.log(`Found ${ordersToUpdate.length} orders to migrate`);

        // Update each order individually
        for (const order of ordersToUpdate) {
            const newStatus = statusMapping[order.status];
            if (newStatus) {
                console.log(`Migrating order ${order._id} from ${order.status} to ${newStatus}`);
                order.status = newStatus;
                order.statusHistory.push({
                    status: newStatus,
                    note: `Status migrated from ${order.status} to ${newStatus}`,
                    timestamp: new Date()
                });
                await order.save();
            }
        }

        // Update status history entries
        const ordersWithOldHistory = await Order.find({
            'statusHistory.status': { $in: Object.keys(statusMapping) }
        });

        for (const order of ordersWithOldHistory) {
            let hasChanges = false;
            order.statusHistory.forEach(history => {
                const newStatus = statusMapping[history.status];
                if (newStatus) {
                    history.status = newStatus;
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                await order.save();
            }
        }
    } catch (error) {
        console.error('Error migrating order statuses:', error);
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
    try {
        // First, migrate any old status values to new ones
        await migrateOrderStatuses();

        let query = {};
        const { status, sort, limit, page } = req.query;

        // If user is not admin, only show their orders
        if (req.user.role !== 'admin') {
            query.user = req.user.id;
        }

        // Filter by status
        if (status) {
            // Map old status values to new ones for backward compatibility
            const statusMapping = {
                'confirmed': 'in-progress',
                'processing': 'in-progress',
                'shipped': 'ready-for-pickup',
                'out-for-delivery': 'ready-for-pickup',
                'delivered': 'ready-for-pickup',
                'refunded': 'cancelled'
            };
            
            const mappedStatus = statusMapping[status] || status;
            query.status = mappedStatus;
        }

        // Build sort object
        let sortObj = {};
        if (sort) {
            const [field, order] = sort.split(':');
            sortObj[field] = order === 'desc' ? -1 : 1;
        } else {
            sortObj = { createdAt: -1 };
        }

        // Pagination
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('items.product', 'name price image')
            .sort(sortObj)
            .limit(limitNumber)
            .skip(skip);

        // Get total count for pagination
        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            count: orders.length,
            total,
            pagination: {
                current: pageNumber,
                pages: Math.ceil(total / limitNumber),
                hasNext: pageNumber * limitNumber < total,
                hasPrev: pageNumber > 1
            },
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.product', 'name price');

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Check if user is admin or the order belongs to them
        if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this order'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, notes } = req.body;

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Cart is empty'
            });
        }

        // Validate stock and prepare order items
        const orderItems = [];
        for (const cartItem of cart.items) {
            const product = cartItem.product;
            
            if (product.stock < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock for product: ${product.name}`
                });
            }

            orderItems.push({
                product: product._id,
                quantity: cartItem.quantity,
                price: product.price,
                subtotal: product.price * cartItem.quantity
            });

            // Update stock
            product.stock -= cartItem.quantity;
            await product.save();
        }

        // Generate order number
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const orderNumber = `ORD${year}${month}${day}${random}`;

        // Create order
        const order = new Order({
            user: req.user.id,
            orderNumber: orderNumber,
            items: orderItems,
            subtotal: cart.subtotal,
            tax: cart.tax,
            shippingCost: cart.shippingCost,
            totalAmount: cart.totalAmount,
            payment: {
                method: paymentMethod || 'cod', // Default to Cash on Delivery
                status: (paymentMethod || 'cod') === 'cod' ? 'pending' : 'completed'
            },
            shippingAddress,
            notes
        });
        await order.save();

        // Clear cart items after successful order (keep the cart entity)
        cart.items = [];
        await cart.save();

        res.status(201).json({
            success: true,
            data: order,
            cartCleared: true // Indicate that cart was cleared
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        // First, migrate any old status values to new ones
        await migrateOrderStatuses();

        const { status, note } = req.body;
        
        // Debug: Check what status we're trying to set
        console.log('Attempting to set status:', status);

        // Map old status values to new ones for backward compatibility
        const statusMapping = {
            'confirmed': 'in-progress',
            'processing': 'in-progress',
            'shipped': 'ready-for-pickup',
            'out-for-delivery': 'ready-for-pickup',
            'delivered': 'ready-for-pickup',
            'refunded': 'cancelled'
        };

        const mappedStatus = statusMapping[status] || status;
        console.log('Mapped status:', mappedStatus);

        // First, get the order to check its current status
        const existingOrder = await Order.findById(req.params.id);
        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        console.log('Current order status:', existingOrder.status);

        // Try using findByIdAndUpdate with runValidators: false
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                status: mappedStatus,
                $push: { 
                    statusHistory: { 
                        status: mappedStatus, 
                        note: note || '', 
                        timestamp: new Date() 
                    } 
                }
            },
            { 
                new: true, 
                runValidators: false 
            }
        );

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: updatedOrder
        });
    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Check if user is admin or the order belongs to them
        if (req.user.role !== 'admin' && order.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to cancel this order'
            });
        }

        // Only allow cancellation of pending orders
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Can only cancel pending orders'
            });
        }

        // Restore product stock
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        order.status = 'cancelled';
        order.statusHistory.push({
            status: 'cancelled',
            note: 'Order cancelled by user'
        });
        await order.save();

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update order tracking
// @route   PUT /api/orders/:id/tracking
// @access  Private/Admin
exports.updateTracking = async (req, res) => {
    try {
        const { trackingNumber, carrier, estimatedDelivery } = req.body;

        // Auto-generate tracking number if not provided
        let finalTrackingNumber = trackingNumber;
        if (!trackingNumber) {
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
            finalTrackingNumber = `TRK${year}${month}${day}${random}`;
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                'tracking.trackingNumber': finalTrackingNumber,
                'tracking.carrier': carrier,
                'tracking.estimatedDelivery': estimatedDelivery
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
exports.getOrderStats = async (req, res) => {
    try {
        // First, migrate any old status values to new ones
        await migrateOrderStatuses();

        const stats = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $match: { status: { $in: ['ready-for-pickup'] } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            success: true,
            data: {
                statusBreakdown: stats,
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}; 