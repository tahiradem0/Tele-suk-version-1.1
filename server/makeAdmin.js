const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const phone = '978787960'; // The user we found
        const user = await User.findOne({ phone });

        if (user) {
            user.isAdmin = true;
            await user.save();
            console.log(`SUCCESS: User ${user.name} (${user.phone}) is now an ADMIN.`);
        } else {
            console.log('User not found.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

makeAdmin();
