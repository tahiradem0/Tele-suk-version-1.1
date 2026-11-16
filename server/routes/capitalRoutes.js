const express = require('express');
const router = express.Router();
const {
    getCapitalOverview,
    getTransactions,
    createTransaction,
    deleteTransaction,
} = require('../controllers/capitalController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/overview', getCapitalOverview);
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.delete('/transactions/:id', deleteTransaction);

module.exports = router;
