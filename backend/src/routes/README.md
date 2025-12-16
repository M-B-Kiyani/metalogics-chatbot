# API Routes

This directory contains the route definitions for the Backend API. Routes are organized by resource and include all necessary middleware for authentication, validation, and rate limiting.

## Route Files

### booking.routes.ts

Defines all booking-related endpoints:

- **POST /api/bookings** - Create a new booking
  - Middleware: Rate limiting, API key authentication, request body validation
  - Schema: `createBookingSchema`
- **GET /api/bookings** - List bookings with pagination and filtering
  - Middleware: Rate limiting, query parameter validation
  - Schema: `bookingFiltersSchema`
- **GET /api/bookings/:id** - Get a single booking by ID
  - Middleware: Rate limiting
- **PUT /api/bookings/:id** - Update booking details
  - Middleware: Rate limiting, API key authentication, request body validation
  - Schema: `updateBookingSchema`
- **PATCH /api/bookings/:id** - Update booking status
  - Middleware: Rate limiting, API key authentication, request body validation
  - Schema: `updateBookingStatusSchema`
- **DELETE /api/bookings/:id** - Cancel a booking
  - Middleware: Rate limiting, API key authentication

### health.routes.ts

Defines health check endpoints:

- **GET /api/health** - Check overall service health
  - Middleware: Rate limiting
  - Returns: Service status, uptime, version
- **GET /api/health/db** - Check database health
  - Middleware: Rate limiting
  - Returns: Database status, response time, connection pool stats

## Middleware Stack

All routes include the following middleware in order:

1. **Rate Limiting** (`rateLimiter`)

   - Applied to all routes
   - Limits: 100 requests per minute per IP
   - Returns 429 status when exceeded

2. **Authentication** (`validateApiKey`)

   - Applied to write operations (POST, PUT, PATCH, DELETE)
   - Validates API key from Authorization header
   - Format: `Bearer <API_KEY>`
   - Returns 401 status for invalid/missing keys

3. **Validation** (`validateBody`, `validateQuery`)
   - Applied to routes with request data
   - Validates against Zod schemas
   - Returns 400 status with detailed error messages

## Route Mounting

Routes are mounted on the Express app with the `/api` prefix:

```typescript
app.use("/api/bookings", bookingRoutes);
app.use("/api/health", healthRoutes);
```

## Usage Example

```typescript
import { createApp } from "./app";
import { BookingController } from "./controllers/booking.controller";
import { HealthController } from "./controllers/health.controller";

// Create controller instances
const bookingController = new BookingController(bookingService);
const healthController = new HealthController(databaseClient);

// Create Express app with routes
const app = createApp(bookingController, healthController);

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **1.1**: POST endpoint for creating bookings with validation
- **2.1**: GET endpoints for retrieving bookings with pagination and filtering
- **4.1**: PUT, PATCH, DELETE endpoints for updating and canceling bookings
- **6.1**: Rate limiting applied to all routes (100 req/min per IP)
- **7.3**: API key authentication for write operations

## Error Handling

All routes use the centralized error handler middleware which:

- Catches errors thrown by controllers
- Formats errors consistently
- Returns appropriate HTTP status codes
- Logs errors for monitoring

## Testing

Routes can be tested using integration tests with Supertest:

```typescript
import request from "supertest";
import { app } from "./app";

describe("POST /api/bookings", () => {
  it("should create a booking", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", "Bearer test-api-key")
      .send(validBookingData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("id");
  });
});
```
