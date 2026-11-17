const express = require('express');
const router = express.Router();
const {
    getGroups,
    createGroup,
    joinGroup,
    updateBudget,
} = require('../controllers/groupController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/', getGroups);
router.post('/', createGroup);
router.post('/create', createGroup);
router.post('/join', joinGroup);
router.put('/:id/budget', updateBudget);

module.exports = router;
