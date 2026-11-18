const express = require('express');
const router = express.Router();
const {
    trackClick,
    getAffiliates,
    createAffiliate,
    updateAffiliate,
    recordPayout,
    deleteAffiliate,
} = require('../controllers/affiliateController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public referral link click tracker
router.post('/track-click', trackClick);

// Admin promoter management
router.route('/')
    .get(protect, admin, getAffiliates)
    .post(protect, admin, createAffiliate);

router.route('/:id')
    .put(protect, admin, updateAffiliate)
    .delete(protect, admin, deleteAffiliate);

router.post('/:id/payout', protect, admin, recordPayout);

module.exports = router;
