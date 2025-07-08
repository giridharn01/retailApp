const mongoose = require('mongoose');

const equipmentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Equipment description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Equipment category is required'],
    enum: ['Electrical', 'Hardware', 'Agri-Tech', 'Solar', 'Automation', 'Other'],
    default: 'Other'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
equipmentTypeSchema.index({ name: 1 });
equipmentTypeSchema.index({ category: 1 });
equipmentTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model('EquipmentType', equipmentTypeSchema); 