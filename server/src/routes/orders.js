const express = require('express');
const router = express.Router();
const {
    getOrders,
    getOrder,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    updateTracking,
    getOrderStats
} = require('../controllers/orders');
const { protect, authorize, customerOnly } = require('../middleware/auth');

router.route('/')
    .get(protect, getOrders)  // Remove customerOnly to allow admins
    .post(protect, customerOnly, createOrder);

router.get('/stats', protect, authorize('admin'), getOrderStats);

router.route('/:id')
    .get(protect, getOrder)  // Remove customerOnly to allow admins
    .put(protect, authorize('admin'), updateOrderStatus);

router.put('/:id/cancel', protect, customerOnly, cancelOrder);
router.put('/:id/tracking', protect, authorize('admin'), updateTracking);

module.exports = router; 