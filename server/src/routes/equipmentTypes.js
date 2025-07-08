const express = require('express');
const router = express.Router();
const {
  getEquipmentTypes,
  getEquipmentType,
  createEquipmentType,
  updateEquipmentType,
  deleteEquipmentType
} = require('../controllers/equipmentTypes');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getEquipmentTypes);
router.get('/:id', getEquipmentType);

// Protected routes (admin only)
router.post('/', protect, authorize('admin'), createEquipmentType);
router.put('/:id', protect, authorize('admin'), updateEquipmentType);
router.delete('/:id', protect, authorize('admin'), deleteEquipmentType);

module.exports = router; 