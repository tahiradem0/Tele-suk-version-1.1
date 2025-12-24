const express = require('express');
const router = express.Router();
const {
    getActiveBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
} = require('../controllers/bannerController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.route('/')
    .get(getActiveBanners)
    .post(protect, admin, upload.single('image'), createBanner);

router.route('/all').get(protect, admin, getAllBanners);

router.route('/:id')
    .put(protect, admin, upload.single('image'), updateBanner)
    .delete(protect, admin, deleteBanner);

module.exports = router;
