const express = require('express');
const { body } = require('express-validator');
const {
  getHousekeepingRooms,
  updateRoomStatus,
  getHousekeepingSummary
} = require('../controllers/housekeepingController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);
router.use(authorize('staff', 'admin'));

router.get('/rooms', getHousekeepingRooms);
router.get('/summary', getHousekeepingSummary);

router.put(
  '/rooms/:id/status',
  [
    body('housekeepingStatus')
      .isIn(['Clean', 'Dirty', 'Under Maintenance'])
      .withMessage('housekeepingStatus must be Clean, Dirty, or Under Maintenance'),
    validate
  ],
  updateRoomStatus
);

module.exports = router;
