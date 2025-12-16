# Services

This directory contains business logic services for the backend application.

## NotificationService

The `NotificationService` handles sending booking-related email notifications using the `EmailClient`.

### Features

- **Booking Confirmation**: Sends confirmation emails to both user and admin when a booking is created
- **Booking Updates**: Notifies users when their booking details are modified
- **Cancellation Notifications**: Sends cancellation emails when bookings are cancelled
- **Retry Logic**: Automatically retries failed email sends up to 3 times with exponential backoff (2s, 4s, 8s)
- **Error Handling**: Logs failures but doesn't throw errors to avoid blocking booking operations

### Usage

```typescript
import { NotificationService } from "./services/notification.service";
import { Booking } from "@prisma/client";

const notificationService = new NotificationService();

// Send booking confirmation (to user and admin)
await notificationService.sendBookingConfirmation(booking);

// Send booking update notification
await notificationService.sendBookingUpdate(booking);

// Send cancellation notification
await notificationService.sendCancellationNotification(booking);

// Close the service when done
await notificationService.close();
```

### Configuration

The service requires the following environment variables:

- `SMTP_HOST`: SMTP server hostname (e.g., smtp.gmail.com)
- `SMTP_PORT`: SMTP server port (e.g., 587 for TLS, 465 for SSL)
- `SMTP_USER`: SMTP username/email
- `SMTP_PASSWORD`: SMTP password or app-specific password
- `ADMIN_EMAIL`: Email address to receive admin notifications

### Email Templates

The service uses HTML email templates located in `src/templates/email.templates.ts`:

- **User Confirmation**: Sent to the user after booking creation
- **Admin Notification**: Sent to admin after booking creation
- **Booking Update**: Sent to user when booking is modified
- **Cancellation**: Sent to user when booking is cancelled

All templates include:

- Consistent branding and styling
- Booking details (ID, date/time, duration, inquiry)
- Status badges
- Responsive design

## RetryService

The `RetryService` provides retry mechanism with exponential backoff for operations that may fail due to transient errors.

### Features

- **Exponential Backoff**: Delays between retries increase exponentially
- **Configurable**: Customize max attempts, delays, and backoff multiplier
- **Smart Error Detection**: Automatically identifies retryable errors (network, timeout, database)
- **Logging**: Logs all retry attempts and failures

### Usage

```typescript
import { RetryService } from "./services/retry.service";

const retryService = new RetryService({
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 8000, // 8 seconds
  backoffMultiplier: 2,
});

// Execute operation with retry
const result = await retryService.withRetry(async () => {
  return await someOperationThatMightFail();
});
```

### Retryable Errors

The service automatically retries on:

- Network errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND, ECONNRESET, EPIPE)
- Database errors (DATABASE_ERROR)
- Errors with timeout/connection keywords in message

## Testing

To verify the email notification setup:

```bash
npm run verify:email
```

This will:

1. Instantiate the EmailClient
2. Verify SMTP connection (if credentials are valid)
3. Instantiate the NotificationService
4. Check all required environment variables

## Notes

- Email sending failures are logged but don't block booking operations
- The NotificationService uses the RetryService internally for resilient email delivery
- All email operations are asynchronous and non-blocking
- SMTP connection is verified on EmailClient instantiation
