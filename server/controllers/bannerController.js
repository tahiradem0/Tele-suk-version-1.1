const asyncHandler = require('express-async-handler');
const Banner = require('../models/Banner');

// @desc    Get all active banners
// @route   GET /api/banners
// @access  Public
const getActiveBanners = asyncHandler(async (req, res) => {
    const banners = await Banner.find({ active: true });
    res.json(banners);
});

// @desc    Get all banners (Admin)
// @route   GET /api/banners/all
// @access  Private/Admin
const getAllBanners = asyncHandler(async (req, res) => {
    const banners = await Banner.find({});
    res.json(banners);
});

// @desc    Create new banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res) => {
    const { title, subtitle } = req.body;
    const image = req.file ? req.file.path : null;

    if (!image) {
        res.status(400);
        throw new Error('Image is required');
    }

    const banner = await Banner.create({
        title,
        subtitle,
        image,
    });

    res.status(201).json(banner);
});

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (banner) {
        banner.title = req.body.title || banner.title;
        banner.subtitle = req.body.subtitle || banner.subtitle;
        banner.active = req.body.active !== undefined ? req.body.active : banner.active;

        if (req.file) {
            banner.image = req.file.path;
        }

        const updatedBanner = await banner.save();
        res.json(updatedBanner);
    } else {
        res.status(404);
        throw new Error('Banner not found');
    }
});

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (banner) {
        await banner.deleteOne();
        res.json({ message: 'Banner removed' });
    } else {
        res.status(404);
        throw new Error('Banner not found');
    }
});

module.exports = {
    getActiveBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
};
