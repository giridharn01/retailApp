const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    serviceType: {
        type: String,
        required: [true, 'Please specify service type']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description of the service needed']
    },
    preferredDate: {
        type: Date,
        required: [true, 'Please specify preferred date']
    },
    preferredTime: {
        type: String,
        required: [true, 'Please specify preferred time']
    },
    contactNumber: {
        type: String,
        required: [true, 'Please provide contact number']
    },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    statusHistory: [{
        status: {
            type: String,
            enum: ['pending', 'assigned', 'in-progress', 'completed', 'cancelled']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    scheduledDate: {
        type: Date
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add status to history when status changes
serviceRequestSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date()
        });
    }
    next();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema); 