const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');

const app = express();

// Trust Render / reverse proxy headers (HTTPS, client IP)
app.set('trust proxy', 1);

// Middleware - Production & Development CORS
const corsOptions = {
    origin: (origin, callback) => {
        const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            process.env.FRONTEND_URL,
            process.env.CLIENT_URL,
            'https://tele-suk.vercel.app',
            ...extraOrigins,
        ].filter(Boolean);

        // Allow requests with no origin (mobile apps, server-to-server, Render health checks, curl)
        if (!origin) return callback(null, true);

        const normalize = (url) => (url ? url.trim().replace(/\/+$/, '') : '');
        const normalizedOrigin = normalize(origin);

        // Allow exact allowlist matches OR any Vercel deployment (*.vercel.app)
        const isExactAllowed = allowedOrigins.some(
            (allowed) => normalize(allowed) === normalizedOrigin
        );
        const isVercelDomain = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i.test(normalizedOrigin);

        if (isExactAllowed || isVercelDomain) {
            callback(null, true);
        } else {
            console.warn('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/ai', require('./routes/aiAssistantRoutes'));
app.use('/api/crm', require('./routes/crmRoutes'));

// Health Check Endpoint (for Render & Uptime Monitors)
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    res.status(200).json({
        status: 'ok',
        service: 'gondar-suk-api',
        environment: process.env.NODE_ENV || 'development',
        database: dbStatusMap[dbState] || 'unknown',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

// Basic Route
app.get('/', (req, res) => {
    res.json({
        message: 'Gondar ሱቅ API is running...',
        health: '/api/health',
    });
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

// Render Keep-Alive Ping (every 14 minutes when RENDER_EXTERNAL_URL is set)
if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const basePingUrl = process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
    const pingEndpoint = `${basePingUrl}/api/health`;
    const PING_INTERVAL = 14 * 60 * 1000;
    const httpClient = pingEndpoint.startsWith('https://') ? require('https') : require('http');

    setInterval(() => {
        httpClient.get(pingEndpoint, (res) => {
            res.resume(); // Drain response data to free up memory
            console.log(`Keep-alive ping (${pingEndpoint}): ${res.statusCode}`);
        }).on('error', (e) => {
            console.error(`Keep-alive ping error: ${e.message}`);
        });
    }, PING_INTERVAL);
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
