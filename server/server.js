const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
require('dotenv').config();

const app = express();

// Connect to database
connectDB();

// Secure CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL, // Production frontend
  'http://localhost:3000'   // Local development
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
  }
  },
  credentials: true
}));

// Middleware
app.use(express.json());

// Routes (with /api prefix)
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/cart', require('./src/routes/cart'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/service-requests', require('./src/routes/services'));
app.use('/api/service-types', require('./src/routes/serviceTypes'));
app.use('/api/equipment-types', require('./src/routes/equipmentTypes'));

// Basic route for checking if the server is running
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TechFarm API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export the app for Vercel
module.exports = app;
