const ServiceRequest = require('../models/ServiceRequest');

// @desc    Get all service requests
// @route   GET /api/services
// @access  Private
exports.getServiceRequests = async (req, res) => {
    try {
        let query = {};

        // If user is not admin, only show their service requests
        if (req.user.role !== 'admin') {
            query.user = req.user.id;
        }

        // Pagination
        const pageNumber = parseInt(req.query.page, 10) || 1;
        const limitNumber = parseInt(req.query.limit, 10) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        const serviceRequests = await ServiceRequest.find(query)
            .populate('user', 'name email')
            .populate('technician', 'name email')
            .limit(limitNumber)
            .skip(skip);

        // Get total count for pagination
        const total = await ServiceRequest.countDocuments(query);

        res.json({
            success: true,
            count: serviceRequests.length,
            total,
            pagination: {
                current: pageNumber,
                pages: Math.ceil(total / limitNumber),
                hasNext: pageNumber * limitNumber < total,
                hasPrev: pageNumber > 1
            },
            data: serviceRequests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get single service request
// @route   GET /api/services/:id
// @access  Private
exports.getServiceRequest = async (req, res) => {
    try {
        const serviceRequest = await ServiceRequest.findById(req.params.id)
            .populate('user', 'name email')
            .populate('technician', 'name email');

        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                error: 'Service request not found'
            });
        }

        // Check if user is admin or the service request belongs to them
        if (req.user.role !== 'admin' && serviceRequest.user._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this service request'
            });
        }

        res.json({
            success: true,
            data: serviceRequest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Create new service request
// @route   POST /api/services
// @access  Private
exports.createServiceRequest = async (req, res) => {
    try {
        const serviceRequest = await ServiceRequest.create({
            ...req.body,
            user: req.user.id
        });

        res.status(201).json({
            success: true,
            data: serviceRequest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update service request
// @route   PUT /api/services/:id
// @access  Private/Admin
exports.updateServiceRequest = async (req, res) => {
    try {
        const { status, technician, scheduledDate, note } = req.body;

        const serviceRequest = await ServiceRequest.findByIdAndUpdate(
            req.params.id,
            {
                status,
                technician,
                scheduledDate,
                $push: { statusHistory: { status, note } }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                error: 'Service request not found'
            });
        }

        res.json({
            success: true,
            data: serviceRequest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Cancel service request
// @route   PUT /api/services/:id/cancel
// @access  Private
exports.cancelServiceRequest = async (req, res) => {
    try {
        const serviceRequest = await ServiceRequest.findById(req.params.id);

        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                error: 'Service request not found'
            });
        }

        // Check if user is admin or the service request belongs to them
        if (req.user.role !== 'admin' && serviceRequest.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to cancel this service request'
            });
        }

        // Only allow cancellation of pending or assigned requests
        if (!['pending', 'assigned'].includes(serviceRequest.status)) {
            return res.status(400).json({
                success: false,
                error: 'Can only cancel pending or assigned service requests'
            });
        }

        serviceRequest.status = 'cancelled';
        serviceRequest.statusHistory.push({
            status: 'cancelled',
            note: 'Service request cancelled by user'
        });
        await serviceRequest.save();

        res.json({
            success: true,
            data: serviceRequest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.deleteServiceRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!serviceRequest) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }
    res.json({ success: true, message: 'Service request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}; 