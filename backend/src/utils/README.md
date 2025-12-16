# Utilities

This directory contains utility functions and services used throughout the application.

## Logger (`logger.ts`)

Winston-based logging infrastructure with structured logging and log rotation.

### Features

- **Multiple Transports**: Console (development) and file-based (production) logging
- **Structured Logging**: JSON format with timestamp, level, requestId, message, and context
- **Log Rotation**: Daily rotation with configurable retention (14 days for app logs, 30 days for errors)
- **Environment-Based Configuration**: Different log levels for development and production
- **Child Loggers**: Support for request-scoped loggers with correlation IDs

### Usage

```typescript
import { logger } from "../utils/logger";

// Basic logging
logger.info("User logged in");
logger.warn("Rate limit approaching");
logger.error("Database connection failed");
logger.debug("Processing request data");

// Logging with context
logger.info("Booking created", {
  context: {
    bookingId: "booking-123",
    userId: "user@example.com",
    duration: 30,
  },
});

// Logging with request ID
logger.info("Request received", {
  requestId: "req-456",
  context: {
    method: "POST",
    path: "/api/bookings",
  },
});

// Child logger with default metadata
const requestLogger = logger.child({ requestId: "req-789" });
requestLogger.info("Processing request");
requestLogger.error("Request failed");
```

### Configuration

Set these environment variables to configure logging:

```bash
# Log level: error, warn, info, debug
LOG_LEVEL=info

# File path for logs (enables file-based logging)
LOG_FILE_PATH=./logs/app.log

# Environment (affects default log level)
NODE_ENV=production
```

### Log Files

When `LOG_FILE_PATH` is configured, the following files are created:

- `app-YYYY-MM-DD.log`: All logs (rotated daily, kept for 14 days, max 20MB per file)
- `error-YYYY-MM-DD.log`: Error logs only (rotated daily, kept for 30 days, max 20MB per file)

### Log Format

**Console (Development)**:

```
2025-11-18 11:59:48.871 [info] [req-123]: Booking created {"bookingId":"booking-789"}
```

**File (Production)**:

```json
{
  "timestamp": "2025-11-18 11:59:48.873",
  "level": "info",
  "message": "Booking created",
  "requestId": "req-123",
  "context": {
    "bookingId": "booking-789"
  }
}
```

### Testing

Run the verification script to test the logging infrastructure:

```bash
npm run verify:logging
```
