const RoomType = require('../models/RoomType');
const Hotel = require('../models/Hotel');

// @desc    Get room types (optionally filtered by hotelId)
// @route   GET /api/room-types
// @access  Public
const getRoomTypes = async (req, res, next) => {
  try {
    const { hotelId } = req.query;
    const query = {};
    if (hotelId) {
      query.hotelId = hotelId;
    }

    const roomTypes = await RoomType.find(query).populate('hotelId', 'name city rating');

    res.status(200).json({
      success: true,
      count: roomTypes.length,
      data: roomTypes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room type
// @route   GET /api/room-types/:id
// @access  Public
const getRoomTypeById = async (req, res, next) => {
  try {
    const roomType = await RoomType.findById(req.params.id).populate('hotelId', 'name city rating address');
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: `Room type not found with id ${req.params.id}`,
        errorCode: 'ROOM_TYPE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      data: roomType
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new room type
// @route   POST /api/room-types
// @access  Private (Admin only)
const createRoomType = async (req, res, next) => {
  try {
    const { hotelId, name, basePrice, totalRooms, capacity, bedType, amenities, description } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `Referenced hotel with id ${hotelId} does not exist`,
        errorCode: 'HOTEL_NOT_FOUND'
      });
    }

    const roomType = await RoomType.create({
      hotelId,
      name,
      basePrice,
      totalRooms,
      capacity: capacity || 2,
      bedType: bedType || 'King Bed',
      amenities: amenities || ['WiFi', 'Smart TV', 'En-suite Bathroom'],
      description
    });

    res.status(201).json({
      success: true,
      message: 'Room type created successfully',
      data: roomType
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room type
// @route   PUT /api/room-types/:id
// @access  Private (Admin only)
const updateRoomType = async (req, res, next) => {
  try {
    const roomType = await RoomType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: `Room type not found with id ${req.params.id}`,
        errorCode: 'ROOM_TYPE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room type updated successfully',
      data: roomType
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete room type
// @route   DELETE /api/room-types/:id
// @access  Private (Admin only)
const deleteRoomType = async (req, res, next) => {
  try {
    const roomType = await RoomType.findByIdAndDelete(req.params.id);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: `Room type not found with id ${req.params.id}`,
        errorCode: 'ROOM_TYPE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room type deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType
};
