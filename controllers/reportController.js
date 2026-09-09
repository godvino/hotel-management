const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const RoomType = require('../models/RoomType');
const Room = require('../models/Room');

// @desc    Get Occupancy and Revenue Reports per property & overall (Module 13)
// @route   GET /api/admin/reports/occupancy
// @access  Private (Admin only)
const getOccupancyReport = async (req, res, next) => {
  try {
    const { hotelId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const matchFilter = {
      checkIn: { $lt: end },
      checkOut: { $gt: start }
    };

    if (hotelId) {
      matchFilter.hotelId = new mongoose.Types.ObjectId(hotelId);
    }

    // Aggregate booking stats
    const bookingStats = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $ne: ['$status', 'Cancelled'] },
                '$pricingBreakdown.totalAmount',
                '$cancellation.penaltyAmount'
              ]
            }
          },
          totalNights: {
            $sum: {
              $cond: [
                { $ne: ['$status', 'Cancelled'] },
                '$pricingBreakdown.nightsCount',
                0
              ]
            }
          }
        }
      }
    ]);

    // Breakdown per Hotel Property
    const hotelBreakdown = await Booking.aggregate([
      {
        $match: {
          ...matchFilter,
          status: { $in: ['Confirmed', 'Checked-in', 'Checked-out'] }
        }
      },
      {
        $group: {
          _id: '$hotelId',
          bookingsCount: { $sum: 1 },
          totalRevenue: { $sum: '$pricingBreakdown.totalAmount' },
          totalNightsBooked: { $sum: '$pricingBreakdown.nightsCount' }
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: '_id',
          foreignField: '_id',
          as: 'hotel'
        }
      },
      { $unwind: '$hotel' },
      {
        $project: {
          hotelId: '$_id',
          hotelName: '$hotel.name',
          city: '$hotel.city',
          bookingsCount: 1,
          totalRevenue: 1,
          totalNightsBooked: 1
        }
      }
    ]);

    // Inventory counts
    const hotelMatch = hotelId ? { _id: new mongoose.Types.ObjectId(hotelId) } : {};
    const totalHotels = await Hotel.countDocuments(hotelMatch);
    
    const roomTypeMatch = hotelId ? { hotelId: new mongoose.Types.ObjectId(hotelId) } : {};
    const roomTypes = await RoomType.find(roomTypeMatch);
    const totalConfiguredRooms = roomTypes.reduce((acc, rt) => acc + rt.totalRooms, 0);

    // Active occupancy count right now
    const now = new Date();
    const activeOccupiedRooms = await Booking.countDocuments({
      status: 'Checked-in',
      ...(hotelId ? { hotelId } : {})
    });

    const totalConfirmedBookings = await Booking.countDocuments({
      status: { $in: ['Confirmed', 'Checked-in', 'Checked-out'] },
      ...(hotelId ? { hotelId } : {})
    });

    const totalCancelledBookings = await Booking.countDocuments({
      status: 'Cancelled',
      ...(hotelId ? { hotelId } : {})
    });

    // Compute gross revenue
    let totalGrossRevenue = 0;
    bookingStats.forEach((stat) => {
      totalGrossRevenue += stat.totalRevenue;
    });

    const occupancyRatePercentage = totalConfiguredRooms > 0
      ? Number(((activeOccupiedRooms / totalConfiguredRooms) * 100).toFixed(1))
      : 0;

    // Average Daily Rate (ADR) = Total Revenue / Total Nights Sold
    const totalNightsSold = bookingStats.reduce((acc, curr) => acc + curr.totalNights, 0);
    const averageDailyRate = totalNightsSold > 0 ? Math.round(totalGrossRevenue / totalNightsSold) : 0;

    // RevPAR = Total Room Revenue / Total Available Rooms
    const revPAR = totalConfiguredRooms > 0 ? Math.round(totalGrossRevenue / totalConfiguredRooms) : 0;

    res.status(200).json({
      success: true,
      reportPeriod: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      },
      summary: {
        totalHotels,
        totalInventoryRooms: totalConfiguredRooms,
        currentOccupiedRooms: activeOccupiedRooms,
        occupancyRate: `${occupancyRatePercentage}%`,
        totalBookings: totalConfirmedBookings + totalCancelledBookings,
        confirmedBookings: totalConfirmedBookings,
        cancelledBookings: totalCancelledBookings,
        grossRevenue: totalGrossRevenue,
        averageDailyRate,
        revPAR
      },
      statusDistribution: bookingStats,
      propertyBreakdown: hotelBreakdown
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOccupancyReport
};
