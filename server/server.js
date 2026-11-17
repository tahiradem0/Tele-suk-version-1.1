const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');

const app = express();

// Middleware
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            process.env.FRONTEND_URL,
            process.env.CLIENT_URL,
            'https://tele-suk.vercel.app',
            'https://your-app.vercel.app'
        ].filter(Boolean);

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Normalize origins by removing trailing slashes
        const normalize = (url) => url ? url.replace(/\/$/, '') : '';
        const normalizedOrigin = normalize(origin);
        
        const isAllowed = allowedOrigins.some(
            allowed => normalize(allowed) === normalizedOrigin
        );

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin); // Debug log
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security & Cryptographic Protection Headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    // Prevent caching for sensitive admin and financial endpoints
    if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/capital') || req.path.startsWith('/api/store') || req.path.startsWith('/api/debts') || req.path.startsWith('/api/expenses')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
    }
    next();
});

// Database Connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/capital', require('./routes/capitalRoutes'));
app.use('/api/debts', require('./routes/debtRoutes'));
app.use('/api/store', require('./routes/storeRoutes'));
app.use('/api/delivery-locations', require('./routes/deliveryLocationRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Gondar ሱቅ API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

// Render Keep-Alive Ping (every 14 minutes)
if (process.env.NODE_ENV === 'production') {
    const PING_URL = process.env.RENDER_EXTERNAL_URL || 'https://tele-suk-api.onrender.com';
    const PING_INTERVAL = 14 * 60 * 1000; 
    setInterval(() => {
        const https = require('https');
        https.get(PING_URL, (res) => {
            console.log(`Keep-alive ping successful: ${res.statusCode}`);
        }).on('error', (e) => {
            console.error(`Keep-alive ping error: ${e.message}`);
        });
    }, PING_INTERVAL);
}

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
