# Hotel Room Booking & Reservation Platform
> A production-grade multi-property hotel reservation and hospitality operations platform built with Node.js, Express.js, and MongoDB.

---

## 1. Overview & Problem Statement

Modern hotel chains operating across multiple properties require a reliable, high-concurrency reservation backend to synchronize bookings, room inventory, dynamic seasonal pricing, frontdesk arrivals/departures, and housekeeping maintenance in real time.

This platform provides an end-to-end backend and interactive management console with:
* **Double-booking prevention** via atomic date-range overlap queries.
* **Dynamic pricing rules** adjusting rates based on seasons, festivals, and weekend surges.
* **Multi-property inventory tracking** with granular housekeeping statuses (`Clean`, `Dirty`, `Under Maintenance`).
* **Strict Role-Based Access Control (RBAC)** across three distinct actors: `Guest`, `Hotel Staff`, and `Admin`.
* **Centralized error handling and schema validation** ensuring zero unhandled crashes and strict REST API compliance.

---

## 2. Technology Stack & Architecture

* **Runtime:** Node.js (v18+ / v20+ / v22+)
* **Backend Framework:** Express.js (MVC architecture)
* **Database & ODM:** MongoDB with Mongoose ODM (supports MongoDB Cloud Atlas)
* **Authentication:** JSON Web Tokens (JWT) & `bcryptjs` password hashing
* **Request Validation:** `express-validator` middleware
* **Testing & Documentation:** Postman Collection v2.1.0 & Node.js Automated Smoke Test Suite
* **Interactive Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, FontAwesome
* **Containerization:** Production Dockerfile (`node:20-alpine`) & GitHub Actions GHCR pipeline

```
project-root/
├── config/
│   └── db.js                 # MongoDB Cloud connection via Mongoose
├── controllers/
│   ├── authController.js     # Dedicated Guest/Staff/Admin Auth & JWT
│   ├── hotelController.js    # Multi-property CRUD
│   ├── roomTypeController.js # Room category inventory
│   ├── roomController.js     # Physical room inventory
│   ├── availabilityController.js # Date-based search engine
│   ├── bookingController.js  # Reservation lifecycle & Invoicing
│   ├── pricingController.js  # Dynamic surge rules
│   ├── housekeepingController.js # Room cleanliness tracker
│   └── reportController.js   # Admin occupancy & revenue analytics
├── middleware/
│   ├── auth.js               # JWT verification & RBAC authorization
│   ├── validate.js           # Request validation error handler
│   └── errorHandler.js       # Centralized 4xx/5xx JSON error handler
├── models/
│   ├── User.js               # Guest, Staff, Admin schema
│   ├── Hotel.js              # Property schema with city indexes
│   ├── RoomType.js           # Category schema (capacity, basePrice, totalRooms)
│   ├── Room.js               # Physical unit schema (roomNumber, housekeepingStatus)
│   ├── PricingRule.js        # Seasonal & weekend price multiplier schema
│   └── Booking.js            # Reservation lifecycle & itemized invoice schema
├── public/                   # Interactive web frontend
│   ├── css/style.css
│   ├── js/app.js
│   └── index.html
├── routes/                   # Express REST endpoints
├── utils/
│   ├── autoSeed.js           # Demo data populator
│   ├── dateUtils.js          # Date overlap & stay night utilities
│   └── pricingEngine.js      # Dynamic price & tax calculation engine
├── .dockerignore
├── .env.example              # Sample environment variables
├── Dockerfile                # Production Alpine container
├── package.json
├── postman_collection.json   # Exported Postman suite
├── seed.js                   # Standalone database seeder
├── server.js                 # Express application entry point
└── test_api.js               # Automated test runner
```

---

## 3. Core Capabilities & Feature Overview

| Capability | Actor | Description | Implemented Endpoints |
| :--- | :---: | :--- | :--- |
| **Dedicated Role Authentication** | Guest, Staff, Admin | Strict role separation: dedicated login/registration portals for Guest, Staff, and Admin. Cross-portal logins are blocked (403). Admin and Staff registration protected with secret authorization keys. | `POST /api/auth/guest/register`<br>`POST /api/auth/guest/login`<br>`POST /api/auth/staff/register`<br>`POST /api/auth/staff/login`<br>`POST /api/auth/admin/register`<br>`POST /api/auth/admin/login`<br>`GET /api/auth/me` |
| **Hotel & Property Management** | Admin, Public | Admin management of multi-chain properties, cities, addresses, amenities, and ratings. | `GET /api/hotels`<br>`GET /api/hotels/:id`<br>`POST /api/hotels`<br>`PUT /api/hotels/:id`<br>`DELETE /api/hotels/:id` |
| **Room Type & Inventory Management** | Admin, Staff | Configure room categories (Deluxe, Suite), capacity, base pricing, and physical room numbers. | `GET /api/room-types`<br>`POST /api/room-types`<br>`GET /api/rooms`<br>`POST /api/rooms` |
| **Availability Search Engine** | Public / Guest | Real-time search across date ranges and guests count; automatically excludes booked/dirty rooms. | `GET /api/availability/search`<br>`GET /api/hotels/search` |
| **Reservation Booking Workflow** | Guest | Create booking with date-range conflict validation to prevent double-booking. Generates unique reference code. | `POST /api/bookings` |
| **Dynamic Pricing Rules** | Admin | Seasonal and weekend surge multipliers applied to room categories dynamically during quotes. | `POST /api/pricing-rules`<br>`GET /api/pricing-rules`<br>`GET /api/pricing-rules/quote` |
| **Booking Status Management** | System / Staff | Strict state machine lifecycle: `Reserved` → `Confirmed` → `Checked-in` → `Checked-out` (or `Cancelled`). | `PUT /api/bookings/:id/confirm` |
| **Check-in / Check-out Module** | Hotel Staff | Staff endpoints recording arrival/departure timestamps, allocating clean rooms, and verifying IDs. | `PUT /api/bookings/:id/checkin`<br>`PUT /api/bookings/:id/checkout` |
| **Housekeeping Status Tracking** | Hotel Staff | Rooms tracked as `Clean`, `Dirty`, or `Under Maintenance`. Checkout automatically flags room as `Dirty`. | `GET /api/housekeeping/rooms`<br>`GET /api/housekeeping/summary`<br>`PUT /api/housekeeping/rooms/:id/status` |
| **Cancellation & Refund Policy Engine** | Guest, Staff | Policy engine calculating refund based on notice (>48h: 100%, 24-48h: 50%, <24h: 0%). Releases room back to inventory. | `PUT /api/bookings/:id/cancel` |
| **Guest Booking History** | Guest | Authenticated guests view their past, active, and upcoming reservations with status filters. | `GET /api/bookings/my-bookings`<br>`GET /api/guests/:id/bookings`<br>`GET /api/bookings/:id` |
| **Invoice Generation Summary** | Guest, Staff | Computes itemized bill: nightly rates with surge breakdown, 12% GST tax, refunds, and net payable. | `GET /api/bookings/:id/invoice` |
| **Admin Occupancy Reports** | Admin | Calculates occupancy rate %, gross revenue, Average Daily Rate (ADR), and RevPAR per hotel property. | `GET /api/admin/reports/occupancy` |

---

## 4. Database Schema & ER Design

### Schema Relationships
* `User` **(1) ── (M)** `Booking` (Referenced via `guestId`)
* `Hotel` **(1) ── (M)** `RoomType` (Referenced via `hotelId`)
* `Hotel` **(1) ── (M)** `Room` (Referenced via `hotelId`)
* `RoomType` **(1) ── (M)** `Room` (Referenced via `roomTypeId`)
* `RoomType` **(1) ── (M)** `PricingRule` (Referenced via `roomTypeId`)
* `Booking` **(M) ── (1)** `Room` (Referenced via `roomAllocated`)

### Indexes Configured for Performance
* `users`: `{ email: 1 }` (Unique constraint)
* `hotels`: `{ name: 1 }`, `{ city: 1 }` (Search and dashboard queries)
* `roomTypes`: `{ hotelId: 1 }` (Relational filtering)
* `rooms`: `{ roomTypeId: 1 }`, `{ hotelId: 1, roomNumber: 1 }` (Unique room per hotel)
* `bookings`: `{ guestId: 1 }`, `{ hotelId: 1 }`, `{ checkIn: 1, checkOut: 1 }`, `{ bookingReference: 1 }`

---

## 5. Quick Setup & Installation Guide

### Prerequisites
* Node.js v18.0.0 or higher
* npm v9.0.0 or higher
* MongoDB Atlas Cloud database cluster connection string (free M0 shared cluster) or local MongoDB.

### Step 1: Clone Repository
```bash
git clone <your-repository-url>
cd hotel-booking-platform
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Setup
Copy the `.env.example` template:
```bash
cp .env.example .env
```

Configure your `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/hotel_booking?retryWrites=true&w=majority
JWT_SECRET=hotel_jwt_secret_super_secure_key_2026
JWT_EXPIRES_IN=7d
ADMIN_SECRET_KEY=ADMIN2026
STAFF_SECRET_KEY=STAFF2026
```

### Step 4: Seed Database (Optional)
Seed initial demonstration properties, room inventory, surge rules, and demo accounts:
```bash
npm run seed
```

Default demo accounts:
* **Admin:** `admin@hotel.com` / `Password123!`
* **Staff:** `staff@hotel.com` / `Password123!`
* **Guest:** `guest@hotel.com` / `Password123!`

### Step 5: Start Server & Web UI
```bash
npm start
```
* **API Root:** `http://localhost:5000/api`
* **Interactive Web Console:** `http://localhost:5000`
* **Postman JSON Spec:** `http://localhost:5000/postman_collection.json`

### Step 6: Run Automated Smoke Tests
```bash
npm test
```

---

## 6. REST API Endpoint Reference

### Dedicated Role Authentication (`/api/auth`)
* **Guest Portal:**
  * `POST /api/auth/guest/register` — Register a new Guest account.
  * `POST /api/auth/guest/login` — Login via Guest portal (strictly checks `role === 'guest'`).
* **Staff Portal:**
  * `POST /api/auth/staff/register` — Register a Hotel Staff account (requires `staffSecretKey: "STAFF2026"`).
  * `POST /api/auth/staff/login` — Login via Staff portal (strictly checks `role === 'staff'`).
* **Admin Portal:**
  * `POST /api/auth/admin/register` — Register an Administrator account (requires `adminSecretKey: "ADMIN2026"`).
  * `POST /api/auth/admin/login` — Login via Admin portal (strictly checks `role === 'admin'`).
* **General / Profile:**
  * `GET /api/auth/me` — Retrieve current authenticated user profile `[Protected]`.

### Hotels (`/api/hotels`)
* `GET /api/hotels` — List active hotels with city & search filtering.
* `GET /api/hotels/:id` — Get detailed hotel record with room types.
* `POST /api/hotels` — Add new hotel `[Admin]`.
* `PUT /api/hotels/:id` — Update hotel details `[Admin]`.
* `DELETE /api/hotels/:id` — Remove hotel property `[Admin]`.

### Room Types & Inventory (`/api/room-types`, `/api/rooms`)
* `GET /api/room-types?hotelId=...` — List room categories.
* `POST /api/room-types` — Define new room category and base pricing `[Admin]`.
* `GET /api/rooms` — View physical room units and housekeeping status `[Staff, Admin]`.
* `POST /api/rooms` — Create physical room unit `[Staff, Admin]`.

### Availability Search Engine (`/api/availability`, `/api/hotels/search`)
* `GET /api/availability/search?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=2` — Search room inventory across dates with dynamic pricing quotes.
* `GET /api/hotels/search?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=2` — Alias for hotel availability search.

### Bookings & Lifecycle (`/api/bookings`, `/api/guests`)
* `POST /api/bookings` — Create reservation with overlap conflict validation `[Guest, Staff, Admin]`.
* `GET /api/bookings/my-bookings` — Guest booking history `[Guest]`.
* `GET /api/guests/:id/bookings` — Guest booking history by guest ID `[Protected]`.
* `GET /api/bookings` — All reservations across properties `[Staff, Admin]`.
* `GET /api/bookings/:id` — View single reservation `[Protected]`.
* `PUT /api/bookings/:id/confirm` — Transition status to `Confirmed` `[Guest, Staff, Admin]`.
* `PUT /api/bookings/:id/checkin` — Check-in arrival & allocate clean room `[Staff, Admin]`.
* `PUT /api/bookings/:id/checkout` — Check-out departure & flag room `Dirty` `[Staff, Admin]`.
* `PUT /api/bookings/:id/cancel` — Cancel reservation with refund calculation `[Guest, Staff, Admin]`.
* `GET /api/bookings/:id/invoice` — Retrieve itemized invoice summary `[Guest, Staff, Admin]`.

### Dynamic Pricing Rules (`/api/pricing-rules`)
* `GET /api/pricing-rules` — List active surge rules `[Staff, Admin]`.
* `POST /api/pricing-rules` — Create seasonal or weekend multiplier `[Admin]`.
* `GET /api/pricing-rules/quote` — Preview price breakdown for stay dates `[Public]`.

### Housekeeping Operations (`/api/housekeeping`)
* `GET /api/housekeeping/rooms` — Inspect room cleanliness `[Staff, Admin]`.
* `GET /api/housekeeping/summary` — Metric count of Clean, Dirty, Maintenance rooms `[Staff, Admin]`.
* `PUT /api/housekeeping/rooms/:id/status` — Update cleanliness status `[Staff, Admin]`.

### Admin Analytics & Reports (`/api/admin/reports`)
* `GET /api/admin/reports/occupancy` — Occupancy rate %, Gross Revenue, ADR, RevPAR, and property breakdowns `[Admin]`.

---

## 7. Containerization & Deployment

### Build & Run Locally via Docker
```bash
docker build -t hotel-booking-platform .
docker run -d -p 5000:5000 -e MONGODB_URI="your_mongodb_uri" hotel-booking-platform
```

### GitHub Container Registry (GHCR)
The repository includes an automated GitHub Actions CI/CD workflow (`.github/workflows/docker-publish.yml`) that automatically builds and pushes the image to `ghcr.io` upon push to `main`.
