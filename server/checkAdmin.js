const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const users = await User.find({});
        console.log('\n--- SYSTEM USERS ---');
        users.forEach(user => {
            console.log(`User: ${user.name} | Phone: ${user.phone} | Admin: ${user.isAdmin ? 'YES' : 'NO'} | ID: ${user._id}`);
        });
        console.log('--------------------\n');

        const admins = users.filter(u => u.isAdmin);
        if (admins.length === 0) {
            console.log('WARNING: No admin users found! You will not be able to manage the site.');
            console.log('To make a user admin, you can use MongoDB Compass or a script.');
        } else {
            console.log(`Found ${admins.length} admin(s).`);
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAdmin();
