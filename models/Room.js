const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'RoomType ID reference is required']
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel ID reference is required']
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true
    },
    floor: {
      type: Number,
      default: 1
    },
    housekeepingStatus: {
      type: String,
      enum: {
        values: ['Clean', 'Dirty', 'Under Maintenance'],
        message: '{VALUE} is not a valid housekeeping status'
      },
      default: 'Clean'
    },
    lastCleanedAt: {
      type: Date,
      default: Date.now
    },
    housekeepingNotes: {
      type: String,
      default: ''
    },
    isOperational: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
roomSchema.index({ roomTypeId: 1 });
roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ housekeepingStatus: 1 });

module.exports = mongoose.model('Room', roomSchema);
