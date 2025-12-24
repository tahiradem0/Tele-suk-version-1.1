# Admin Setup Guide

## Quick Start: Create Your Admin Account

### Option 1: Register & Promote (Recommended - Easiest)

#### Step 1: Register Your Account
1. Open your browser and go to: http://localhost:5173
2. Click on "Login/Signup" or the profile icon
3. Fill in the registration form:
   - **Name**: Your name (e.g., "Admin User")
   - **Phone**: Your phone number (e.g., "912345678")
   - **Password**: Choose a strong password
4. Click "Register"
5. You should be logged in automatically

#### Step 2: Promote to Admin
1. Open a terminal in the `server` folder
2. Run the command with YOUR phone number:
   ```bash
   node makeAdmin.js YOUR_PHONE_NUMBER
   ```
   
   **Example:**
   ```bash
   node makeAdmin.js 912345678
   ```

3. You should see:
   ```
   MongoDB Connected
   ✅ SUCCESS: User Admin User (912345678) is now an ADMIN.
   ```

4. **Logout and login again** for changes to take effect

#### Step 3: Access Admin Panel
1. Go to: http://localhost:5173/admin
2. Login with your phone number and password
3. You should now see the admin dashboard! 🎉

---

### Option 2: Create Admin User Directly (Advanced)

If you want to create a new admin user from scratch using a script:

#### Create a new file: `server/createAdmin.js`

```javascript
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // CHANGE THESE VALUES
        const adminData = {
            name: 'Admin User',
            phone: '912345678',  // Your phone number
            password: 'Admin@123',  // Your password
            isAdmin: true
        };

        // Check if user already exists
        const existingUser = await User.findOne({ phone: adminData.phone });
        
        if (existingUser) {
            console.log(`\n❌ User with phone ${adminData.phone} already exists!`);
            console.log('Use makeAdmin.js to promote them instead.\n');
            process.exit();
        }

        // Create new admin user
        const admin = await User.create(adminData);
        console.log(`\n✅ SUCCESS: Admin user created!`);
        console.log(`Name: ${admin.name}`);
        console.log(`Phone: ${admin.phone}`);
        console.log(`Admin: ${admin.isAdmin}\n`);
        console.log('You can now login at /admin\n');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAdmin();
```

#### Run the script:
```bash
node createAdmin.js
```

---

### Option 3: Using MongoDB Compass (GUI Tool)

1. **Download MongoDB Compass**: https://www.mongodb.com/products/compass
2. **Connect** to your database: `mongodb://localhost:27017`
3. **Navigate** to `tele-suk` database → `users` collection
4. **Find your user** by phone number
5. **Edit the document** and change `isAdmin` from `false` to `true`
6. **Save** the changes
7. **Logout and login again**

---

### Option 4: Using MongoDB Shell

```bash
# Open MongoDB shell
mongosh

# Switch to your database
use tele-suk

# Find and update your user
db.users.updateOne(
  { phone: "912345678" },  // Your phone number
  { $set: { isAdmin: true } }
)

# Verify the change
db.users.findOne({ phone: "912345678" })
```

---

## For Production (MongoDB Atlas)

After deploying to production, use one of these methods:

### Method 1: MongoDB Atlas UI
1. Login to MongoDB Atlas
2. Click "Browse Collections"
3. Navigate to your database → `users` collection
4. Find your user document
5. Click "Edit Document"
6. Change `isAdmin: false` to `isAdmin: true`
7. Click "Update"

### Method 2: Temporary Admin Route (Use with Caution!)

Add this route to `server.js` temporarily:

```javascript
// TEMPORARY - DELETE AFTER USE!
app.get('/setup-admin/:phone', async (req, res) => {
    try {
        const User = require('./models/User');
        const user = await User.findOne({ phone: req.params.phone });
        if (user) {
            user.isAdmin = true;
            await user.save();
            res.json({ message: 'User is now admin', user: user.name });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
```

Visit: `https://your-app.onrender.com/setup-admin/YOUR_PHONE`

**⚠️ IMPORTANT: DELETE THIS ROUTE IMMEDIATELY AFTER USE!**

---

## Troubleshooting

### "User not found" error
- Make sure you registered the account first
- Check that you're using the correct phone number
- Phone numbers should be numbers only (no spaces, dashes, or +251)

### Can't access admin panel after promotion
- **Logout completely** and login again
- Clear browser cache and cookies
- Check browser console for errors

### Script won't run
- Make sure you're in the `server` folder
- Ensure MongoDB is running
- Check that `.env` file exists with correct `MONGO_URI`

---

## Security Best Practices

1. **Use strong passwords** for admin accounts
2. **Don't share** admin credentials
3. **Delete temporary routes** after use
4. **Change default passwords** immediately
5. **Use different credentials** for production

---

## Quick Reference

**Make existing user admin:**
```bash
cd server
node makeAdmin.js PHONE_NUMBER
```

**Check who is admin:**
```bash
node checkAdmin.js
```

**Login to admin panel:**
- Local: http://localhost:5173/admin
- Production: https://your-app.vercel.app/admin

---

Need help? Check the main README.md or DEPLOYMENT.md for more information!
