const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../.env' });

const Order = require('../models/Order');
const CapitalTransaction = require('../models/CapitalTransaction');
const StockMovement = require('../models/StockMovement');
const Debt = require('../models/Debt');
const User = require('../models/User');
const Settings = require('../models/Settings');
const Product = require('../models/Product');

async function cleanReset() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Wipe Orders
        const ordersRes = await Order.deleteMany({});
        console.log(`🧹 Deleted ${ordersRes.deletedCount} orders.`);

        // 2. Wipe Capital Transactions
        const capitalRes = await CapitalTransaction.deleteMany({});
        console.log(`🧹 Deleted ${capitalRes.deletedCount} capital transactions.`);

        // 3. Wipe Stock Movements audit trail
        const stockRes = await StockMovement.deleteMany({});
        console.log(`🧹 Deleted ${stockRes.deletedCount} stock movement logs.`);

        // 4. Wipe Debts & Credits
        const debtRes = await Debt.deleteMany({});
        console.log(`🧹 Deleted ${debtRes.deletedCount} debts/credits.`);

        // 5. Clean Users (delete non-admin customers)
        const userRes = await User.deleteMany({ isAdmin: false });
        console.log(`🧹 Deleted ${userRes.deletedCount} customer accounts.`);

        // 6. Ensure Admin Accounts are cleanly set
        const salt = await bcrypt.genSalt(10);
        const adminHash = await bcrypt.hash('Admin@123', salt);

        // Solomon Moges
        await User.findOneAndUpdate(
            { phone: '978787960' },
            {
                name: 'Solomon moges',
                phone: '978787960',
                email: 'solomon@gondarsuk.com',
                password: adminHash,
                isAdmin: true
            },
            { upsert: true, new: true }
        );

        // Tahir Adem (Superadmin)
        await User.findOneAndUpdate(
            { phone: '918183644' },
            {
                name: 'Tahir Adem',
                phone: '918183644',
                email: 'admin@haiil.com',
                password: adminHash,
                isAdmin: true
            },
            { upsert: true, new: true }
        );
        console.log('✅ Admin accounts verified & preserved.');

        // 7. Ensure Clean Settings Document
        await Settings.deleteMany({});
        await Settings.create({
            deliveryFee: 5.00,
            paymentMode: 'test',
            themeMode: 'light',
            chapaTestSecretKey: 'CHASECK_TEST-IXvdkCmyuUbnyrFMtC2K6y8maSbXgrV5',
            chapaTestPublicKey: 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby',
            chapaLiveSecretKey: 'CHASECK-zUKTw15FI5pNaH1MEntujn63Mmw5IgXR',
            chapaLivePublicKey: 'CHAPUBK-ako9ciwIHZCGi1GiV9CzQdknSMBb1wby',
            storeName: 'Gondar ሱቅ',
            storePhone: '0978787960',
            storeEmail: 'admin@gondarsuk.com',
            allowMockCheckout: true
        });
        console.log('✅ Settings initialized with Chapa test mode & verified credentials.');

        // 8. Reset Product Inventory Stock
        const prodCount = await Product.countDocuments();
        if (prodCount > 0) {
            await Product.updateMany({}, {
                $set: {
                    stockQuantity: 100,
                    costPrice: 20,
                    minStockLevel: 5
                }
            });
            console.log(`📦 Reset inventory levels to 100 units across ${prodCount} products.`);
        }

        console.log('\n🎉 Database reset complete! Clean slate ready for testing.');
        process.exit(0);
    } catch (err) {
        console.error('Error during reset:', err);
        process.exit(1);
    }
}

cleanReset();
