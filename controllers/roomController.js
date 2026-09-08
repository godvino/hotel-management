const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const Hotel = require('../models/Hotel');

// @desc    Get physical rooms inventory
// @route   GET /api/rooms
// @access  Private (Staff, Admin)
const getRooms = async (req, res, next) => {
  try {
    const { hotelId, roomTypeId, housekeepingStatus, floor } = req.query;
    const query = {};

    if (hotelId) query.hotelId = hotelId;
    if (roomTypeId) query.roomTypeId = roomTypeId;
    if (housekeepingStatus) query.housekeepingStatus = housekeepingStatus;
    if (floor) query.floor = Number(floor);

    const rooms = await Room.find(query)
      .populate('hotelId', 'name city')
      .populate('roomTypeId', 'name basePrice capacity')
      .sort({ roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private (Staff, Admin)
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('hotelId', 'name city')
      .populate('roomTypeId', 'name basePrice capacity');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room not found with id ${req.params.id}`,
        errorCode: 'ROOM_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create physical room entry
// @route   POST /api/rooms
// @access  Private (Staff, Admin)
const createRoom = async (req, res, next) => {
  try {
    const { hotelId, roomTypeId, roomNumber, floor, housekeepingStatus, housekeepingNotes } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `Hotel not found with id ${hotelId}`,
        errorCode: 'HOTEL_NOT_FOUND'
      });
    }

    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: `RoomType not found with id ${roomTypeId}`,
        errorCode: 'ROOM_TYPE_NOT_FOUND'
      });
    }

    const existingRoom = await Room.findOne({ hotelId, roomNumber });
    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: `Room ${roomNumber} already exists in hotel ${hotel.name}`,
        errorCode: 'DUPLICATE_ROOM_NUMBER'
      });
    }

    const room = await Room.create({
      hotelId,
      roomTypeId,
      roomNumber,
      floor: floor || 1,
      housekeepingStatus: housekeepingStatus || 'Clean',
      housekeepingNotes: housekeepingNotes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Room inventory created successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room details
// @route   PUT /api/rooms/:id
// @access  Private (Staff, Admin)
const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room not found with id ${req.params.id}`,
        errorCode: 'ROOM_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete physical room
// @route   DELETE /api/rooms/:id
// @access  Private (Admin only)
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room not found with id ${req.params.id}`,
        errorCode: 'ROOM_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};
