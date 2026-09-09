const express = require('express');
const { getOccupancyReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/occupancy', protect, authorize('admin'), getOccupancyReport);

module.exports = router;
