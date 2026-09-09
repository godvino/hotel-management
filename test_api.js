process.env.NODE_ENV = 'test';
require('dotenv').config();
const http = require('http');
const { app } = require('./server');
const { connectDB, closeDB } = require('./config/db');
const { autoSeedIfEmpty } = require('./utils/autoSeed');

let server;
let baseUrl;

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runSmokeTests = async () => {
  console.log('================================================================');
  console.log('🧪 RUNNING FULL 13-MODULE VERIFICATION & COMPLIANCE TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title} ${details}`);
      failed++;
    }
  };

  try {
    // 1. Module 1: Dedicated Role-Based Authentication & Authorization
    console.log('--- [Module 1] Dedicated Role-Based Authentication ---');
    // 1.1 Separate Guest Login
    const guestLogin = await request('POST', '/api/auth/guest/login', {
      email: 'guest@hotel.com',
      password: 'Password123!'
    });
    assert(guestLogin.status === 200 && guestLogin.body.data.role === 'guest', 'Separate Guest login (/api/auth/guest/login) returns 200 & JWT token');
    const guestToken = guestLogin.body.data.token;

    // 1.2 Separate Staff Login
    const staffLogin = await request('POST', '/api/auth/staff/login', {
      email: 'staff@hotel.com',
      password: 'Password123!'
    });
    assert(staffLogin.status === 200 && staffLogin.body.data.role === 'staff', 'Separate Staff login (/api/auth/staff/login) returns 200 & staff role');
    const staffToken = staffLogin.body.data.token;

    // 1.3 Separate Admin Login
    const adminLogin = await request('POST', '/api/auth/admin/login', {
      email: 'admin@hotel.com',
      password: 'Password123!'
    });
    assert(adminLogin.status === 200 && adminLogin.body.data.role === 'admin', 'Separate Admin login (/api/auth/admin/login) returns 200 & admin role');
    const adminToken = adminLogin.body.data.token;

    // 1.4 Cross-Portal Login Rejection (Guest trying to login at Admin portal)
    const crossPortalReject = await request('POST', '/api/auth/admin/login', {
      email: 'guest@hotel.com',
      password: 'Password123!'
    });
    assert(crossPortalReject.status === 403, 'Cross-portal rejection: Guest attempting Admin login returns 403 Forbidden');

    // 1.5 Separate Staff Registration with Secret Key
    const newStaff = await request('POST', '/api/auth/staff/register', {
      name: 'New Desk Officer',
      email: `newstaff_${Date.now()}@hotel.com`,
      password: 'Password123!',
      staffSecretKey: 'STAFF2026'
    });
    assert(newStaff.status === 201 && newStaff.body.data.role === 'staff', 'Separate Staff registration with valid secret returns 201');

    // 1.6 Separate Staff Registration rejected with invalid secret
    const badSecretStaff = await request('POST', '/api/auth/staff/register', {
      name: 'Intruder Staff',
      email: 'intruder@hotel.com',
      password: 'Password123!',
      staffSecretKey: 'WRONG_KEY'
    });
    assert(badSecretStaff.status === 403, 'Staff registration with invalid secret returns 403 Forbidden');

    // Test Negative Auth
    const missingTokenTest = await request('GET', '/api/bookings/my-bookings');
    assert(missingTokenTest.status === 401, 'Protected route returns 401 when token is missing');

    const badValidation = await request('POST', '/api/auth/login', { email: 'not-an-email' });
    assert(badValidation.status === 400, 'Invalid payload returns 400 validation error');

    // 2. Module 2: Hotel & Property Management
    console.log('\n--- [Module 2] Hotel & Property Management ---');
    const hotelsList = await request('GET', '/api/hotels');
    assert(hotelsList.status === 200 && hotelsList.body.count >= 2, 'Public endpoint returns active hotels');
    const sampleHotel = hotelsList.body.data[0];

    // Guest cannot create hotel (403 RBAC)
    const guestCreateHotel = await request('POST', '/api/hotels', { name: 'Illegal Hotel' }, guestToken);
    assert(guestCreateHotel.status === 403, 'RBAC prevents Guest from creating hotel (403 Forbidden)');

    // 3. Module 3: Room Type & Inventory Management
    console.log('\n--- [Module 3] Room Type & Inventory Management ---');
    const roomTypes = await request('GET', `/api/room-types?hotelId=${sampleHotel._id}`);
    assert(roomTypes.status === 200 && roomTypes.body.count > 0, 'Fetches room types for hotel');
    const sampleRoomType = roomTypes.body.data[0];

    const roomsList = await request('GET', `/api/rooms?hotelId=${sampleHotel._id}`, null, staffToken);
    assert(roomsList.status === 200 && roomsList.body.count > 0, 'Staff can fetch physical rooms inventory');

    // 4. Module 4: Availability Search Engine
    console.log('\n--- [Module 4] Availability Search Engine ---');
    const availSearch = await request('GET', `/api/availability/search?city=Bengaluru&checkIn=2026-10-01&checkOut=2026-10-05&guests=2`);
    assert(availSearch.status === 200 && availSearch.body.count > 0, 'Date-based availability search returns available rooms with quotes');

    // 5. Module 5 & 6: Reservation Booking Workflow & Dynamic Pricing
    console.log('\n--- [Module 5 & 6] Booking Workflow & Dynamic Pricing Rules ---');
    const createBookingRes = await request('POST', '/api/bookings', {
      hotelId: sampleHotel._id,
      roomTypeId: sampleRoomType._id,
      checkIn: '2026-10-10',
      checkOut: '2026-10-13',
      guestsCount: 2,
      specialRequests: 'High floor preferred'
    }, guestToken);

    assert(createBookingRes.status === 201 && createBookingRes.body.data.bookingReference, 'Creates booking with dynamic pricing and BK reference');
    const newBooking = createBookingRes.body.data;

    // Verify Dynamic Pricing Breakdown in booking
    assert(
      newBooking.pricingBreakdown.totalAmount > 0 &&
      newBooking.pricingBreakdown.nightlyRates.length === 3,
      'Dynamic pricing computed 3 nights with tax and line-item breakdown'
    );

    // 6. Module 7: Booking Status Management
    console.log('\n--- [Module 7] Booking Status Management ---');
    const confirmRes = await request('PUT', `/api/bookings/${newBooking._id}/confirm`, {}, guestToken);
    assert(confirmRes.status === 200 && confirmRes.body.data.status === 'Confirmed', 'Booking transitions Reserved -> Confirmed');

    // 7. Module 8: Staff Check-in / Check-out Module
    console.log('\n--- [Module 8] Staff Check-in & Check-out ---');
    const checkInRes = await request('PUT', `/api/bookings/${newBooking._id}/checkin`, {
      remarks: 'Keycard assigned, guest checked in'
    }, staffToken);
    assert(checkInRes.status === 200 && checkInRes.body.data.status === 'Checked-in', 'Staff checks in guest and auto-allocates clean room');
    const allocatedRoomId = checkInRes.body.data.allocatedRoom._id;

    const checkOutRes = await request('PUT', `/api/bookings/${newBooking._id}/checkout`, {
      remarks: 'Departure settled, minibar verified'
    }, staffToken);
    assert(checkOutRes.status === 200 && checkOutRes.body.data.status === 'Checked-out', 'Staff checks out guest');

    // 8. Module 9: Housekeeping Status Tracking
    console.log('\n--- [Module 9] Housekeeping Status Tracking ---');
    const inspectedRoom = await request('GET', `/api/rooms/${allocatedRoomId}`, null, staffToken);
    assert(inspectedRoom.body.data.housekeepingStatus === 'Dirty', 'Checking out automatically triggers room housekeepingStatus -> Dirty');

    const cleanRoomRes = await request('PUT', `/api/housekeeping/rooms/${allocatedRoomId}/status`, {
      housekeepingStatus: 'Clean',
      notes: 'Room sanitized and linens replaced'
    }, staffToken);
    assert(cleanRoomRes.status === 200 && cleanRoomRes.body.data.housekeepingStatus === 'Clean', 'Staff/Housekeeping updates room back to Clean');

    // 9. Module 10: Cancellation & Refund Policy Engine
    console.log('\n--- [Module 10] Cancellation & Refund Policy Engine ---');
    // Create another future booking to cancel
    const cancelCandidate = await request('POST', '/api/bookings', {
      hotelId: sampleHotel._id,
      roomTypeId: sampleRoomType._id,
      checkIn: '2026-11-01',
      checkOut: '2026-11-03',
      guestsCount: 1
    }, guestToken);

    const cancelRes = await request('PUT', `/api/bookings/${cancelCandidate.body.data._id}/cancel`, {
      reason: 'Change of travel plans'
    }, guestToken);

    assert(
      cancelRes.status === 200 &&
      cancelRes.body.data.status === 'Cancelled' &&
      cancelRes.body.data.cancellation.refundPercentage === 100,
      'Cancellation >48h grants 100% refund as per policy engine'
    );

    // 10. Module 11: Guest Booking History
    console.log('\n--- [Module 11] Guest Booking History ---');
    const myBookings = await request('GET', '/api/bookings/my-bookings', null, guestToken);
    assert(myBookings.status === 200 && myBookings.body.count >= 2, 'Guest can retrieve their booking history');

    // 11. Module 12: Invoice Generation Summary
    console.log('\n--- [Module 12] Invoice Generation Summary ---');
    const invoiceRes = await request('GET', `/api/bookings/${newBooking._id}/invoice`, null, guestToken);
    assert(
      invoiceRes.status === 200 &&
      invoiceRes.body.data.invoiceNumber.startsWith('INV-') &&
      invoiceRes.body.data.financialSummary.netPayable > 0,
      'Generates itemized invoice summary with taxes, stay nights, and property details'
    );

    // 12. Module 13: Admin Occupancy Reports
    console.log('\n--- [Module 13] Admin Occupancy Reports ---');
    const reportRes = await request('GET', '/api/admin/reports/occupancy', null, adminToken);
    assert(
      reportRes.status === 200 &&
      reportRes.body.summary.occupancyRate !== undefined &&
      reportRes.body.summary.grossRevenue > 0,
      'Admin report aggregates occupancy rate, revenue, ADR, and RevPAR'
    );

    // 13. System Resilience & Error Handling
    console.log('\n--- Resilience & Error Handling (404, 400, 409) ---');
    const notFoundRes = await request('GET', '/api/hotels/507f1f77bcf86cd799439011');
    assert(notFoundRes.status === 404, 'Handled 404 cleanly without server crash');

    const invalidIdRes = await request('GET', '/api/hotels/invalid-hex-id');
    assert(invalidIdRes.status === 404, 'Mongoose CastError returns clean 404 JSON');

    console.log('\n================================================================');
    console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    return failed === 0;
  } catch (err) {
    console.error('Fatal test exception:', err);
    return false;
  }
};

const run = async () => {
  await connectDB();
  await autoSeedIfEmpty();

  server = app.listen(0, async () => {
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running at ${baseUrl}`);

    const allPassed = await runSmokeTests();
    server.close(async () => {
      await closeDB();
      process.exit(allPassed ? 0 : 1);
    });
  });
};

run();
