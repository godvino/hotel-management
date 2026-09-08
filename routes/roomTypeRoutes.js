const express = require('express');
const { body } = require('express-validator');
const {
  getRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType
} = require('../controllers/roomTypeController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', getRoomTypes);
router.get('/:id', getRoomTypeById);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('hotelId').isMongoId().withMessage('Valid hotelId is required'),
    body('name').trim().notEmpty().withMessage('Room type name is required'),
    body('basePrice').isFloat({ min: 0 }).withMessage('Valid basePrice is required'),
    body('totalRooms').isInt({ min: 1 }).withMessage('Total rooms must be at least 1'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    validate
  ],
  createRoomType
);

router.put('/:id', protect, authorize('admin'), updateRoomType);
router.delete('/:id', protect, authorize('admin'), deleteRoomType);

module.exports = router;
