# Booking System Completion - Design Document

## Overview

This design document outlines the implementation approach for completing the Metalogics AI Assistant booking system by adding critical missing integrations and configurations. The system currently has a functional backend API (70% complete) but lacks Google Calendar integration, HubSpot CRM integration, available time slots API, and production-ready configuration.

### Key Design Goals

- **Calendar Integration**: Enable real-time availability checking and automatic event creation
- **CRM Integration**: Capture leads automatically in HubSpot for sales pipeline management
- **Availability API**: Provide users with accurate available time slots based on calendar and business rules
- **Configuration**: Ensure production-ready setup with proper credentials and error handling
- **Resilience**: Graceful degradation when external services are unavailable
- **Maintainability**: Follow existing architecture patterns and code organization

## Architecture

### High-Level Architecture with New Components

```
┌─────────────────┐
│  React Client   │
│   (Frontend)    │
└────────┬────────┘
         │ HTTPS/REST
         ▼
┌─────────────────────────────────────────────────┐
│         Express API Server                      │
│  ┌──────────────────────────────────────────┐  │
│  │   New Endpoints                          │  │
│  │   - GET /api/bookings/available-slots   │  │
│  └──────────────┬───────────────────────────┘  │
│                 ▼                               │
│  ┌──────────────────────────────────────────┐  │
│  │   BookingService (Enhanced)              │  │
│  │   - Frequency limit checking             │  │
│  │   - Calendar event creation              │  │
│  │   - CRM contact creation                 │  │
│  └──────┬───────────────┬──────────┬────────┘  │
│         │               │          │            │
│         ▼               ▼          ▼            │
│  ┌──────────┐   ┌──────────┐  ┌──────────┐   │
│  │ Calendar │   │   CRM    │  │ Booking  │   │
│  │ Service  │   │ Service  │  │Repository│   │
│  └────┬─────┘   └────┬─────┘  └──────────┘   │
│       │              │                         │
└───────┼──────────────┼─────────────────────────┘
        │              │
        ▼              ▼
┌──────────────┐  ┌──────────────┐
│   Google     │  │   HubSpot    │
│   Calendar   │  │     CRM      │
│     API      │  │     API      │
└──────────────┘  └──────────────┘
```

### Technology Stack Additions

- **Google Calendar API**: googleapis npm package (v118+)
- **HubSpot API**: @hubspot/api-client npm package (v9+)
- **Authentication**: OAuth 2.0 service account for Google, Private App token for HubSpot
- **Date/Time**: date-fns for timezone-aware date manipulation

### Integration Strategy

The new components follow the existing architectural patterns:

1. **Client Layer**: External API communication (calendar.client.ts, hubspot.client.ts)
2. **Service Layer**: Business logic and orchestration (calendar.service.ts, crm.service.ts)
3. **Enhanced BookingService**: Coordinates all integrations during booking lifecycle
4. **Configuration**: Extended config system for new API credentials

## Components and Interfaces

### 1. Google Calendar Integration

#### CalendarClient (integrations/calendar.client.ts)

**Responsibility**: Low-level Google Calendar API communication

```typescript
interface CalendarClient {
  // Initialize with service account credentials
  initialize(credentials: ServiceAccountCredentials): Promise<void>;

  // Get events within a date range
  getEvents(
    startDate: Date,
    endDate: Date,
    calendarId: string
  ): Promise<CalendarEvent[]>;

  // Create a new calendar event
  createEvent(
    event: CreateEventData,
    calendarId: string
  ): Promise<CalendarEvent>;

  // Update an existing event
  updateEvent(
    eventId: string,
    updates: UpdateEventData,
    calendarId: string
  ): Promise<CalendarEvent>;

  // Delete/cancel an event
  deleteEvent(eventId: string, calendarId: string): Promise<void>;

  // Check authentication status
  isAuthenticated(): boolean;
}

interface ServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
  calendarId: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{ email: string; responseStatus?: string }>;
  status: "confirmed" | "tentative" | "cancelled";
}

interface CreateEventData {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  timeZone: string;
}
```

#### CalendarService (services/calendar.service.ts)

**Responsibility**: Business logic for calendar operations

```typescript
interface CalendarService {
  // Get busy time slots from calendar
  getBusySlots(startDate: Date, endDate: Date): Promise<TimeSlot[]>;

  // Check if a specific time slot is available
  isSlotAvailable(startTime: Date, duration: number): Promise<boolean>;

  // Create booking event in calendar
  createBookingEvent(booking: Booking): Promise<string>; // Returns event ID

  // Update booking event
  updateBookingEvent(eventId: string, booking: Booking): Promise<void>;

  // Cancel booking event
  cancelBookingEvent(eventId: string): Promise<void>;

  // Calculate available slots based on calendar and business rules
  getAvailableSlots(
    startDate: Date,
    endDate: Date,
    duration: number,
    businessHours: BusinessHours
  ): Promise<TimeSlot[]>;
}

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

interface BusinessHours {
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  startHour: number; // 0-23
  endHour: number; // 0-23
  timeZone: string;
  bufferMinutes: number; // Buffer between bookings
  minAdvanceHours: number; // Minimum hours in advance for booking
}
```

### 2. HubSpot CRM Integration

#### HubSpotClient (integrations/hubspot.client.ts)

**Responsibility**: Low-level HubSpot API communication

```typescript
interface HubSpotClient {
  // Initialize with access token
  initialize(accessToken: string): Promise<void>;

  // Search for contact by email
  searchContactByEmail(email: string): Promise<HubSpotContact | null>;

  // Create a new contact
  createContact(contactData: CreateContactData): Promise<HubSpotContact>;

  // Update existing contact
  updateContact(
    contactId: string,
    updates: UpdateContactData
  ): Promise<HubSpotContact>;

  // Create or update contact (upsert)
  upsertContact(contactData: CreateContactData): Promise<HubSpotContact>;

  // Check authentication status
  isAuthenticated(): boolean;
}

interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    phone?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateContactData {
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  phone?: string;
  customProperties?: Record<string, string>;
}

interface UpdateContactData {
  properties: Record<string, string>;
}
```

#### CRMService (services/crm.service.ts)

**Responsibility**: Business logic for CRM operations

```typescript
interface CRMService {
  // Create or update contact from booking
  syncBookingToContact(booking: Booking): Promise<string>; // Returns contact ID

  // Update contact with booking status change
  updateContactBookingStatus(
    email: string,
    bookingId: string,
    status: BookingStatus
  ): Promise<void>;

  // Add note to contact about booking
  addBookingNote(contactId: string, note: string): Promise<void>;
}
```

### 3. Available Slots API

#### AvailableSlotsController (controllers/availableSlots.controller.ts)

**Responsibility**: Handle HTTP requests for available time slots

```typescript
interface AvailableSlotsController {
  getAvailableSlots(req: Request, res: Response): Promise<Response>;
  // Query params: startDate, endDate, duration
}
```

#### Enhanced BookingService

**New Methods Added**:

```typescript
interface BookingServiceEnhancements {
  // Check frequency limits for an email
  checkFrequencyLimit(email: string): Promise<boolean>;

  // Get booking count for email in time window
  getBookingCountForEmail(email: string, days: number): Promise<number>;

  // Get available time slots
  getAvailableTimeSlots(
    startDate: Date,
    endDate: Date,
    duration: number
  ): Promise<TimeSlot[]>;
}
```

### 4. Configuration Extensions

#### Extended Configuration (config/index.ts)

**New Configuration Sections**:

```typescript
interface GoogleCalendarConfig {
  enabled: boolean;
  serviceAccountEmail: string;
  serviceAccountKeyPath: string;
  calendarId: string;
  timeZone: string;
  retryAttempts: number;
  retryDelay: number;
}

interface HubSpotConfig {
  enabled: boolean;
  accessToken: string;
  retryAttempts: number;
  retryDelay: number;
}

interface BookingRulesConfig {
  maxBookingsPerEmail: number;
  frequencyWindowDays: number;
  businessHours: {
    daysOfWeek: number[];
    startHour: number;
    endHour: number;
    timeZone: string;
  };
  bufferMinutes: number;
  minAdvanceHours: number;
}

// Extended AppConfig
interface AppConfig {
  // ... existing config
  googleCalendar: GoogleCalendarConfig;
  hubspot: HubSpotConfig;
  bookingRules: BookingRulesConfig;
}
```

## Data Models

### Database Schema Updates

**Add to Booking Model**:

```prisma
model Booking {
  // ... existing fields

  // External Integration IDs
  calendarEventId  String?  // Google Calendar event ID
  crmContactId     String?  // HubSpot contact ID

  // Sync Status Flags
  calendarSynced   Boolean  @default(false)
  crmSynced        Boolean  @default(false)

  // Manual Processing Flags
  requiresManualCalendarSync Boolean @default(false)
  requiresManualCrmSync      Boolean @default(false)

  @@index([calendarEventId])
  @@index([crmContactId])
}
```

### API Request/Response DTOs

#### Available Slots Request

```typescript
interface AvailableSlotsQuery {
  startDate: string; // ISO 8601 date
  endDate: string; // ISO 8601 date
  duration: 15 | 30 | 45 | 60; // minutes
}
```

#### Available Slots Response

```typescript
interface AvailableSlotsResponse {
  success: true;
  data: {
    slots: Array<{
      startTime: string; // ISO 8601
      endTime: string; // ISO 8601
      duration: number;
    }>;
    businessHours: {
      daysOfWeek: number[];
      startHour: number;
      endHour: number;
      timeZone: string;
    };
  };
}
```

## Error Handling

### New Error Types

```typescript
// errors/CalendarError.ts
class CalendarError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(503, message, "CALENDAR_ERROR");
    this.originalError = originalError;
  }
}

class CalendarAuthError extends AppError {
  constructor(message: string) {
    super(401, message, "CALENDAR_AUTH_ERROR");
  }
}

// errors/CRMError.ts
class CRMError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(503, message, "CRM_ERROR");
    this.originalError = originalError;
  }
}

class CRMAuthError extends AppError {
  constructor(message: string) {
    super(401, message, "CRM_AUTH_ERROR");
  }
}

// errors/FrequencyLimitError.ts
class FrequencyLimitError extends AppError {
  constructor(maxBookings: number, windowDays: number) {
    super(
      429,
      `Maximum ${maxBookings} bookings per ${windowDays} days exceeded`,
      "FREQUENCY_LIMIT_EXCEEDED"
    );
  }
}
```

### Graceful Degradation Strategy

When external services fail, the system should:

1. **Calendar API Failure**:

   - Log the error with full context
   - Mark booking with `requiresManualCalendarSync = true`
   - Set `calendarSynced = false`
   - Still create the booking in database
   - Send email notification with manual calendar instructions
   - Return success to user with warning flag

2. **HubSpot API Failure**:

   - Log the error with full context
   - Mark booking with `requiresManualCrmSync = true`
   - Set `crmSynced = false`
   - Still create the booking in database
   - Continue with normal flow
   - Return success to user

3. **Both Services Fail**:
   - Booking still succeeds
   - Both manual sync flags set
   - Email notification sent
   - Admin notified of sync failures

### Circuit Breaker Pattern

Implement circuit breaker for external APIs to prevent cascading failures:

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Time in ms before attempting to close circuit
  monitoringPeriod: number; // Time window for counting failures
}

enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Failing, reject requests immediately
  HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}
```

## Booking Flow with Integrations

### Enhanced Booking Creation Flow

```
1. User submits booking request
   ↓
2. Validate booking data (existing)
   ↓
3. Check frequency limit (NEW)
   - Query bookings for email in past N days
   - If limit exceeded → return 429 error
   ↓
4. Check calendar availability (NEW)
   - Query Google Calendar for conflicts
   - If conflict → return 409 error
   ↓
5. Check database conflicts (existing)
   - Query database for overlapping bookings
   - If conflict → return 409 error
   ↓
6. Create booking in database (existing)
   ↓
7. Create calendar event (NEW - async, non-blocking)
   - Call CalendarService.createBookingEvent()
   - On success: Update booking.calendarEventId, calendarSynced = true
   - On failure: Set requiresManualCalendarSync = true, log error
   ↓
8. Create/update CRM contact (NEW - async, non-blocking)
   - Call CRMService.syncBookingToContact()
   - On success: Update booking.crmContactId, crmSynced = true
   - On failure: Set requiresManualCrmSync = true, log error
   ↓
9. Send email notifications (existing)
   ↓
10. Return success response to user
```

### Available Slots Calculation Flow

```
1. Receive request with startDate, endDate, duration
   ↓
2. Validate date range (max 30 days)
   ↓
3. Get busy slots from Google Calendar
   - CalendarService.getBusySlots()
   ↓
4. Get busy slots from database bookings
   - BookingRepository.findMany() with date filter
   ↓
5. Merge busy slots from both sources
   ↓
6. Generate all possible time slots within business hours
   - Respect business hours configuration
   - Apply buffer time between slots
   - Exclude past times (minAdvanceHours)
   ↓
7. Remove busy slots from possible slots
   ↓
8. Return available slots array
```

## Testing Strategy

### Unit Tests

**CalendarClient Tests**:

- Mock googleapis library
- Test authentication with service account
- Test event creation, update, deletion
- Test error handling for API failures

**CalendarService Tests**:

- Mock CalendarClient
- Test busy slot calculation
- Test available slot generation with business hours
- Test buffer time application

**HubSpotClient Tests**:

- Mock @hubspot/api-client
- Test contact search, create, update
- Test upsert logic
- Test error handling

**CRMService Tests**:

- Mock HubSpotClient
- Test booking to contact sync
- Test status update propagation

**BookingService Tests (Enhanced)**:

- Mock all dependencies
- Test frequency limit checking
- Test calendar conflict detection
- Test graceful degradation when external APIs fail
- Test manual sync flag setting

### Integration Tests

**Available Slots Endpoint**:

- Test with various date ranges
- Test with different durations
- Test business hours filtering
- Test buffer time application
- Test error responses for invalid inputs

**Booking Creation with Integrations**:

- Test successful booking with all integrations
- Test booking when calendar API fails
- Test booking when HubSpot API fails
- Test frequency limit enforcement
- Test calendar conflict detection

### Manual Testing Checklist

- [ ] Google Calendar authentication works
- [ ] Calendar events created with correct details
- [ ] Calendar events include attendees
- [ ] HubSpot contact created/updated
- [ ] Available slots exclude booked times
- [ ] Business hours respected
- [ ] Frequency limits enforced
- [ ] Graceful degradation when APIs fail
- [ ] Email notifications include calendar info

## Security Considerations

### Google Calendar API Security

- **Service Account**: Use service account credentials (not OAuth user flow)
- **Credential Storage**: Store private key in secure file, path in environment variable
- **Scope Limitation**: Request only necessary scopes (calendar.events)
- **Calendar Access**: Ensure service account has access to target calendar
- **Key Rotation**: Plan for periodic service account key rotation

### HubSpot API Security

- **Private App Token**: Use private app access token (not OAuth)
- **Token Storage**: Store token in environment variable, never in code
- **Token Permissions**: Grant only necessary scopes (contacts read/write)
- **Token Rotation**: Plan for periodic token rotation
- **Rate Limiting**: Respect HubSpot API rate limits (100 requests/10 seconds)

### Data Privacy

- **PII Handling**: Encrypt sensitive data before sending to external services
- **Data Minimization**: Only send necessary data to external APIs
- **Audit Logging**: Log all external API calls with data sent/received
- **Compliance**: Ensure GDPR/privacy compliance for data sharing

### API Key Management

- **Environment Variables**: All credentials in environment variables
- **No Hardcoding**: Never commit credentials to version control
- **Validation**: Validate credential format on startup
- **Fail Fast**: Application should not start with invalid credentials

## Configuration Management

### Environment Variables

**New Environment Variables**:

```bash
# ============================================
# GOOGLE CALENDAR CONFIGURATION
# ============================================

# Enable/disable Google Calendar integration
GOOGLE_CALENDAR_ENABLED=true

# Path to service account JSON key file
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./config/google-service-account.json

# Calendar ID to use (usually email address of calendar)
GOOGLE_CALENDAR_ID=primary

# Timezone for calendar operations
GOOGLE_CALENDAR_TIMEZONE=America/New_York

# Retry configuration
GOOGLE_CALENDAR_RETRY_ATTEMPTS=3
GOOGLE_CALENDAR_RETRY_DELAY=1000

# ============================================
# HUBSPOT CRM CONFIGURATION
# ============================================

# Enable/disable HubSpot integration
HUBSPOT_ENABLED=true

# HubSpot private app access token
HUBSPOT_ACCESS_TOKEN=your-hubspot-access-token

# Retry configuration
HUBSPOT_RETRY_ATTEMPTS=3
HUBSPOT_RETRY_DELAY=1000

# ============================================
# BOOKING RULES CONFIGURATION
# ============================================

# Maximum bookings per email address
MAX_BOOKINGS_PER_EMAIL=2

# Time window for frequency limit (in days)
FREQUENCY_WINDOW_DAYS=30

# Business hours - days of week (0=Sunday, 6=Saturday)
BUSINESS_DAYS=1,2,3,4,5

# Business hours - start and end (24-hour format)
BUSINESS_START_HOUR=9
BUSINESS_END_HOUR=17

# Timezone for business hours
BUSINESS_TIMEZONE=America/New_York

# Buffer time between bookings (minutes)
BUFFER_MINUTES=15

# Minimum advance booking time (hours)
MIN_ADVANCE_HOURS=24
```

### Configuration Validation

On application startup, validate:

- All required environment variables are present
- Google service account key file exists and is valid JSON
- HubSpot access token format is valid
- Business hours configuration is logical (start < end)
- Timezone strings are valid

### Development vs Production Configuration

**Development Mode**:

- Can disable integrations (GOOGLE_CALENDAR_ENABLED=false)
- Use mock implementations for testing
- Relaxed validation rules

**Production Mode**:

- All integrations must be enabled
- Strict validation of all credentials
- Fail fast on configuration errors

## Deployment Considerations

### Prerequisites

1. **Google Calendar Setup**:

   - Create Google Cloud Project
   - Enable Google Calendar API
   - Create service account
   - Download service account key JSON
   - Share target calendar with service account email
   - Grant "Make changes to events" permission

2. **HubSpot Setup**:

   - Create HubSpot private app
   - Grant contacts read/write permissions
   - Copy access token
   - Configure custom properties for booking data (optional)

3. **Database Migration**:
   - Run Prisma migration to add new fields to Booking model
   - Backup database before migration

### Deployment Steps

1. **Install Dependencies**:

   ```bash
   npm install googleapis @hubspot/api-client date-fns
   ```

2. **Update Environment Variables**:

   - Add all new configuration variables
   - Upload service account key file to server
   - Validate all credentials

3. **Run Database Migration**:

   ```bash
   npx prisma migrate deploy
   ```

4. **Test Integrations**:

   - Run health check endpoints
   - Test calendar authentication
   - Test HubSpot authentication
   - Create test booking

5. **Monitor Logs**:
   - Watch for integration errors
   - Verify calendar events created
   - Verify CRM contacts created

### Rollback Plan

If integrations fail in production:

1. Set `GOOGLE_CALENDAR_ENABLED=false` and `HUBSPOT_ENABLED=false`
2. Restart application
3. System continues to work without integrations
4. Manual sync required for existing bookings

### Monitoring

**Key Metrics to Track**:

- Calendar API success/failure rate
- HubSpot API success/failure rate
- Available slots API response time
- Frequency limit rejections
- Manual sync flag occurrences

**Alerts to Configure**:

- Calendar API failure rate > 10%
- HubSpot API failure rate > 10%
- Available slots API response time > 5 seconds
- Authentication failures

## Performance Optimization

### Caching Strategy

**Calendar Busy Slots**:

- Cache busy slots for 5 minutes
- Invalidate cache on new booking creation
- Use in-memory cache (node-cache or similar)

**Available Slots**:

- Cache available slots response for 5 minutes per date range
- Cache key: `available-slots:${startDate}:${endDate}:${duration}`

**HubSpot Contact Lookup**:

- Cache contact ID by email for 30 minutes
- Reduces duplicate API calls for repeat customers

### Rate Limiting

**Google Calendar API**:

- Quota: 1,000,000 requests/day (default)
- Implement request queuing if needed
- Use batch requests for multiple operations

**HubSpot API**:

- Rate limit: 100 requests per 10 seconds
- Implement exponential backoff on rate limit errors
- Queue requests if approaching limit

### Database Optimization

**New Indexes**:

```prisma
@@index([email, createdAt]) // For frequency limit queries
@@index([startTime, status]) // For availability queries
@@index([calendarEventId])
@@index([crmContactId])
```

**Query Optimization**:

- Use date range indexes for availability queries
- Limit result sets with pagination
- Use database connection pooling (already implemented)

## Future Enhancements

### Phase 2 Improvements

1. **Calendar Sync Service**:

   - Background job to sync bookings with manual sync flags
   - Retry failed calendar/CRM operations
   - Scheduled sync verification

2. **Multiple Calendar Support**:

   - Support multiple team members' calendars
   - Round-robin or load-balanced booking assignment
   - Team availability aggregation

3. **Advanced Booking Rules**:

   - Different durations for different inquiry types
   - Priority booking for VIP customers
   - Blackout dates/holidays
   - Custom availability per day of week

4. **Webhook Integration**:

   - Receive calendar change notifications from Google
   - Real-time availability updates
   - Automatic conflict resolution

5. **Analytics Dashboard**:

   - Booking conversion rates
   - Popular time slots
   - Integration health metrics
   - Lead source tracking from HubSpot

6. **Booking Reminders**:

   - Automated email reminders 24 hours before
   - SMS reminders (Twilio integration)
   - Calendar reminder configuration

7. **Rescheduling Support**:

   - Allow users to reschedule bookings
   - Update calendar and CRM automatically
   - Send rescheduling notifications

8. **Admin Dashboard**:
   - View all bookings with sync status
   - Manually trigger sync for failed bookings
   - Override frequency limits
   - Manage business hours and rules

## Summary

This design provides a comprehensive approach to completing the booking system with:

- Google Calendar integration for real-time availability and event management
- HubSpot CRM integration for automatic lead capture
- Available time slots API for user-friendly booking experience
- Robust error handling with graceful degradation
- Production-ready configuration management
- Security best practices for API credentials
- Performance optimization with caching
- Clear deployment and monitoring strategy

The implementation follows existing architectural patterns and integrates seamlessly with the current codebase while maintaining high reliability and user experience standards.
