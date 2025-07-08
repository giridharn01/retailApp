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

// Debug logging
console.log('FRONTEND_URL from env:', process.env.FRONTEND_URL);
console.log('Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    console.log('CORS request from origin:', origin);
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    }
    console.log('CORS allowed origin:', origin);
    return callback(null, true);
  },
  credentials: true
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Routes (without /api prefix)
app.use('/auth', require('./src/routes/auth'));
app.use('/users', require('./src/routes/users'));
app.use('/products', require('./src/routes/products'));
app.use('/cart', require('./src/routes/cart'));
app.use('/orders', require('./src/routes/orders'));
app.use('/service-requests', require('./src/routes/services'));
app.use('/service-types', require('./src/routes/serviceTypes'));
app.use('/equipment-types', require('./src/routes/equipmentTypes'));

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
