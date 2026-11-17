const express = require('express');
const router = express.Router();
const {
    getDeliveryLocations,
    createDeliveryLocation,
    updateDeliveryLocation,
    deleteDeliveryLocation,
    resetDefaultLocations,
} = require('../controllers/deliveryLocationController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getDeliveryLocations)
    .post(protect, admin, createDeliveryLocation);

router.post('/reset-defaults', protect, admin, resetDefaultLocations);

router.route('/:id')
    .put(protect, admin, updateDeliveryLocation)
    .delete(protect, admin, deleteDeliveryLocation);

module.exports = router;
