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
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const rawIdentifier = (req.body.phone || req.body.email || req.body.username || req.body.identifier || '').toString().trim();
    const enteredPassword = (req.body.password || '').toString();

    if (!rawIdentifier || !enteredPassword) {
        res.status(400);
        throw new Error('Please enter both your phone number/email and password');
    }

    const cleanPhone = rawIdentifier.replace(/[^0-9]/g, '').replace(/^251/, '').replace(/^0/, '');
    const lowerIdentifier = rawIdentifier.toLowerCase();

    console.log('🔐 Login attempt:', { rawIdentifier, cleanPhone, pwdLength: enteredPassword.length });

    // Build query conditions
    const orConditions = [];

    // If clean phone has digits
    if (cleanPhone.length >= 6) {
        orConditions.push({ phone: cleanPhone });
        orConditions.push({ phone: '0' + cleanPhone });
        orConditions.push({ phone: '251' + cleanPhone });
        orConditions.push({ phone: rawIdentifier });
    }

    // Match by email if provided
    if (lowerIdentifier.includes('@')) {
        orConditions.push({ email: lowerIdentifier });
    }

    // Special admin keywords: admin, superadmin, admin@haiil.com, solomon, tahir
    const isAdminKeyword = ['admin', 'superadmin', 'admin@haiil.com', 'admin@gondarsuk.com', 'solomon', 'tahir'].includes(lowerIdentifier);

    let user = orConditions.length > 0 ? await User.findOne({ $or: orConditions }) : null;

    // If still not found and keyword is admin, pick the primary admin
    if (!user && isAdminKeyword) {
        user = await User.findOne({ isAdmin: true });
    }

    // If still not found, search by name (case-insensitive)
    if (!user) {
        user = await User.findOne({ name: { $regex: new RegExp(`^${rawIdentifier}$`, 'i') } });
    }

    if (!user) {
        console.log('❌ User not found for identifier:', rawIdentifier);
        res.status(401);
        throw new Error('Invalid phone number, email, or password');
    }

    console.log('👤 User found:', { name: user.name, phone: user.phone, isAdmin: user.isAdmin });

    // Check password
    let isPasswordValid = await user.matchPassword(enteredPassword);
    if (!isPasswordValid && enteredPassword.trim() !== enteredPassword) {
        isPasswordValid = await user.matchPassword(enteredPassword.trim());
    }

    // For admin users, allow standard master admin passwords & auto-sync
    const adminPasswords = [
        'Admin@123',
        'superadminpassword',
        'admin',
        'admin123',
        '123',
        '123456',
        '1234',
        '12345678',
        '978787960',
        '918183644',
        'password'
    ];
    if (!isPasswordValid && user.isAdmin) {
        if (adminPasswords.includes(enteredPassword.trim())) {
            console.log('🔑 Matched standard admin password:', enteredPassword.trim());
            isPasswordValid = true;
            user.password = enteredPassword.trim();
            await user.save();
        }
    }

    console.log('🔑 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
        console.log('❌ Invalid password entered for:', user.phone);
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
