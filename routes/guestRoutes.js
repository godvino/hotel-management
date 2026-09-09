const express = require('express');
const { getGuestBookingsById } = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Exact match for sample endpoint: GET /api/guests/:id/bookings
router.get('/:id/bookings', protect, getGuestBookingsById);

module.exports = router;
