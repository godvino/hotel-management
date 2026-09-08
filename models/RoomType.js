const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel ID reference is required']
    },
    name: {
      type: String,
      required: [true, 'Room type name is required (e.g. Deluxe, Executive Suite)'],
      trim: true
    },
    basePrice: {
      type: Number,
      required: [true, 'Base nightly price is required'],
      min: [0, 'Base price cannot be negative']
    },
    totalRooms: {
      type: Number,
      required: [true, 'Total rooms count is required'],
      min: [1, 'Must have at least 1 room']
    },
    capacity: {
      type: Number,
      required: [true, 'Guest capacity is required'],
      min: [1, 'Capacity must be at least 1 guest'],
      default: 2
    },
    bedType: {
      type: String,
      default: 'King Bed'
    },
    amenities: {
      type: [String],
      default: ['WiFi', 'Smart TV', 'Mini Bar', 'En-suite Bathroom']
    },
    description: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes recommended in specification
roomTypeSchema.index({ hotelId: 1 });
roomTypeSchema.index({ hotelId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('RoomType', roomTypeSchema);
