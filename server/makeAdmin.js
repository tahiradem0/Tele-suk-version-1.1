const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Get phone number from command line argument or use default
        const phone = process.argv[2] || '978787960';

        const user = await User.findOne({ phone });

        if (user) {
            user.isAdmin = true;
            await user.save();
            console.log(`\n✅ SUCCESS: User ${user.name} (${user.phone}) is now an ADMIN.\n`);
        } else {
            console.log(`\n❌ ERROR: No user found with phone number: ${phone}`);
            console.log('Please register this user first, then run this script again.\n');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

makeAdmin();
