# API Error Codes Reference

This document provides a comprehensive list of all error codes returned by the Metalogics Booking API, along with their meanings, HTTP status codes, and resolution guidance.

## Error Response Format

All errors follow a consistent response format:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Human-readable error message",
    "errorCode": "MACHINE_READABLE_CODE",
    "details": {
      "field": "Additional context (optional)"
    },
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

## Error Codes

### Validation Errors (400)

#### VALIDATION_ERROR

- **HTTP Status**: 400 Bad Request
- **Description**: Request data failed validation checks
- **Common Causes**:
  - Missing required fields (name, email, company, inquiry, timeSlot)
  - Invalid email format
  - Invalid phone number format
  - Invalid time slot duration (must be 15, 30, 45, or 60 minutes)
  - Invalid date format
- **Resolution**: Check the `details` field for specific validation failures and correct the request data

**Example**:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Validation failed",
    "errorCode": "VALIDATION_ERROR",
    "details": {
      "name": "Name is required",
      "email": "Invalid email format"
    },
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

### Authentication Errors (401)

#### AUTHENTICATION_ERROR

- **HTTP Status**: 401 Unauthorized
- **Description**: Invalid or missing API key
- **Common Causes**:
  - Missing Authorization header
  - Invalid API key format
  - Expired or revoked API key
- **Resolution**: Include a valid API key in the Authorization header: `Authorization: Bearer YOUR_API_KEY`

**Example**:

```json
{
  "success": false,
  "error": {
    "statusCode": 401,
    "message": "Invalid or missing API key",
    "errorCode": "AUTHENTICATION_ERROR",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

### Not Found Errors (404)

#### NOT_FOUND

- **HTTP Status**: 404 Not Found
- **Description**: Requested resource does not exist
- **Common Causes**:
  - Booking ID does not exist in the database
  - Booking was deleted
  - Incorrect booking ID format
- **Resolution**: Verify the booking ID is correct and the booking exists

**Example**:

```json
{
  "success": false,
  "error": {
    "statusCode": 404,
    "message": "Booking not found",
    "errorCode": "NOT_FOUND",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

#### ROUTE_NOT_FOUND

- **HTTP Status**: 404 Not Found
- **Description**: API endpoint does not exist
- **Common Causes**:
  - Incorrect URL path
  - Typo in endpoint
  - Using wrong HTTP method
- **Resolution**: Check the API documentation for correct endpoint paths

**Example**:

```json
{
  "success": false,
  "error": {
    "statusCode": 404,
    "message": "Route GET /api/invalid not found",
    "errorCode": "ROUTE_NOT_FOUND",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

### Conflict Errors (409)

#### CONFLICT

- **HTTP Status**: 409 Conflict
- **Description**: Time slot is already booked or conflicts with existing booking
- **Common Causes**:
  - Attempting to book a time slot that overlaps with an existing booking
  - Updating a booking to a time slot that's already taken
- **Resolution**: Choose a different time slot or check availability first

**Example**:

```json
{
  "success": false,
  "error": {
    "statusCode": 409,
    "message": "Time slot is already booked",
    "errorCode": "CONFLICT",
    "details": {
      "requestedSlot": "2024-01-15T14:00:00.000Z",
      "conflictingBookingId": "550e8400-e29b-41d4-a716-446655440000"
    },
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

### Rate Limit Errors (429)

#### RATE_LIMIT_EXCEEDED

- **HTTP Status**: 429 Too Many Requests
- **Description**: Too many requests from the same IP address
- **Common Causes**:
  - Exceeding 100 requests per minute per IP address
  - Automated scripts making too many requests
- **Resolution**: Wait for the rate limit window to reset (check `Retry-After` header) or reduce request frequency

**Example**:

```json
{
  "success": false,
  "error": {
    "statusCode": 429,
    "message": "Too many requests, please try again later",
    "errorCode": "RATE_LIMIT_EXCEEDED",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

### Server Errors (500)

#### INTERNAL_SERVER_ERROR

- **HTTP Status**: 500 Internal Server Error
- **Description**: Unexpected server error occurred
- **Common Causes**:
  - Unhandled exception in application code
  - Programming error
  - Unexpected data state
- **Resolution**: Contact support with the timestamp and request details

**Example**:

```json
{
  "success": false,
  "error": {
    "statusCode": 500,
    "message": "An unexpected error occurred",
    "errorCode": "INTERNAL_SERVER_ERROR",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

### Service Unavailable Errors (503)

#### DATABASE_ERROR

- **HTTP Status**: 503 Service Unavailable
- **Description**: Database operation failed after retry attempts
- **Common Causes**:
  - Database connection lost
  - Database server is down
  - Connection pool exhausted
  - Database timeout
- **Resolution**: Retry the request after a short delay. If the problem persists, contact support

**Example**:

```json
{
  "success": false,
  "error": {
    "statusCode": 503,
    "message": "Database operation failed after 3 retry attempts",
    "errorCode": "DATABASE_ERROR",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

#### EMAIL_SERVICE_ERROR

- **HTTP Status**: 503 Service Unavailable (non-blocking)
- **Description**: Email notification failed to send
- **Common Causes**:
  - SMTP server unavailable
  - Invalid email configuration
  - Network connectivity issues
- **Resolution**: Booking is still created successfully. Email will be retried automatically. Contact support if emails are consistently not received

**Note**: This error does not prevent booking creation. The API returns success with a warning flag.

### Timeout Errors (504)

#### TIMEOUT

- **HTTP Status**: 504 Gateway Timeout
- **Description**: Request took longer than 30 seconds to complete
- **Common Causes**:
  - Slow database query
  - Network latency
  - Heavy server load
  - Large data processing
- **Resolution**: Retry the request. If the problem persists, contact support

**Example**:

```json
{
  "success": false,
  "error": {
    "statusCode": 504,
    "message": "Request timeout after 30 seconds",
    "errorCode": "TIMEOUT",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}
```

## Retry Strategy

The API implements automatic retry logic for certain operations:

### Database Operations

- **Max Attempts**: 3
- **Backoff**: Exponential (1s, 2s, 4s)
- **Retryable Errors**: Connection errors, timeouts, temporary database issues

### Email Operations

- **Max Attempts**: 3
- **Backoff**: Exponential (2s, 4s, 8s)
- **Retryable Errors**: SMTP connection errors, temporary mail server issues

### Client Retry Recommendations

For the following error codes, clients should implement retry logic:

- **503 DATABASE_ERROR**: Retry after 2-5 seconds with exponential backoff
- **504 TIMEOUT**: Retry after 5-10 seconds
- **429 RATE_LIMIT_EXCEEDED**: Retry after the time specified in `Retry-After` header

Do NOT retry for:

- **400 VALIDATION_ERROR**: Fix the request data first
- **401 AUTHENTICATION_ERROR**: Fix authentication credentials first
- **404 NOT_FOUND**: Resource doesn't exist
- **409 CONFLICT**: Choose different time slot

## HTTP Status Code Summary

| Status Code | Error Code            | Description                |
| ----------- | --------------------- | -------------------------- |
| 400         | VALIDATION_ERROR      | Invalid request data       |
| 401         | AUTHENTICATION_ERROR  | Invalid or missing API key |
| 404         | NOT_FOUND             | Resource not found         |
| 404         | ROUTE_NOT_FOUND       | Endpoint not found         |
| 409         | CONFLICT              | Time slot conflict         |
| 429         | RATE_LIMIT_EXCEEDED   | Too many requests          |
| 500         | INTERNAL_SERVER_ERROR | Unexpected server error    |
| 503         | DATABASE_ERROR        | Database unavailable       |
| 503         | EMAIL_SERVICE_ERROR   | Email service unavailable  |
| 504         | TIMEOUT               | Request timeout            |

## Support

If you encounter persistent errors or need assistance:

1. Check this documentation for error code details
2. Verify your request format matches the API specification
3. Check the API status page for known issues
4. Contact support with:
   - Error code and message
   - Timestamp from error response
   - Request details (without sensitive data)
   - Steps to reproduce the issue
