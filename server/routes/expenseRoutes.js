const express = require('express');
const router = express.Router();
const {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseOverview,
    getCategories,
    createCategory,
} = require('../controllers/expenseController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/overview', getExpenseOverview);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
