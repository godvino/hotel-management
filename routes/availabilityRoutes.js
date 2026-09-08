const express = require('express');
const { query } = require('express-validator');
const { searchAvailability } = require('../controllers/availabilityController');
const validate = require('../middleware/validate');

const router = express.Router();

router.get(
  '/search',
  [
    query('checkIn').notEmpty().withMessage('checkIn date is required (YYYY-MM-DD)'),
    query('checkOut').notEmpty().withMessage('checkOut date is required (YYYY-MM-DD)'),
    validate
  ],
  searchAvailability
);

module.exports = router;
