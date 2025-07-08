const express = require('express');
const router = express.Router();
const {
  getServiceTypes,
  getServiceType,
  createServiceType,
  updateServiceType,
  deleteServiceType
} = require('../controllers/serviceTypes');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getServiceTypes);
router.get('/:id', getServiceType);

// Protected routes (admin only)
router.post('/', protect, authorize('admin'), createServiceType);
router.put('/:id', protect, authorize('admin'), updateServiceType);
router.delete('/:id', protect, authorize('admin'), deleteServiceType);

module.exports = router; 