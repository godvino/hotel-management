const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      required: true
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Guest reference is required']
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel reference is required']
    },
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'RoomType reference is required']
    },
    roomAllocated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required']
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required']
    },
    guestsCount: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'At least 1 guest required'],
      default: 1
    },
    status: {
      type: String,
      enum: {
        values: ['Reserved', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'],
        message: '{VALUE} is not a valid booking status'
      },
      default: 'Reserved'
    },
    pricingBreakdown: {
      basePrice: { type: Number, required: true },
      nightsCount: { type: Number, required: true },
      nightlyRates: [
        {
          date: String,
          rate: Number,
          seasonName: String,
          multiplierApplied: Number,
          isWeekend: Boolean
        }
      ],
      roomSubtotal: { type: Number, required: true },
      taxes: {
        ratePercentage: { type: Number, default: 12 },
        taxAmount: { type: Number, default: 0 }
      },
      serviceCharges: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true }
    },
    actualCheckIn: {
      type: Date,
      default: null
    },
    actualCheckOut: {
      type: Date,
      default: null
    },
    checkInRemarks: {
      type: String,
      default: ''
    },
    checkOutRemarks: {
      type: String,
      default: ''
    },
    cancellation: {
      cancelledAt: { type: Date, default: null },
      reason: { type: String, default: '' },
      refundPercentage: { type: Number, default: 0 },
      refundAmount: { type: Number, default: 0 },
      penaltyAmount: { type: Number, default: 0 }
    },
    specialRequests: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes
bookingSchema.index({ guestId: 1 });
bookingSchema.index({ hotelId: 1 });
bookingSchema.index({ roomTypeId: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
