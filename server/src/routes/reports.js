const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getSalesReport,
    getServiceReport,
    getDashboardReport
} = require('../controllers/reports');

// All routes require admin access
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/reports/sales
// @desc    Get sales report for specified period
// @access  Private/Admin
router.get('/sales', getSalesReport);

// @route   GET /api/reports/services
// @desc    Get service requests report for specified period
// @access  Private/Admin
router.get('/services', getServiceReport);

// @route   GET /api/reports/dashboard
// @desc    Get combined dashboard report
// @access  Private/Admin
router.get('/dashboard', getDashboardReport);

module.exports = router;
