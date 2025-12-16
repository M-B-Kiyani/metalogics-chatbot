# Data Transfer Objects (DTOs) and Validation Schemas

This directory contains Zod validation schemas and TypeScript types for request/response data validation.

## Available Schemas

### CreateBookingDTO

Validates data for creating a new booking.

**Required fields:**

- `name`: string (1-255 characters)
- `company`: string (1-255 characters)
- `email`: valid email format
- `inquiry`: string (non-empty)
- `timeSlot`: object with:
  - `startTime`: Date
  - `duration`: 15, 30, 45, or 60 minutes

**Optional fields:**

- `phone`: string matching phone format regex

**Example:**

```typescript
import { createBookingSchema } from "./dto";

const bookingData = {
  name: "John Doe",
  company: "Acme Corp",
  email: "john@acme.com",
  phone: "+1-555-123-4567",
  inquiry: "I need help with AI integration",
  timeSlot: {
    startTime: new Date("2024-12-01T10:00:00Z"),
    duration: 30,
  },
};

const result = createBookingSchema.safeParse(bookingData);
if (result.success) {
  console.log("Valid booking:", result.data);
} else {
  console.error("Validation errors:", result.error);
}
```

### UpdateBookingDTO

Validates data for updating an existing booking.

**All fields are optional:**

- `inquiry`: string (non-empty if provided)
- `timeSlot`: object with startTime and duration

### BookingFilters

Validates query parameters for filtering bookings.

**All fields are optional:**

- `page`: positive integer (default: 1)
- `limit`: positive integer, max 100 (default: 10)
- `status`: BookingStatus enum value
- `dateFrom`: Date
- `dateTo`: Date
- `email`: valid email format

### UpdateBookingStatusDTO

Validates data for updating booking status.

**Required fields:**

- `status`: BookingStatus enum (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW)

## Custom Validators

### Email Validator

Validates email format using Zod's built-in email validator.

### Phone Validator

Validates phone numbers in various international formats:

- `+1-555-123-4567`
- `555-123-4567`
- `(555) 123-4567`
- `+44 20 1234 5678`

### Duration Validator

Ensures duration is one of the allowed values: 15, 30, 45, or 60 minutes.

## Usage with Middleware

The validation schemas are designed to work with the validation middleware:

```typescript
import { validateBody, validateQuery } from "../middleware";
import { createBookingSchema, bookingFiltersSchema } from "../dto";

// Validate request body
router.post("/bookings", validateBody(createBookingSchema), createBooking);

// Validate query parameters
router.get("/bookings", validateQuery(bookingFiltersSchema), getBookings);
```

## Type Safety

All schemas export corresponding TypeScript types:

```typescript
import { CreateBookingDTO, UpdateBookingDTO, BookingFilters } from "./dto";

function createBooking(data: CreateBookingDTO) {
  // TypeScript knows the exact shape of data
}
```
