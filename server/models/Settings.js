const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    deliveryFee: {
        type: Number,
        required: true,
        default: 5.00
    }
}, {
    timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
