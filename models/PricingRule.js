const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema(
  {
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'RoomType reference is required']
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel reference is required']
    },
    season: {
      type: String,
      required: [true, 'Season name is required (e.g. Summer Peak, Holiday Surge, Monsoon Saver)'],
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    multiplier: {
      type: Number,
      required: [true, 'Price multiplier is required (e.g. 1.25 for 25% increase)'],
      min: [0.1, 'Multiplier must be positive'],
      default: 1.0
    },
    isWeekendSurge: {
      type: Boolean,
      default: false
    },
    weekendMultiplier: {
      type: Number,
      default: 1.2
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

pricingRuleSchema.index({ roomTypeId: 1 });
pricingRuleSchema.index({ hotelId: 1 });
pricingRuleSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
