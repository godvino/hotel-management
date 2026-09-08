const express = require('express');
const { body } = require('express-validator');
const {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel
} = require('../controllers/hotelController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const { searchAvailability } = require('../controllers/availabilityController');

const router = express.Router();

// Exact match for sample endpoint: GET /api/hotels/search
router.get('/search', searchAvailability);
router.get('/', getHotels);
router.get('/:id', getHotelById);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Hotel name is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    validate
  ],
  createHotel
);

router.put('/:id', protect, authorize('admin'), updateHotel);
router.delete('/:id', protect, authorize('admin'), deleteHotel);

module.exports = router;
