const User = require('../models/User');
const Hotel = require('../models/Hotel');
const RoomType = require('../models/RoomType');
const Room = require('../models/Room');
const PricingRule = require('../models/PricingRule');
const Booking = require('../models/Booking');

const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return; // Already populated
    }

    console.log('🌱 Empty database detected. Auto-seeding initial demonstration data...');

    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@hotel.com',
      passwordHash: 'Password123!',
      role: 'admin',
      phone: '+91-9876543210'
    });

    const staffUser = await User.create({
      name: 'Frontdesk Operations Staff',
      email: 'staff@hotel.com',
      passwordHash: 'Password123!',
      role: 'staff',
      phone: '+91-9876543211'
    });

    const guestUser = await User.create({
      name: 'Rahul Sharma (Guest)',
      email: 'guest@hotel.com',
      passwordHash: 'Password123!',
      role: 'guest',
      phone: '+91-9876543212'
    });

    const hotel1 = await Hotel.create({
      name: 'Grand Royal Palace & Convention',
      city: 'Bengaluru',
      address: '42 MG Road, Central Business District, Bengaluru, Karnataka 560001',
      amenities: ['High-speed WiFi', 'Infinity Swimming Pool', 'Spa & Wellness', '24/7 Room Service', 'Valet Parking', 'Business Center'],
      rating: 4.8,
      contactEmail: 'reception.blr@grandroyal.com',
      contactPhone: '+91-80-22334455',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
      ]
    });

    const hotel2 = await Hotel.create({
      name: 'Azure Palms Beachfront Resort',
      city: 'Goa',
      address: 'Calangute Beach Road, North Goa 403516',
      amenities: ['Private Beach Access', 'Beachside Bar', 'Water Sports', 'Complimentary Breakfast', 'Swimming Pool'],
      rating: 4.6,
      contactEmail: 'stay@azurepalmsgoa.com',
      contactPhone: '+91-832-2277889',
      images: [
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'
      ]
    });

    const deluxeBLR = await RoomType.create({
      hotelId: hotel1._id,
      name: 'Executive Deluxe Suite',
      basePrice: 4500,
      totalRooms: 10,
      capacity: 2,
      bedType: '1 King Bed',
      amenities: ['City Skyline View', 'Workstation Desk', 'Espresso Machine', 'Marble Bath'],
      description: 'Spacious 450 sq.ft suite with panoramic view of Bengaluru skyline.'
    });

    const presidentialBLR = await RoomType.create({
      hotelId: hotel1._id,
      name: 'Presidential Royal Suite',
      basePrice: 12000,
      totalRooms: 3,
      capacity: 4,
      bedType: '2 King Beds',
      amenities: ['Private Jacuzzi', 'Butler Service', 'Living Dining Lounge', 'Panoramic Balcony'],
      description: 'Ultra-luxury suite designed for VIP guests.'
    });

    const oceanViewGoa = await RoomType.create({
      hotelId: hotel2._id,
      name: 'Ocean View Beach Villa',
      basePrice: 6500,
      totalRooms: 8,
      capacity: 3,
      bedType: '1 King Bed + 1 Day Bed',
      amenities: ['Direct Sea View', 'Private Patio', 'Hammock', 'Sunset Deck'],
      description: 'Wake up to the sound of waves in this serene beachfront villa.'
    });

    const room101 = await Room.create({
      hotelId: hotel1._id,
      roomTypeId: deluxeBLR._id,
      roomNumber: '101',
      floor: 1,
      housekeepingStatus: 'Clean'
    });
    const room102 = await Room.create({
      hotelId: hotel1._id,
      roomTypeId: deluxeBLR._id,
      roomNumber: '102',
      floor: 1,
      housekeepingStatus: 'Clean'
    });
    const room103 = await Room.create({
      hotelId: hotel1._id,
      roomTypeId: deluxeBLR._id,
      roomNumber: '103',
      floor: 1,
      housekeepingStatus: 'Dirty',
      housekeepingNotes: 'Requires deep linen replacement'
    });
    const room104 = await Room.create({
      hotelId: hotel1._id,
      roomTypeId: deluxeBLR._id,
      roomNumber: '104',
      floor: 1,
      housekeepingStatus: 'Under Maintenance',
      housekeepingNotes: 'AC compressor service in progress'
    });

    await Room.create({
      hotelId: hotel2._id,
      roomTypeId: oceanViewGoa._id,
      roomNumber: 'V-01',
      floor: 1,
      housekeepingStatus: 'Clean'
    });

    await PricingRule.create({
      roomTypeId: deluxeBLR._id,
      hotelId: hotel1._id,
      season: 'Autumn Festive Surge',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-10-31'),
      multiplier: 1.25,
      isWeekendSurge: true,
      weekendMultiplier: 1.2
    });

    await Booking.create({
      bookingReference: 'BK-DEMO101',
      guestId: guestUser._id,
      hotelId: hotel1._id,
      roomTypeId: deluxeBLR._id,
      roomAllocated: room101._id,
      checkIn: new Date('2026-09-08'),
      checkOut: new Date('2026-09-11'),
      guestsCount: 2,
      status: 'Checked-in',
      actualCheckIn: new Date('2026-09-08T14:00:00Z'),
      pricingBreakdown: {
        basePrice: 4500,
        nightsCount: 3,
        nightlyRates: [
          { date: '2026-09-08', rate: 5625, seasonName: 'Autumn Festive Surge', multiplierApplied: 1.25, isWeekend: false },
          { date: '2026-09-09', rate: 5625, seasonName: 'Autumn Festive Surge', multiplierApplied: 1.25, isWeekend: false },
          { date: '2026-09-10', rate: 5625, seasonName: 'Autumn Festive Surge', multiplierApplied: 1.25, isWeekend: false }
        ],
        roomSubtotal: 16875,
        taxes: { ratePercentage: 12, taxAmount: 2025 },
        serviceCharges: 0,
        totalAmount: 18900
      },
      checkInRemarks: 'Guest checked in at front desk'
    });

    console.log('✅ Demonstration data auto-seeded successfully!');
  } catch (err) {
    console.error('Auto-seed warning:', err.message);
  }
};

module.exports = { autoSeedIfEmpty };
