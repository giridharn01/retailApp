const ServiceType = require('../models/ServiceType');

// @desc    Get all service types
// @route   GET /api/service-types
// @access  Public
const getServiceTypes = async (req, res) => {
  try {
    const serviceTypes = await ServiceType.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: serviceTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single service type
// @route   GET /api/service-types/:id
// @access  Public
const getServiceType = async (req, res) => {
  try {
    const serviceType = await ServiceType.findById(req.params.id);
    
    if (!serviceType) {
      return res.status(404).json({
        success: false,
        error: 'Service type not found'
      });
    }

    res.json({
      success: true,
      data: serviceType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create new service type
// @route   POST /api/service-types
// @access  Private/Admin
const createServiceType = async (req, res) => {
  try {
    console.log('Creating service type with data:', req.body);
    const { name, description, basePrice, estimatedDuration } = req.body;

    // Check if service type already exists
    const existingService = await ServiceType.findOne({ name });
    if (existingService) {
      console.log('Service type already exists:', name);
      return res.status(400).json({
        success: false,
        error: 'Service type with this name already exists'
      });
    }

    const serviceType = await ServiceType.create({
      name,
      description,
      basePrice,
      estimatedDuration
    });

    console.log('Service type created successfully:', serviceType);
    res.status(201).json({
      success: true,
      data: serviceType
    });
  } catch (error) {
    console.error('Error creating service type:', error);
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

// @desc    Update service type
// @route   PUT /api/service-types/:id
// @access  Private/Admin
const updateServiceType = async (req, res) => {
  try {
    console.log('Updating service type:', req.params.id, 'with data:', req.body);
    const { name, description, basePrice, estimatedDuration } = req.body;

    let serviceType = await ServiceType.findById(req.params.id);
    
    if (!serviceType) {
      console.log('Service type not found:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Service type not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== serviceType.name) {
      const existingService = await ServiceType.findOne({ name });
      if (existingService) {
        console.log('Service type with name already exists:', name);
        return res.status(400).json({
          success: false,
          error: 'Service type with this name already exists'
        });
      }
    }

    serviceType = await ServiceType.findByIdAndUpdate(
      req.params.id,
      { name, description, basePrice, estimatedDuration },
      { new: true, runValidators: true }
    );

    console.log('Service type updated successfully:', serviceType);
    res.json({
      success: true,
      data: serviceType
    });
  } catch (error) {
    console.error('Error updating service type:', error);
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

// @desc    Delete service type
// @route   DELETE /api/service-types/:id
// @access  Private/Admin
const deleteServiceType = async (req, res) => {
  try {
    const serviceType = await ServiceType.findById(req.params.id);
    
    if (!serviceType) {
      return res.status(404).json({
        success: false,
        error: 'Service type not found'
      });
    }

    // Soft delete by setting isActive to false
    await ServiceType.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Service type deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  getServiceTypes,
  getServiceType,
  createServiceType,
  updateServiceType,
  deleteServiceType
}; 