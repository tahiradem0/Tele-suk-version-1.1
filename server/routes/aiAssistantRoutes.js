const express = require('express');
const router = express.Router();
const {
    getAiStatus,
    parseVoiceCommand,
    scanReceiptImage,
    commitStructuredAction,
} = require('../controllers/aiAssistantController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/status', getAiStatus);
router.post('/parse-voice', parseVoiceCommand);
router.post('/scan-receipt', scanReceiptImage);
router.post('/commit', commitStructuredAction);

module.exports = router;
