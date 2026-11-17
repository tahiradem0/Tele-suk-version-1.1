const mongoose = require('mongoose');

const deliveryLocationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    shortCode: {
        type: String,
        trim: true,
        default: '',
    },
    city: {
        type: String,
        trim: true,
        default: 'Gondar',
    },
    zone: {
        type: String,
        trim: true,
        default: '',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    displayOrder: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Index for search
deliveryLocationSchema.index({ name: 'text', shortCode: 'text', zone: 'text' });

const DeliveryLocation = mongoose.model('DeliveryLocation', deliveryLocationSchema);

module.exports = DeliveryLocation;
