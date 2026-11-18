# Production Deployment Guide (Render + Vercel)

This project is pre-configured for zero-friction production deployment:
- **Backend API**: Deployed on **Render** (Node.js + Express + MongoDB Atlas + Cloudinary + Chapa)
- **Frontend SPA / PWA**: Deployed on **Vercel** (React + Vite)

---

## Step 1: MongoDB Atlas Setup

1. Create or open your cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) so Render's dynamic IPs can connect.
3. Copy your connection string (`MONGO_URI`), e.g.:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/tele-suk?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy Backend to Render

### Option A: One-Click Blueprint (Recommended)
A root `render.yaml` Blueprint is already included in the repository.
1. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Blueprint**.
2. Connect your GitHub repo `tahiradem0/Tele-suk-version-1.1`.
3. Render automatically reads `render.yaml` (`rootDir: server`, `buildCommand: npm install`, `startCommand: npm start`, `healthCheckPath: /api/health`).
4. Fill in the prompted secret environment variables and click **Apply**.

### Option B: Manual Web Service
1. Click **New +** → **Web Service** → select your GitHub repo.
2. Configure:
   - **Name**: `gondar-suk-api`
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`

### Required Render Environment Variables
| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Strong random secret (min 32 chars) |
| `FRONTEND_URL` | Your Vercel URL (e.g. `https://tele-suk.vercel.app`) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `CHAPA_LIVE_SECRET_KEY` | Your Chapa live secret key (`CHASECK-...`) |
| `CHAPA_LIVE_PUBLIC_KEY` | Your Chapa live public key (`CHAPUBK-...`) |
| `CHAPA_TEST_SECRET_KEY` | Your Chapa test secret key (`CHASECK_TEST-...`) |
| `CHAPA_TEST_PUBLIC_KEY` | Your Chapa test public key (`CHAPUBK_TEST-...`) |
| `ALLOWED_ORIGINS` | *(Optional)* Comma-separated custom domains (all `*.vercel.app` origins are allowed automatically) |

3. Once deployed, verify your backend is live by visiting:
   `https://<your-render-service>.onrender.com/api/health`
   You should see `{ "status": "ok", "database": "connected", ... }`.

---

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New...** → **Project**.
2. Import your GitHub repository `tahiradem0/Tele-suk-version-1.1`.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client` (Click **Edit** and select `client`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://<your-render-service>.onrender.com/api`
   *(Note: Trailing slashes and `/api` are automatically normalized by the client.)*
5. Click **Deploy**.
6. After Vercel finishes deploying, copy your live Vercel URL (e.g. `https://your-app.vercel.app`) and set it as `FRONTEND_URL` in Render's Environment Variables.

---

## Step 4: Post-Deployment Security Checklist

1. **Admin Login**: Visit `https://<your-vercel-domain>/admin/login` and log in with your admin password.
2. **Change Admin Password**: Immediately go to **Admin → Settings → Admin Security** and set a strong production password.
3. **Switch Chapa Mode**: In **Admin → Settings → Payment Gateway**, toggle to **Live Mode** when ready to accept real ETB payments (and disable Mock Checkout).
4. **Verify Health**: Confirm `GET /api/health` returns `"database": "connected"` and `GET /api/settings` (unauthenticated) does **not** expose `chapaLiveSecretKey`.
