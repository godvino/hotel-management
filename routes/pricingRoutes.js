const express = require('express');
const { body } = require('express-validator');
const {
  getPricingRules,
  createPricingRule,
  getPriceQuote,
  updatePricingRule,
  deletePricingRule
} = require('../controllers/pricingController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/quote', getPriceQuote);
router.get('/', protect, authorize('staff', 'admin'), getPricingRules);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('roomTypeId').isMongoId().withMessage('Valid roomTypeId is required'),
    body('season').trim().notEmpty().withMessage('Season name is required'),
    body('startDate').isISO8601().withMessage('Valid startDate is required'),
    body('endDate').isISO8601().withMessage('Valid endDate is required'),
    body('multiplier').isFloat({ min: 0.1 }).withMessage('Valid multiplier is required'),
    validate
  ],
  createPricingRule
);

router.put('/:id', protect, authorize('admin'), updatePricingRule);
router.delete('/:id', protect, authorize('admin'), deletePricingRule);

module.exports = router;
