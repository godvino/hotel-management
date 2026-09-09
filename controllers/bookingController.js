const crypto = require('crypto');
const Booking = require('../models/Booking');
const RoomType = require('../models/RoomType');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const { calculateDynamicPricing } = require('../utils/pricingEngine');
const { getOverlapQuery } = require('../utils/dateUtils');

// Helper to generate booking reference (e.g. BK-9F8A1B)
const generateBookingRef = () => {
  return `BK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

// @desc    Create a reservation with date-range conflict validation (Module 5)
// @route   POST /api/bookings
// @access  Private (Guest, Staff, Admin)
const createBooking = async (req, res, next) => {
  try {
    const { hotelId, roomTypeId, checkIn, checkOut, guestsCount, specialRequests } = req.body;
    const guestId = req.user.role === 'guest' ? req.user._id : (req.body.guestId || req.user._id);

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be strictly after check-in date',
        errorCode: 'INVALID_DATE_RANGE'
      });
    }

    // Verify room type exists and belongs to hotel
    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: `Room type not found with id ${roomTypeId}`,
        errorCode: 'ROOM_TYPE_NOT_FOUND'
      });
    }

    if (hotelId && roomType.hotelId.toString() !== hotelId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'RoomType does not belong to the specified Hotel',
        errorCode: 'MISMATCHED_HOTEL'
      });
    }

    // Validate occupancy capacity
    const guests = Number(guestsCount) || 1;
    if (guests > roomType.capacity) {
      return res.status(400).json({
        success: false,
        message: `Guest count (${guests}) exceeds room capacity (${roomType.capacity})`,
        errorCode: 'CAPACITY_EXCEEDED'
      });
    }

    // Check availability conflict (prevent double-booking)
    const overlapFilter = {
      roomTypeId: roomType._id,
      ...getOverlapQuery(checkInDate, checkOutDate)
    };

    const bookedCount = await Booking.countDocuments(overlapFilter);
    const availableCount = roomType.totalRooms - bookedCount;

    if (availableCount <= 0) {
      return res.status(409).json({
        success: false,
        message: 'No rooms of this type are available for the selected dates. Conflict detected.',
        errorCode: 'ROOMS_UNAVAILABLE'
      });
    }

    // Dynamic Pricing Calculation (Module 6)
    const pricingBreakdown = await calculateDynamicPricing(roomType, checkInDate, checkOutDate);

    const booking = await Booking.create({
      bookingReference: generateBookingRef(),
      guestId,
      hotelId: roomType.hotelId,
      roomTypeId: roomType._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestsCount: guests,
      status: 'Reserved',
      pricingBreakdown,
      specialRequests: specialRequests || ''
    });

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current guest's booking history (Module 11)
// @route   GET /api/bookings/my-bookings
// @access  Private (Guest, Staff, Admin)
const getMyBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { guestId: req.user._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('hotelId', 'name city address rating')
      .populate('roomTypeId', 'name basePrice capacity bedType')
      .populate('roomAllocated', 'roomNumber floor housekeepingStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings across properties (Staff, Admin)
// @route   GET /api/bookings
// @access  Private (Staff, Admin)
const getAllBookings = async (req, res, next) => {
  try {
    const { status, hotelId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (hotelId) filter.hotelId = hotelId;

    const bookings = await Booking.find(filter)
      .populate('guestId', 'name email phone')
      .populate('hotelId', 'name city')
      .populate('roomTypeId', 'name basePrice')
      .populate('roomAllocated', 'roomNumber floor')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('guestId', 'name email phone')
      .populate('hotelId', 'name city address contactPhone contactEmail')
      .populate('roomTypeId', 'name basePrice capacity amenities bedType')
      .populate('roomAllocated', 'roomNumber floor housekeepingStatus');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking not found with id ${req.params.id}`,
        errorCode: 'BOOKING_NOT_FOUND'
      });
    }

    // Role verification: Guest can only see their own booking
    if (req.user.role === 'guest' && booking.guestId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view another guest\'s reservation',
        errorCode: 'FORBIDDEN'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm a reserved booking (Module 7)
// @route   PUT /api/bookings/:id/confirm
// @access  Private (Guest, Staff, Admin)
const confirmBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        errorCode: 'BOOKING_NOT_FOUND'
      });
    }

    if (booking.status !== 'Reserved') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm booking with current status '${booking.status}'. Only 'Reserved' bookings can be confirmed.`,
        errorCode: 'INVALID_STATUS_TRANSITION'
      });
    }

    booking.status = 'Confirmed';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Staff Check-in action (Module 8 & Module 7)
// @route   PUT /api/bookings/:id/checkin
// @access  Private (Staff, Admin)
const checkInBooking = async (req, res, next) => {
  try {
    const { roomId, remarks } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        errorCode: 'BOOKING_NOT_FOUND'
      });
    }

    // Status transition validation
    if (booking.status !== 'Reserved' && booking.status !== 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot check in. Current booking status is '${booking.status}'`,
        errorCode: 'INVALID_STATUS_TRANSITION'
      });
    }

    let allocatedRoom = null;

    if (roomId) {
      allocatedRoom = await Room.findById(roomId);
      if (!allocatedRoom) {
        return res.status(404).json({
          success: false,
          message: 'Specified room not found',
          errorCode: 'ROOM_NOT_FOUND'
        });
      }
      if (allocatedRoom.housekeepingStatus !== 'Clean') {
        return res.status(409).json({
          success: false,
          message: `Room ${allocatedRoom.roomNumber} is ${allocatedRoom.housekeepingStatus} and cannot be checked in until Clean`,
          errorCode: 'ROOM_NOT_CLEAN'
        });
      }
    } else {
      // Automatically find a clean operational room for this roomType
      allocatedRoom = await Room.findOne({
        hotelId: booking.hotelId,
        roomTypeId: booking.roomTypeId,
        housekeepingStatus: 'Clean',
        isOperational: true
      });

      if (!allocatedRoom) {
        return res.status(409).json({
          success: false,
          message: 'No Clean room currently available for check-in. Housekeeping required.',
          errorCode: 'NO_CLEAN_ROOM_AVAILABLE'
        });
      }
    }

    booking.roomAllocated = allocatedRoom._id;
    booking.actualCheckIn = new Date();
    booking.checkInRemarks = remarks || 'Checked in by authorized front desk staff';
    booking.status = 'Checked-in';

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        actualCheckIn: booking.actualCheckIn,
        allocatedRoom: {
          _id: allocatedRoom._id,
          roomNumber: allocatedRoom.roomNumber,
          floor: allocatedRoom.floor
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Staff Check-out action (Module 8 & Module 9)
// @route   PUT /api/bookings/:id/checkout
// @access  Private (Staff, Admin)
const checkOutBooking = async (req, res, next) => {
  try {
    const { remarks } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
        errorCode: 'BOOKING_NOT_FOUND'
      });
    }

    if (booking.status !== 'Checked-in') {
      return res.status(400).json({
        success: false,
        message: `Cannot check out booking with status '${booking.status}'. Only 'Checked-in' guests can be checked out.`,
        errorCode: 'INVALID_STATUS_TRANSITION'
      });
    }

    booking.actualCheckOut = new Date();
    booking.checkOutRemarks = remarks || 'Guest checked out. Departure confirmed.';
    booking.status = 'Checked-out';

    await booking.save();

    // Trigger housekeeping workflow: Room status automatically transitions to 'Dirty' (Module 9 integration)
    if (booking.roomAllocated) {
      await Room.findByIdAndUpdate(booking.roomAllocated, {
        housekeepingStatus: 'Dirty',
        housekeepingNotes: `Room vacated on checkout (${booking.bookingReference}). Cleaning requested.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        actualCheckOut: booking.actualCheckOut,
        housekeepingTriggered: 'Room marked Dirty for housekeeping'
      }
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  confirmBooking,
  checkInBooking,
  checkOutBooking
};

// @desc    Get booking history for a specific guest ID (Exact match for sample endpoint)
// @route   GET /api/guests/:id/bookings
// @access  Private (Guest owner, Staff, Admin)
const getGuestBookingsById = async (req, res, next) => {
  try {
    const guestId = req.params.id;

    if (req.user.role === 'guest' && req.user._id.toString() !== guestId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view another guest\'s booking history',
        errorCode: 'FORBIDDEN'
      });
    }

    const bookings = await Booking.find({ guestId })
      .populate('hotelId', 'name city address rating')
      .populate('roomTypeId', 'name basePrice capacity bedType')
      .populate('roomAllocated', 'roomNumber floor housekeepingStatus')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

module.exports.getGuestBookingsById = getGuestBookingsById;
