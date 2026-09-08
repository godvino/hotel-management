require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const roomTypeRoutes = require('./routes/roomTypeRoutes');
const roomRoutes = require('./routes/roomRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const pricingRoutes = require('./routes/pricingRoutes');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use(cors());

// HTTP request logger in dev mode
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Root / Healthcheck
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hotel Room Booking & Reservation API is running',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);                   // Authentication & RBAC
app.use('/api/hotels', hotelRoutes);               // Hotels & Properties
app.use('/api/room-types', roomTypeRoutes);         // Room Categories & Types
app.use('/api/rooms', roomRoutes);                 // Physical Room Inventory
app.use('/api/availability', availabilityRoutes);   // Availability Search Engine
app.use('/api/pricing-rules', pricingRoutes);       // Dynamic Pricing Rules

// 404 Handler for undefined API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found on this server`,
    errorCode: 'ROUTE_NOT_FOUND'
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  });
}

module.exports = { app };
