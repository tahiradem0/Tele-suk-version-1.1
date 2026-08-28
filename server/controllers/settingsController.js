const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');

// @desc    Get global settings
// @route   GET /api/settings
// @access  Public
const getSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({ deliveryFee: 5.00 });
    }
    res.json(settings);
});

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
    const { deliveryFee } = req.body;
    let settings = await Settings.findOne();

    if (!settings) {
        settings = await Settings.create({ deliveryFee: deliveryFee || 5.00 });
    } else {
        if (deliveryFee !== undefined) {
            settings.deliveryFee = deliveryFee;
        }
        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    }
});

module.exports = {
    getSettings,
    updateSettings,
};
