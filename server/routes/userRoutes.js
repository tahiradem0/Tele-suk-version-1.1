const express = require('express');
const router = express.Router();
const { getUsers, deleteUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getUsers);
router.route('/:id').delete(protect, admin, deleteUser);

module.exports = router;
