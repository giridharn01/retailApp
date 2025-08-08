const express = require('express');
const router = express.Router();
const {
    getServiceRequests,
    getServiceRequest,
    createServiceRequest,
    updateServiceRequest,
    cancelServiceRequest,
    deleteServiceRequest
} = require('../controllers/services');
const { protect, authorize, customerOnly } = require('../middleware/auth');
const ServiceRequest = require('../models/ServiceRequest');

router.route('/')
    .get(protect, authorize('admin'), getServiceRequests)
    .post(protect, customerOnly, createServiceRequest);

// Get service requests for current user only
router.get('/user', protect, customerOnly, async (req, res) => {
    try {
        console.log('Fetching service requests for user:', req.user.id);
        
        const serviceRequests = await ServiceRequest.find({ user: req.user.id })
            .populate('user', 'name email')
            .populate('technician', 'name email')
            .sort({ createdAt: -1 }); // Sort by newest first

        console.log('Found service requests:', serviceRequests.length);
        console.log('Service requests data:', serviceRequests);

        res.json({
            success: true,
            count: serviceRequests.length,
            data: serviceRequests
        });
    } catch (error) {
        console.error('Error fetching service requests:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.route('/:id')
    .get(protect, getServiceRequest)
    .put(protect, authorize('admin'), updateServiceRequest);

router.put('/:id/cancel', protect, customerOnly, cancelServiceRequest);

router.delete('/:id', protect, authorize('admin'), deleteServiceRequest);

module.exports = router; 