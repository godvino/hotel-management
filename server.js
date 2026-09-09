require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const { autoSeedIfEmpty } = require('./utils/autoSeed');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const roomTypeRoutes = require('./routes/roomTypeRoutes');
const roomRoutes = require('./routes/roomRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const housekeepingRoutes = require('./routes/housekeepingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const guestRoutes = require('./routes/guestRoutes');

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

// Serve static assets for optional Frontend UI
app.use(express.static(path.join(__dirname, 'public')));

// API Root / Healthcheck
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hotel Room Booking & Reservation API is running',
    version: '1.0.0',
    status: 'healthy',
    docs: {
      postmanCollection: '/postman_collection.json',
      demoUI: '/'
    }
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);                   // Authentication & RBAC
app.use('/api/hotels', hotelRoutes);               // Hotels & Properties
app.use('/api/guests', guestRoutes);               // Guest Profiles & History
app.use('/api/room-types', roomTypeRoutes);         // Room Categories & Types
app.use('/api/rooms', roomRoutes);                 // Physical Room Inventory
app.use('/api/availability', availabilityRoutes);   // Availability Search Engine
app.use('/api/bookings', bookingRoutes);           // Bookings & Invoicing
app.use('/api/pricing-rules', pricingRoutes);       // Dynamic Pricing Rules
app.use('/api/housekeeping', housekeepingRoutes);   // Housekeeping Management
app.use('/api/admin/reports', reportRoutes);        // Admin Analytics & Occupancy Reports

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

// Connect to DB and start listening
let server;
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    await autoSeedIfEmpty();
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`🌐 Live Demo UI available at: http://localhost:${PORT}`);
      console.log(`📑 API Endpoints active across all 13 modules`);
    });
  });
}

module.exports = { app };
