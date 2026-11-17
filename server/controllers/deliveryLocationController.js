const asyncHandler = require('express-async-handler');
const DeliveryLocation = require('../models/DeliveryLocation');

// Predefined default Gondar delivery addresses with abbreviations
const DEFAULT_GONDAR_LOCATIONS = [
    { name: 'Arada, Gondar', shortCode: 'AR', city: 'Gondar', zone: 'Market & Commercial Area', displayOrder: 1 },
    { name: 'Piassa, Gondar', shortCode: 'PS', city: 'Gondar', zone: 'City Center', displayOrder: 2 },
    { name: 'Maraki, Gondar', shortCode: 'MK', city: 'Gondar', zone: 'University Campus Area', displayOrder: 3 },
    { name: 'Azezo, Gondar', shortCode: 'AZ', city: 'Gondar', zone: 'Airport & Military Camp', displayOrder: 4 },
    { name: 'Lideta, Gondar', shortCode: 'LD', city: 'Gondar', zone: 'Residential & Commercial', displayOrder: 5 },
    { name: 'Chechela, Gondar', shortCode: 'CH', city: 'Gondar', zone: 'Hospital & CMHS', displayOrder: 6 },
    { name: 'Kebele 18, Gondar', shortCode: 'K18', city: 'Gondar', zone: 'Sub-city', displayOrder: 7 },
    { name: 'Kebele 16, Gondar', shortCode: 'K16', city: 'Gondar', zone: 'Sub-city', displayOrder: 8 },
    { name: 'Fasil Ghebbi, Gondar', shortCode: 'FS', city: 'Gondar', zone: 'Castle & Heritage Area', displayOrder: 9 },
    { name: 'Posta Bet, Gondar', shortCode: 'PB', city: 'Gondar', zone: 'Downtown Postal Area', displayOrder: 10 },
    { name: 'Autopark, Gondar', shortCode: 'AP', city: 'Gondar', zone: 'Main Bus Station', displayOrder: 11 },
    { name: 'Angereb, Gondar', shortCode: 'AG', city: 'Gondar', zone: 'Reservoir & Residential', displayOrder: 12 },
    { name: 'Teda, Gondar', shortCode: 'TD', city: 'Gondar', zone: 'Agricultural College Campus', displayOrder: 13 },
    { name: 'Bela, Gondar', shortCode: 'BL', city: 'Gondar', zone: 'Residential Area', displayOrder: 14 },
];

// @desc    Get all delivery locations (Public / Autocomplete)
// @route   GET /api/delivery-locations
// @access  Public
const getDeliveryLocations = asyncHandler(async (req, res) => {
    let locations = await DeliveryLocation.find({}).sort({ displayOrder: 1, name: 1 });

    // Auto-seed default Gondar locations if table is empty
    if (!locations || locations.length === 0) {
        await DeliveryLocation.insertMany(DEFAULT_GONDAR_LOCATIONS);
        locations = await DeliveryLocation.find({}).sort({ displayOrder: 1, name: 1 });
    }

    res.json(locations);
});

// @desc    Create new delivery location
// @route   POST /api/delivery-locations
// @access  Private/Admin
const createDeliveryLocation = asyncHandler(async (req, res) => {
    const { name, shortCode, city, zone, displayOrder } = req.body;

    if (!name || !name.trim()) {
        res.status(400);
        throw new Error('Location name is required');
    }

    // Auto-generate shortCode if omitted
    const generatedCode = shortCode
        ? shortCode.trim().toUpperCase()
        : name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase();

    const location = await DeliveryLocation.create({
        name: name.trim(),
        shortCode: generatedCode,
        city: (city && city.trim()) || 'Gondar',
        zone: (zone && zone.trim()) || '',
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
        isActive: true,
    });

    res.status(201).json(location);
});

// @desc    Update delivery location
// @route   PUT /api/delivery-locations/:id
// @access  Private/Admin
const updateDeliveryLocation = asyncHandler(async (req, res) => {
    const location = await DeliveryLocation.findById(req.params.id);

    if (!location) {
        res.status(404);
        throw new Error('Location not found');
    }

    const { name, shortCode, city, zone, isActive, displayOrder } = req.body;

    if (name !== undefined) location.name = name.trim();
    if (shortCode !== undefined) location.shortCode = shortCode.trim().toUpperCase();
    if (city !== undefined) location.city = city.trim();
    if (zone !== undefined) location.zone = zone.trim();
    if (isActive !== undefined) location.isActive = Boolean(isActive);
    if (displayOrder !== undefined) location.displayOrder = Number(displayOrder);

    const updated = await location.save();
    res.json(updated);
});

// @desc    Delete delivery location
// @route   DELETE /api/delivery-locations/:id
// @access  Private/Admin
const deleteDeliveryLocation = asyncHandler(async (req, res) => {
    const location = await DeliveryLocation.findById(req.params.id);

    if (!location) {
        res.status(404);
        throw new Error('Location not found');
    }

    await location.deleteOne();
    res.json({ message: 'Location removed successfully', id: req.params.id });
});

// @desc    Reset / reseed default Gondar locations
// @route   POST /api/delivery-locations/reset-defaults
// @access  Private/Admin
const resetDefaultLocations = asyncHandler(async (req, res) => {
    await DeliveryLocation.deleteMany({});
    const inserted = await DeliveryLocation.insertMany(DEFAULT_GONDAR_LOCATIONS);
    res.json({ message: 'Default Gondar locations reseeded successfully', locations: inserted });
});

module.exports = {
    getDeliveryLocations,
    createDeliveryLocation,
    updateDeliveryLocation,
    deleteDeliveryLocation,
    resetDefaultLocations,
};
