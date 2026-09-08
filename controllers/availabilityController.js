const RoomType = require('../models/RoomType');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const { calculateDynamicPricing } = require('../utils/pricingEngine');
const { getOverlapQuery } = require('../utils/dateUtils');

// @desc    Search available rooms by hotel/city, date range, and occupancy
// @route   GET /api/availability/search
// @access  Public
const searchAvailability = async (req, res, next) => {
  try {
    const { hotelId, city, checkIn, checkOut, guests } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Both checkIn and checkOut dates are required in YYYY-MM-DD format',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO / YYYY-MM-DD',
        errorCode: 'INVALID_DATE'
      });
    }

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'checkOut date must be strictly after checkIn date',
        errorCode: 'INVALID_DATE_RANGE'
      });
    }

    // Filter hotels if city or hotelId specified
    const hotelQuery = { isActive: true };
    if (hotelId) hotelQuery._id = hotelId;
    if (city) hotelQuery.city = { $regex: new RegExp(city, 'i') };

    const matchingHotels = await Hotel.find(hotelQuery);
    const hotelIds = matchingHotels.map((h) => h._id);

    if (hotelIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Filter room types
    const roomTypeQuery = { hotelId: { $in: hotelIds } };
    const guestCount = guests ? Number(guests) : 1;
    if (guestCount > 1) {
      roomTypeQuery.capacity = { $gte: guestCount };
    }

    const roomTypes = await RoomType.find(roomTypeQuery).populate('hotelId', 'name city address rating');

    const availableResults = [];

    for (const rt of roomTypes) {
      // Find overlapping bookings for this roomType
      const overlapFilter = {
        roomTypeId: rt._id,
        ...getOverlapQuery(checkInDate, checkOutDate)
      };

      const bookedCount = await Booking.countDocuments(overlapFilter);
      const availableRoomsCount = rt.totalRooms - bookedCount;

      if (availableRoomsCount > 0) {
        // Calculate dynamic pricing quote for this room type
        const pricingQuote = await calculateDynamicPricing(rt, checkInDate, checkOutDate);

        availableResults.push({
          roomType: rt,
          hotel: rt.hotelId,
          totalInventory: rt.totalRooms,
          bookedInventory: bookedCount,
          availableRooms: availableRoomsCount,
          stayNights: pricingQuote.nightsCount,
          pricingQuote
        });
      }
    }

    res.status(200).json({
      success: true,
      count: availableResults.length,
      data: availableResults
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchAvailability
};
