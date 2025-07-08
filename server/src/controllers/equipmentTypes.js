const EquipmentType = require('../models/EquipmentType');

// @desc    Get all equipment types
// @route   GET /api/equipment-types
// @access  Public
const getEquipmentTypes = async (req, res) => {
  try {
    const equipmentTypes = await EquipmentType.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: equipmentTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single equipment type
// @route   GET /api/equipment-types/:id
// @access  Public
const getEquipmentType = async (req, res) => {
  try {
    const equipmentType = await EquipmentType.findById(req.params.id);
    
    if (!equipmentType) {
      return res.status(404).json({
        success: false,
        error: 'Equipment type not found'
      });
    }

    res.json({
      success: true,
      data: equipmentType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new equipment type
// @route   POST /api/equipment-types
// @access  Private/Admin
const createEquipmentType = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    // Check if equipment type already exists
    const existingEquipment = await EquipmentType.findOne({ name });
    if (existingEquipment) {
      return res.status(400).json({
        success: false,
        error: 'Equipment type with this name already exists'
      });
    }

    const equipmentType = await EquipmentType.create({
      name,
      description,
      category
    });

    res.status(201).json({
      success: true,
      data: equipmentType
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Update equipment type
// @route   PUT /api/equipment-types/:id
// @access  Private/Admin
const updateEquipmentType = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    let equipmentType = await EquipmentType.findById(req.params.id);
    
    if (!equipmentType) {
      return res.status(404).json({
        success: false,
        error: 'Equipment type not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== equipmentType.name) {
      const existingEquipment = await EquipmentType.findOne({ name });
      if (existingEquipment) {
        return res.status(400).json({
          success: false,
          error: 'Equipment type with this name already exists'
        });
      }
    }

    equipmentType = await EquipmentType.findByIdAndUpdate(
      req.params.id,
      { name, description, category },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: equipmentType
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete equipment type
// @route   DELETE /api/equipment-types/:id
// @access  Private/Admin
const deleteEquipmentType = async (req, res) => {
  try {
    const equipmentType = await EquipmentType.findById(req.params.id);
    
    if (!equipmentType) {
      return res.status(404).json({
        success: false,
        error: 'Equipment type not found'
      });
    }

    // Soft delete by setting isActive to false
    await EquipmentType.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Equipment type deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  getEquipmentTypes,
  getEquipmentType,
  createEquipmentType,
  updateEquipmentType,
  deleteEquipmentType
}; 