const Hotel = require('../models/Hotel');
const RoomType = require('../models/RoomType');

// @desc    Get all hotels (with optional city/search filter)
// @route   GET /api/hotels
// @access  Public
const getHotels = async (req, res, next) => {
  try {
    const { city, search, minRating } = req.query;
    const query = { isActive: true };

    if (city) {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    if (search) {
      query.name = { $regex: new RegExp(search, 'i') };
    }

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    const hotels = await Hotel.find(query).sort({ rating: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hotel by ID (including room types)
// @route   GET /api/hotels/:id
// @access  Public
const getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `Hotel not found with id ${req.params.id}`,
        errorCode: 'HOTEL_NOT_FOUND'
      });
    }

    const roomTypes = await RoomType.find({ hotelId: hotel._id });

    res.status(200).json({
      success: true,
      data: {
        ...hotel.toObject(),
        roomTypes
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new hotel
// @route   POST /api/hotels
// @access  Private (Admin only)
const createHotel = async (req, res, next) => {
  try {
    const { name, city, address, amenities, rating, contactEmail, contactPhone, images } = req.body;

    const hotel = await Hotel.create({
      name,
      city,
      address,
      amenities: amenities || ['WiFi', 'Air Conditioning', '24/7 Front Desk'],
      rating: rating !== undefined ? rating : 4.5,
      contactEmail,
      contactPhone,
      images: images || []
    });

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: hotel
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hotel details
// @route   PUT /api/hotels/:id
// @access  Private (Admin only)
const updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `Hotel not found with id ${req.params.id}`,
        errorCode: 'HOTEL_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hotel updated successfully',
      data: hotel
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hotel (or deactivate)
// @route   DELETE /api/hotels/:id
// @access  Private (Admin only)
const deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `Hotel not found with id ${req.params.id}`,
        errorCode: 'HOTEL_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hotel deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel
};
