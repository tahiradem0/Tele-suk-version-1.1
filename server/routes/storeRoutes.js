const express = require('express');
const router = express.Router();
const {
    getStoreOverview,
    restockProduct,
    adjustStock,
    getStockMovements,
    getSmartStockInsights,
} = require('../controllers/storeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/overview', getStoreOverview);
router.get('/insights', getSmartStockInsights);
router.post('/restock', restockProduct);
router.post('/adjust', adjustStock);
router.get('/movements', getStockMovements);

module.exports = router;
