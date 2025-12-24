# Tele-Suk E-Commerce Platform

A modern, full-stack e-commerce platform built with React, Node.js, Express, and MongoDB.

## Features

- 🛒 Shopping cart with persistent storage
- 💳 Chapa payment integration
- 👤 User authentication & authorization
- 📱 Responsive design (mobile & desktop)
- 🎨 Dynamic banners with custom actions
- 📊 Admin dashboard with real-time statistics
- 📦 Order management with detailed views
- ✅ Persistent order checklist
- 🖼️ Cloudinary image uploads
- 🔐 Secure JWT authentication

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios
- Lucide React (icons)
- Pure CSS

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Cloudinary for image storage
- Chapa for payments
- Bcrypt for password hashing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Cloudinary account
- Chapa account (for payments)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd version-1.1
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Install frontend dependencies
```bash
cd ../client
npm install
```

4. Configure environment variables

Create `server/.env` file:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/tele-suk
JWT_SECRET=your_jwt_secret_key
CHAPA_SECRET_KEY=your_chapa_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. Start MongoDB
```bash
mongod
```

6. Start the backend server
```bash
cd server
npm start
```

7. Start the frontend development server
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`

## Production Deployment

### Backend (Render)
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Set environment variables
5. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Set `VITE_API_URL` environment variable
4. Deploy

See [deployment guide](./DEPLOYMENT.md) for detailed instructions.

## Admin Access

To create an admin user, run:
```bash
cd server
node makeAdmin.js
```

Then login at `/admin` with your credentials.

## Project Structure

```
version-1.1/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (ShopContext)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── styles/        # CSS files
│   └── public/            # Static assets
│
└── server/                # Backend API
    ├── config/            # Configuration files
    ├── controllers/       # Route controllers
    ├── middleware/        # Custom middleware
    ├── models/            # Mongoose models
    └── routes/            # API routes
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/myorders` - Get user orders
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Payment
- `POST /api/payment/initialize` - Initialize payment
- `GET /api/payment/verify/:tx_ref` - Verify payment

See full API documentation in `/docs/API.md`

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
