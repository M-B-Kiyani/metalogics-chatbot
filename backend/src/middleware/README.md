# Middleware

This directory contains all Express middleware functions used in the Backend API.

## Available Middleware

### Authentication Middleware (`auth.middleware.ts`)

Validates API keys from the Authorization header to protect write operations.

**Usage:**

```typescript
import { validateApiKey } from "./middleware";

// Apply to specific routes
router.post("/api/bookings", validateApiKey, createBooking);
```

**Configuration:**

- `API_KEY`: The expected API key (from environment variables)

**Headers:**

- `Authorization: Bearer <API_KEY>`

**Errors:**

- `401 MISSING_AUTH_HEADER`: No Authorization header provided
- `401 INVALID_AUTH_FORMAT`: Invalid header format
- `401 INVALID_API_KEY`: API key doesn't match

### Rate Limiting Middleware (`rateLimit.middleware.ts`)

Limits the number of requests per IP address within a time window using an in-memory store.

**Usage:**

```typescript
import { rateLimiter } from "./middleware";

// Apply globally
app.use(rateLimiter);
```

**Configuration:**

- `RATE_LIMIT_WINDOW_MS`: Time window in milliseconds (default: 60000 = 1 minute)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 100)

**Response Headers:**

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets
- `Retry-After`: Seconds to wait before retrying (when limit exceeded)

**Errors:**

- `429 RATE_LIMIT_EXCEEDED`: Too many requests

### CORS Middleware (`cors.middleware.ts`)

Configures Cross-Origin Resource Sharing based on allowed origins from environment variables.

**Usage:**

```typescript
import { corsMiddleware } from "./middleware";

// Apply globally
app.use(corsMiddleware());
```

**Configuration:**

- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins (default: `http://localhost:5173`)

**Features:**

- Allows requests with no origin (mobile apps, curl)
- Supports credentials
- Caches preflight requests for 24 hours
- Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Allowed headers: Content-Type, Authorization

### Request Timeout Middleware (`timeout.middleware.ts`)

Ensures all requests complete within a specified time limit.

**Usage:**

```typescript
import { requestTimeout } from "./middleware";

// Apply globally
app.use(requestTimeout);
```

**Configuration:**

- `REQUEST_TIMEOUT_MS`: Timeout in milliseconds (default: 30000 = 30 seconds)

**Errors:**

- `504 REQUEST_TIMEOUT`: Request exceeded timeout limit

### Input Sanitization Middleware (`sanitization.middleware.ts`)

Sanitizes request body, query parameters, and URL parameters to prevent XSS attacks.

**Usage:**

```typescript
import { sanitizeInput } from "./middleware";

// Apply globally (before route handlers)
app.use(sanitizeInput);
```

**Features:**

- Escapes HTML special characters: `&`, `<`, `>`, `"`, `'`, `/`
- Recursively sanitizes objects and arrays
- Sanitizes body, query, and params

### Validation Middleware (`validation.middleware.ts`)

Validates request data against Zod schemas.

**Usage:**

```typescript
import { validateRequest } from "./middleware";
import { createBookingSchema } from "../dto";

router.post(
  "/api/bookings",
  validateRequest(createBookingSchema),
  createBooking
);
```

### Request Logger Middleware (`requestLogger.middleware.ts`)

Logs all incoming requests and outgoing responses with correlation IDs for request tracking.

**Usage:**

```typescript
import { requestLogger } from "./middleware";

// Apply globally (early in middleware stack)
app.use(requestLogger);
```

**Features:**

- Generates unique correlation ID for each request (or uses `X-Request-ID` header if provided)
- Logs incoming requests with method, path, query, IP, and user agent
- Logs outgoing responses with status code and duration
- Adds `X-Request-ID` header to responses for client-side tracking
- Attaches `requestId` to the Express Request object for use in other middleware/handlers

**Request Object Extensions:**

```typescript
// Access request ID in route handlers
app.get("/api/bookings", (req, res) => {
  const requestId = req.requestId; // Available on all requests
  // Use for logging or tracking
});
```

**Log Format:**

```
2025-11-18 11:59:48.884 [info] [req-6d11433f-3a3e-49ba-9d99-1c2c382d7204]: Incoming request {"method":"POST","path":"/api/bookings","query":{"page":"1"},"ip":"127.0.0.1"}
2025-11-18 11:59:48.920 [info] [req-6d11433f-3a3e-49ba-9d99-1c2c382d7204]: Outgoing response {"method":"POST","path":"/api/bookings","statusCode":201,"duration":"36ms"}
```

### Error Handler Middleware (`errorHandler.middleware.ts`)

Centralized error handling that formats all errors consistently.

**Usage:**

```typescript
import { errorHandler } from "./middleware";

// Apply as the last middleware
app.use(errorHandler);
```

**Features:**

- Formats operational errors (AppError instances)
- Logs non-operational errors
- Hides internal error details in production
- Returns consistent error response format

## Middleware Order

The order in which middleware is applied is important. Here's the recommended order:

```typescript
import express from "express";
import {
  corsMiddleware,
  requestLogger,
  requestTimeout,
  sanitizeInput,
  rateLimiter,
  validateApiKey,
  validateRequest,
  errorHandler,
} from "./middleware";

const app = express();

// 1. CORS - Must be first to handle preflight requests
app.use(corsMiddleware());

// 2. Request logger - Log all requests early
app.use(requestLogger);

// 3. Request timeout - Start timing early
app.use(requestTimeout);

// 4. Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Input sanitization - Sanitize after parsing
app.use(sanitizeInput);

// 6. Rate limiting - Limit requests early
app.use(rateLimiter);

// 7. Routes with authentication and validation
app.post("/api/bookings", validateApiKey, validateRequest(schema), handler);

// 8. Error handler - Must be last
app.use(errorHandler);
```

## Security Features

### XSS Prevention

- Input sanitization escapes HTML special characters
- Prevents malicious scripts from being injected

### API Key Authentication

- Protects write operations from unauthorized access
- Uses Bearer token format

### Rate Limiting

- Prevents abuse and DoS attacks
- In-memory store with automatic cleanup
- Per-IP address tracking

### CORS Protection

- Restricts cross-origin requests to allowed domains
- Prevents unauthorized frontend applications from accessing the API

### Request Timeout

- Prevents long-running requests from consuming resources
- Ensures timely responses

## Testing

All middleware functions include proper error handling and logging. They can be tested using:

```typescript
import request from "supertest";
import express from "express";
import { rateLimiter } from "./middleware";

describe("Rate Limiter", () => {
  it("should block requests after limit is exceeded", async () => {
    const app = express();
    app.use(rateLimiter);
    app.get("/test", (req, res) => res.json({ ok: true }));

    // Make requests up to the limit
    for (let i = 0; i < 100; i++) {
      await request(app).get("/test").expect(200);
    }

    // Next request should be blocked
    await request(app).get("/test").expect(429);
  });
});
```

## Environment Variables

All middleware configuration is managed through environment variables:

```bash
# Authentication
API_KEY=your-secure-api-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Request Timeout
REQUEST_TIMEOUT_MS=30000

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://metalogics.io
```

See `.env.example` for complete configuration options.
