const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide hotel name'],
      trim: true,
      maxlength: [100, 'Hotel name cannot exceed 100 characters']
    },
    city: {
      type: String,
      required: [true, 'Please provide hotel city'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Please provide hotel address'],
      trim: true
    },
    amenities: {
      type: [String],
      default: ['WiFi', 'Air Conditioning', '24/7 Front Desk']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: 4.5
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    contactPhone: {
      type: String,
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes recommended in specification
hotelSchema.index({ name: 1 });
hotelSchema.index({ city: 1 });

module.exports = mongoose.model('Hotel', hotelSchema);
