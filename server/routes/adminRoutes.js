const express = require('express');
const router = express.Router();
const { getStats, getFinancialReport } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/stats', protect, admin, getStats);
router.get('/financial-report', protect, admin, getFinancialReport);

module.exports = router;
