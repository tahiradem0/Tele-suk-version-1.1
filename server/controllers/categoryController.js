const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({});
    res.json(categories);
});

// @desc    reate category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;
    let { slug } = req.body;

    if (!slug) {
        slug = name.toLowerCase().split(' ').join('-');
    }

    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
        res.status(400);
        throw new Error('Category already exists');
    }

    const category = await Category.create({ name, slug });
    res.status(201).json(category);
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        category.name = req.body.name || category.name;
        category.slug = req.body.slug || category.slug;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        await category.deleteOne();
        res.json({ message: 'Category removed' });
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
});

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
