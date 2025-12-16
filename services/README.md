# Frontend Services

This directory contains service modules for interacting with external APIs and services.

## Booking API Service

The `bookingApiService.ts` module provides functions for interacting with the backend booking API.

### Configuration

Set the following environment variables in your `.env` or `.env.local` file:

```bash
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_API_KEY=your-secure-api-key-min-32-characters-long
```

### Usage

```typescript
import { createBooking, ApiError } from "../services/bookingApiService";

try {
  const booking = await createBooking({
    name: "John Doe",
    company: "Acme Corp",
    email: "john@example.com",
    phone: "+1234567890",
    inquiry: "I need help with...",
    timeSlot: {
      startTime: new Date("2024-01-15T10:00:00Z"),
      duration: 30,
    },
  });

  console.log("Booking created:", booking);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error [${error.errorCode}]:`, error.message);
  }
}
```

### Error Handling

The service throws `ApiError` instances with the following properties:

- `statusCode`: HTTP status code (e.g., 400, 404, 503)
- `errorCode`: Machine-readable error code (e.g., 'VALIDATION_ERROR', 'CONFLICT', 'NETWORK_ERROR')
- `message`: Human-readable error message
- `details`: Optional additional error details

Common error codes:

- `VALIDATION_ERROR`: Invalid input data
- `CONFLICT`: Time slot conflict or resource conflict
- `NETWORK_ERROR`: Unable to connect to the backend
- `UNKNOWN_ERROR`: Unexpected error occurred

## Gemini Service

The `geminiService.ts` module provides integration with Google's Gemini AI for the chatbot functionality.

### Configuration

Set the following environment variable:

```bash
VITE_GOOGLE_API_KEY=your-gemini-api-key
```
