# Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
2. **Render Account** - [Sign up](https://render.com)
3. **Vercel Account** - [Sign up](https://vercel.com)
4. **GitHub Repository** - Push your code to GitHub

---

## Step 1: Setup MongoDB Atlas

### Create Cluster
1. Login to MongoDB Atlas
2. Create a new project: "Tele-Suk"
3. Build a cluster (Free M0 tier)
4. Choose your region (closest to your users)
5. Click "Create Cluster"

### Configure Database Access
1. Go to "Database Access"
2. Add new database user
   - Username: `telesuk-admin`
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Atlas admin"
3. Click "Add User"

### Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string:
   ```
   mongodb+srv://telesuk-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name: `/tele-suk` before the `?`
   ```
   mongodb+srv://telesuk-admin:yourpassword@cluster0.xxxxx.mongodb.net/tele-suk?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy Backend to Render

### Prepare Repository
1. Ensure `render.yaml` exists in `/server` directory
2. Commit and push all changes to GitHub

### Create Web Service
1. Login to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `tele-suk-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### Set Environment Variables
Click "Advanced" → "Add Environment Variable" and add:

```
NODE_ENV=production
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<generate a strong random string - min 32 characters>
CHAPA_SECRET_KEY=<your Chapa secret key>
CLOUDINARY_CLOUD_NAME=<your Cloudinary cloud name>
CLOUDINARY_API_KEY=<your Cloudinary API key>
CLOUDINARY_API_SECRET=<your Cloudinary API secret>
FRONTEND_URL=<will add after Vercel deployment>
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL: `https://tele-suk-api.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

### Prepare Repository
1. Ensure `vercel.json` exists in `/client` directory
2. Update `package.json` in client folder to include build script:
   ```json
   {
     "scripts": {
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

### Import Project
1. Login to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Set Environment Variables
Add environment variable:
```
VITE_API_URL=https://tele-suk-api.onrender.com/api
```

### Deploy
1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. Copy your frontend URL: `https://tele-suk.vercel.app`

---

## Step 4: Update Backend CORS

1. Go back to Render dashboard
2. Open your backend service
3. Go to "Environment"
4. Update `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://tele-suk.vercel.app
   ```
5. Save changes (service will auto-redeploy)

---

## Step 5: Create Admin User

### Option 1: Using MongoDB Compass
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your Atlas connection string
3. Find the `users` collection
4. Find your user document
5. Edit and set `isAdmin: true`
6. Save

### Option 2: Using MongoDB Atlas UI
1. Go to MongoDB Atlas
2. Click "Browse Collections"
3. Navigate to `tele-suk` → `users`
4. Find your user
5. Click "Edit Document"
6. Change `isAdmin` from `false` to `true`
7. Click "Update"

### Option 3: Create Script (Temporary)
1. Temporarily add this to your backend:
   ```javascript
   // makeAdminRoute.js - DELETE AFTER USE!
   app.get('/make-admin/:phone', async (req, res) => {
     const user = await User.findOne({ phone: req.params.phone });
     if (user) {
       user.isAdmin = true;
       await user.save();
       res.json({ message: 'User is now admin' });
     }
   });
   ```
2. Visit: `https://tele-suk-api.onrender.com/make-admin/YOUR_PHONE`
3. **DELETE THIS ROUTE IMMEDIATELY AFTER USE**

---

## Step 6: Test Production Deployment

### Frontend Tests
- [ ] Visit your Vercel URL
- [ ] Browse products
- [ ] Add items to cart
- [ ] Refresh page (cart should persist)
- [ ] Register new account
- [ ] Login

### Admin Tests
- [ ] Login with admin account
- [ ] Access `/admin/dashboard`
- [ ] Check statistics are loading
- [ ] Create a test product
- [ ] Upload an image
- [ ] Create a banner
- [ ] View orders

### Payment Test
- [ ] Add item to cart
- [ ] Proceed to checkout
- [ ] Enter delivery address
- [ ] Click "Pay with Chapa"
- [ ] Complete test payment
- [ ] Verify order appears in admin panel

---

## Troubleshooting

### Backend Issues

**Service won't start:**
- Check Render logs for errors
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

**CORS errors:**
- Verify `FRONTEND_URL` matches your Vercel domain exactly
- Check for trailing slashes

**Database connection timeout:**
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check connection string format

### Frontend Issues

**API calls failing:**
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors
- Ensure backend is running

**Build failures:**
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Test build locally: `npm run build`

**Images not loading:**
- Verify Cloudinary credentials
- Check image URLs in database
- Test Cloudinary upload manually

---

## Performance Optimization

### Render Free Tier
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- Consider upgrading to paid plan for production

### Solutions:
1. **Keep-alive service**: Ping your API every 10 minutes
2. **Upgrade to paid plan**: $7/month for always-on service
3. **Use cron job**: External service to ping your API

### Vercel
- Automatic CDN caching
- Edge network for fast global delivery
- No cold starts

---

## Monitoring

### Render
- View logs: Dashboard → Service → Logs
- Monitor metrics: CPU, Memory usage
- Set up alerts for downtime

### Vercel
- Analytics: Dashboard → Project → Analytics
- View deployment logs
- Monitor bandwidth usage

### MongoDB Atlas
- Monitor database size
- Check connection count
- Review slow queries

---

## Backup Strategy

### Database Backups
1. MongoDB Atlas automatic backups (Free tier: 2 days retention)
2. Manual export:
   ```bash
   mongodump --uri="your-connection-string"
   ```

### Code Backups
- GitHub repository (primary)
- Local copies
- Regular commits

---

## Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS only (automatic on Render/Vercel)
- [ ] Environment variables secured
- [ ] MongoDB user has minimal required permissions
- [ ] CORS configured correctly
- [ ] No sensitive data in code
- [ ] `.env` files in `.gitignore`
- [ ] Admin routes protected
- [ ] Rate limiting enabled (optional)

---

## Cost Summary (Free Tier)

| Service | Free Tier Limits | Upgrade Cost |
|---------|------------------|--------------|
| MongoDB Atlas | 512MB storage | $9/month (2GB) |
| Render | 750 hours/month, sleeps after 15min | $7/month (always-on) |
| Vercel | 100GB bandwidth | $20/month (Pro) |
| Cloudinary | 25GB storage, 25GB bandwidth | $89/month |

**Total Free**: $0/month  
**Recommended Paid**: ~$16/month (Render + MongoDB)

---

## Next Steps

1. Set up custom domain (optional)
2. Configure email notifications
3. Add analytics (Google Analytics)
4. Set up error tracking (Sentry)
5. Implement backup automation
6. Add monitoring/uptime checks

---

## Support

If you encounter issues:
1. Check Render/Vercel logs
2. Review MongoDB Atlas metrics
3. Test API endpoints with Postman
4. Check browser console for errors

For persistent issues, review the troubleshooting section or check service status pages.
