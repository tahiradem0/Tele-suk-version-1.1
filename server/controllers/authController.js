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

    // Normalize phone
    const cleanPhone = phone.toString().trim().replace(/[^0-9]/g, '').replace(/^251/, '').replace(/^0/, '');

    // Check if user exists
    const userExists = await User.findOne({
        $or: [
            { phone: cleanPhone },
            { phone: '0' + cleanPhone },
            { phone: phone }
        ]
    });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
        name,
        phone: cleanPhone,
        password,
    });

    if (user) {
        const token = generateToken(user._id);
        const userObj = {
            _id: user._id,
            name: user.name,
            username: user.name,
            phone: user.phone,
            email: user.email || '',
            isAdmin: user.isAdmin,
        };
        res.status(201).json({
            ...userObj,
            token,
            user: userObj,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @desc    Authenticate a user (supports both customer phone/password and admin single-password access)
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const rawIdentifier = (req.body.phone || req.body.email || req.body.username || req.body.identifier || '').toString().trim();
    const enteredPassword = (req.body.password || '').toString();

    if (!enteredPassword) {
        res.status(400);
        throw new Error('Please enter your password');
    }

    let user = null;

    // 1. Single-Password Admin Gate:
    // If no identifier is passed (or identifier is an admin keyword), lookup the administrator directly
    const isAdminKeyword = !rawIdentifier || ['admin', 'adamine', 'adamine one', 'superadmin', 'adamine 1'].includes(rawIdentifier.toLowerCase());
    if (isAdminKeyword) {
        user = await User.findOne({ isAdmin: true });
        if (!user && !rawIdentifier) {
            res.status(401);
            throw new Error('No administrator account found in system');
        }
    }

    // 2. Standard Customer Lookup by phone/email/name if identifier provided
    if (!user && rawIdentifier) {
        const cleanPhone = rawIdentifier.replace(/[^0-9]/g, '').replace(/^251/, '').replace(/^0/, '');
        const lowerIdentifier = rawIdentifier.toLowerCase();
        const orConditions = [];

        if (cleanPhone.length >= 6) {
            orConditions.push({ phone: cleanPhone });
            orConditions.push({ phone: '0' + cleanPhone });
            orConditions.push({ phone: '251' + cleanPhone });
            orConditions.push({ phone: rawIdentifier });
        }

        if (lowerIdentifier.includes('@')) {
            orConditions.push({ email: lowerIdentifier });
        }

        user = orConditions.length > 0 ? await User.findOne({ $or: orConditions }) : null;

        if (!user) {
            user = await User.findOne({ name: { $regex: new RegExp(`^${rawIdentifier}$`, 'i') } });
        }
    }

    if (!user) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    // Check password
    let isPasswordValid = await user.matchPassword(enteredPassword.trim());
    if (!isPasswordValid) {
        isPasswordValid = await user.matchPassword(enteredPassword);
    }

    if (!isPasswordValid) {
        res.status(401);
        throw new Error('Invalid password');
    }

    // Generate encrypted JWT token
    const token = generateToken(user._id);

    const userObj = {
        _id: user._id,
        name: user.name,
        username: user.name,
        phone: user.phone,
        email: user.email || '',
        isAdmin: user.isAdmin,
    };

    res.json({
        ...userObj,
        token,
        user: userObj,
    });
});

// @desc    Update user / admin password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
    const { newPassword, currentPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (currentPassword) {
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            res.status(400);
            throw new Error('Current password is incorrect');
        }
    }

    if (!newPassword || newPassword.trim().length === 0) {
        res.status(400);
        throw new Error('New password cannot be empty');
    }

    user.password = newPassword.trim();
    await user.save();

    res.json({ message: 'Password updated successfully' });
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
    updatePassword,
};
