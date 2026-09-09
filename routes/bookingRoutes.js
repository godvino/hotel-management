const express = require('express');
const { body } = require('express-validator');
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  confirmBooking,
  checkInBooking,
  checkOutBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    body('roomTypeId').isMongoId().withMessage('Valid roomTypeId is required'),
    body('checkIn').isISO8601().withMessage('Valid checkIn date is required (YYYY-MM-DD)'),
    body('checkOut').isISO8601().withMessage('Valid checkOut date is required (YYYY-MM-DD)'),
    body('guestsCount').optional().isInt({ min: 1 }).withMessage('guestsCount must be at least 1'),
    validate
  ],
  createBooking
);

router.get('/my-bookings', protect, getMyBookings);
router.get('/', protect, authorize('staff', 'admin'), getAllBookings);
router.get('/:id', protect, getBookingById);

router.put('/:id/confirm', protect, confirmBooking);
router.put('/:id/checkin', protect, authorize('staff', 'admin'), checkInBooking);
router.put('/:id/checkout', protect, authorize('staff', 'admin'), checkOutBooking);

module.exports = router;
