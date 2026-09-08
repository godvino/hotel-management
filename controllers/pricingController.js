const PricingRule = require('../models/PricingRule');
const RoomType = require('../models/RoomType');
const { calculateDynamicPricing } = require('../utils/pricingEngine');

// @desc    Get all pricing rules
// @route   GET /api/pricing-rules
// @access  Private (Staff, Admin)
const getPricingRules = async (req, res, next) => {
  try {
    const { roomTypeId, hotelId } = req.query;
    const query = {};
    if (roomTypeId) query.roomTypeId = roomTypeId;
    if (hotelId) query.hotelId = hotelId;

    const rules = await PricingRule.find(query)
      .populate('roomTypeId', 'name basePrice')
      .populate('hotelId', 'name city')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: rules.length,
      data: rules
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new pricing rule (seasonal / weekend)
// @route   POST /api/pricing-rules
// @access  Private (Admin only)
const createPricingRule = async (req, res, next) => {
  try {
    const { roomTypeId, hotelId, season, startDate, endDate, multiplier, isWeekendSurge, weekendMultiplier } = req.body;

    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: `Room type not found with id ${roomTypeId}`,
        errorCode: 'ROOM_TYPE_NOT_FOUND'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'endDate must be after startDate',
        errorCode: 'INVALID_DATE_RANGE'
      });
    }

    const rule = await PricingRule.create({
      roomTypeId,
      hotelId: hotelId || roomType.hotelId,
      season,
      startDate: start,
      endDate: end,
      multiplier: Number(multiplier) || 1.0,
      isWeekendSurge: isWeekendSurge !== undefined ? isWeekendSurge : true,
      weekendMultiplier: weekendMultiplier !== undefined ? Number(weekendMultiplier) : 1.2
    });

    res.status(201).json({
      success: true,
      message: 'Dynamic pricing rule created successfully',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dynamic pricing quote preview
// @route   GET /api/pricing-rules/quote
// @access  Public
const getPriceQuote = async (req, res, next) => {
  try {
    const { roomTypeId, checkIn, checkOut } = req.query;

    if (!roomTypeId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'roomTypeId, checkIn, and checkOut are required',
        errorCode: 'VALIDATION_ERROR'
      });
    }

    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: `Room type not found with id ${roomTypeId}`,
        errorCode: 'ROOM_TYPE_NOT_FOUND'
      });
    }

    const quote = await calculateDynamicPricing(roomType, new Date(checkIn), new Date(checkOut));

    res.status(200).json({
      success: true,
      data: {
        roomType: {
          _id: roomType._id,
          name: roomType.name,
          basePrice: roomType.basePrice
        },
        quote
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a pricing rule
// @route   PUT /api/pricing-rules/:id
// @access  Private (Admin only)
const updatePricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: `Pricing rule not found with id ${req.params.id}`,
        errorCode: 'RULE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pricing rule updated successfully',
      data: rule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete pricing rule
// @route   DELETE /api/pricing-rules/:id
// @access  Private (Admin only)
const deletePricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: `Pricing rule not found with id ${req.params.id}`,
        errorCode: 'RULE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pricing rule deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPricingRules,
  createPricingRule,
  getPriceQuote,
  updatePricingRule,
  deletePricingRule
};
