const express = require('express');
const router = express.Router();
const {
    getCrmOverview,
    aiWriteSms,
    sendSmsCampaign,
} = require('../controllers/crmController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/overview', getCrmOverview);
router.post('/ai-write-sms', aiWriteSms);
router.post('/send-sms', sendSmsCampaign);

module.exports = router;
