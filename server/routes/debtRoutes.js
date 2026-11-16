const express = require('express');
const router = express.Router();
const {
    getDebts,
    createDebt,
    recordPayment,
    updateDebt,
    deleteDebt,
} = require('../controllers/debtController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/', getDebts);
router.post('/', createDebt);
router.post('/:id/pay', recordPayment);
router.put('/:id', updateDebt);
router.delete('/:id', deleteDebt);

module.exports = router;
