const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

// @desc    Get all rooms for housekeeping inspection
// @route   GET /api/housekeeping/rooms
// @access  Private (Staff, Admin)
const getHousekeepingRooms = async (req, res, next) => {
  try {
    const { hotelId, status, floor } = req.query;
    const query = {};
    if (hotelId) query.hotelId = hotelId;
    if (status) query.housekeepingStatus = status;
    if (floor) query.floor = Number(floor);

    const rooms = await Room.find(query)
      .populate('hotelId', 'name city')
      .populate('roomTypeId', 'name capacity')
      .sort({ housekeepingStatus: -1, roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room housekeeping status
// @route   PUT /api/housekeeping/rooms/:id/status
// @access  Private (Staff, Admin)
const updateRoomStatus = async (req, res, next) => {
  try {
    const { housekeepingStatus, notes } = req.body;

    const validStatuses = ['Clean', 'Dirty', 'Under Maintenance'];
    if (!validStatuses.includes(housekeepingStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid housekeeping status. Must be one of: ${validStatuses.join(', ')}`,
        errorCode: 'INVALID_STATUS'
      });
    }

    const updateData = {
      housekeepingStatus,
      housekeepingNotes: notes || ''
    };

    if (housekeepingStatus === 'Clean') {
      updateData.lastCleanedAt = new Date();
    }

    const room = await Room.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('hotelId', 'name').populate('roomTypeId', 'name');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room not found with id ${req.params.id}`,
        errorCode: 'ROOM_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: `Room ${room.roomNumber} status successfully updated to ${housekeepingStatus}`,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get housekeeping statistics summary per hotel
// @route   GET /api/housekeeping/summary
// @access  Private (Staff, Admin)
const getHousekeepingSummary = async (req, res, next) => {
  try {
    const { hotelId } = req.query;
    const match = {};
    if (hotelId) match.hotelId = new (require('mongoose').Types.ObjectId)(hotelId);

    const summary = await Room.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$housekeepingStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const formatted = {
      Clean: 0,
      Dirty: 0,
      'Under Maintenance': 0,
      total: 0
    };

    summary.forEach((item) => {
      formatted[item._id] = item.count;
      formatted.total += item.count;
    });

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHousekeepingRooms,
  updateRoomStatus,
  getHousekeepingSummary
};
