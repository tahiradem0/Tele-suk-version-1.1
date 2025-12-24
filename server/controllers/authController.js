const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ phone });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password is handled in Model pre-save

    // Create user
    const user = await User.create({
        name,
        phone,
        password,
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            phone: user.phone,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const { phone, password } = req.body;

    console.log('🔐 Login attempt for phone:', phone);

    // Find user
    const user = await User.findOne({ phone });

    if (!user) {
        console.log('❌ User not found:', phone);
        res.status(401);
        throw new Error('Invalid phone number or password');
    }

    console.log('👤 User found:', { name: user.name, isAdmin: user.isAdmin });

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    console.log('🔑 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
        console.log('❌ Invalid password for user:', phone);
        res.status(401);
        throw new Error('Invalid phone number or password');
    }

    // Generate token
    const token = generateToken(user._id);

    console.log('✅ Login successful:', {
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin
    });

    res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        token,
    });
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
});

module.exports = {
    register,
    login,
    getMe,
};
