const express = require('express');
const { body } = require('express-validator');
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', protect, authorize('staff', 'admin'), getRooms);
router.get('/:id', protect, authorize('staff', 'admin'), getRoomById);

router.post(
  '/',
  protect,
  authorize('staff', 'admin'),
  [
    body('hotelId').isMongoId().withMessage('Valid hotelId is required'),
    body('roomTypeId').isMongoId().withMessage('Valid roomTypeId is required'),
    body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    body('housekeepingStatus')
      .optional()
      .isIn(['Clean', 'Dirty', 'Under Maintenance'])
      .withMessage('Invalid housekeeping status'),
    validate
  ],
  createRoom
);

router.put('/:id', protect, authorize('staff', 'admin'), updateRoom);
router.delete('/:id', protect, authorize('admin'), deleteRoom);

module.exports = router;
