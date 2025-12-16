# Implementation Plan

- [x] 1. Update database schema and configuration foundation

  - Run Prisma migration to add new fields to Booking model (calendarEventId, crmContactId, calendarSynced, crmSynced, requiresManualCalendarSync, requiresManualCrmSync)
  - Add indexes for calendarEventId, crmContactId, and composite index for (email, createdAt)
  - Install new dependencies: googleapis, @hubspot/api-client, date-fns
  - Extend configuration schema in config/index.ts to include GoogleCalendarConfig, HubSpotConfig, and BookingRulesConfig
  - Add validation for new environment variables
  - Update .env.example with all new configuration variables
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Implement Google Calendar client integration

  - Create CalendarClient class in integrations/calendar.client.ts
  - Implement initialize() method with service account authentication using googleapis
  - Implement getEvents() method to fetch calendar events within date range
  - Implement createEvent() method to create calendar events with attendees
  - Implement updateEvent() method to modify existing events
  - Implement deleteEvent() method to cancel events
  - Add error handling for authentication failures and API errors
  - Add retry logic using existing RetryService
  - _Requirements: 2.1, 2.2, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Implement Calendar service layer with business logic

  - Create CalendarService class in services/calendar.service.ts
  - Implement getBusySlots() to extract busy time periods from calendar events
  - Implement isSlotAvailable() to check if specific time slot is free
  - Implement createBookingEvent() to create calendar event from booking data
  - Implement updateBookingEvent() to update existing calendar event
  - Implement cancelBookingEvent() to delete calendar event
  - Implement getAvailableSlots() to calculate available time slots based on business hours, buffer time, and busy slots
  - Add timezone handling using date-fns
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4. Implement HubSpot CRM client integration

  - Create HubSpotClient class in integrations/hubspot.client.ts
  - Implement initialize() method with private app access token authentication
  - Implement searchContactByEmail() to find existing contacts
  - Implement createContact() to create new contact with properties
  - Implement updateContact() to update existing contact properties
  - Implement upsertContact() to create or update contact (check if exists first)
  - Add error handling for authentication failures and API errors
  - Add retry logic using existing RetryService
  - _Requirements: 3.1, 3.2, 3.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. Implement CRM service layer with business logic

  - Create CRMService class in services/crm.service.ts
  - Implement syncBookingToContact() to create or update HubSpot contact from booking data
  - Map booking fields to HubSpot contact properties (name, email, company, phone)
  - Add custom properties for booking-specific data (booking date, inquiry, status)
  - Implement updateContactBookingStatus() to update contact when booking status changes
  - Add error handling with graceful degradation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.3_

- [x] 6. Enhance BookingService with frequency limit checking

  - Add checkFrequencyLimit() method to BookingService
  - Implement getBookingCountForEmail() to query bookings by email within time window
  - Add frequency limit validation in createBooking() before conflict checking
  - Throw FrequencyLimitError when limit exceeded
  - Make frequency limit configurable via BookingRulesConfig
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 7. Integrate Calendar and CRM services into booking creation flow

  - Inject CalendarService and CRMService into BookingService constructor
  - Add calendar conflict checking in createBooking() using CalendarService.isSlotAvailable()
  - Call CalendarService.createBookingEvent() after database booking creation (async, non-blocking)
  - Update booking with calendarEventId and calendarSynced flag on success
  - Set requiresManualCalendarSync flag on calendar API failure
  - Call CRMService.syncBookingToContact() after booking creation (async, non-blocking)
  - Update booking with crmContactId and crmSynced flag on success
  - Set requiresManualCrmSync flag on CRM API failure
  - Ensure booking creation succeeds even if external APIs fail
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 3.1, 3.3, 3.4, 3.5, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2_

- [x] 8. Implement available time slots API endpoint

  - Create AvailableSlotsController in controllers/availableSlots.controller.ts
  - Implement getAvailableSlots() handler that accepts startDate, endDate, duration query parameters
  - Validate date range (max 30 days, startDate < endDate)
  - Call BookingService.getAvailableTimeSlots() to get available slots
  - Return formatted response with slots array and business hours info
  - Add error handling for invalid parameters
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [x] 9. Create routes for available slots endpoint

  - Create availableSlots.routes.ts in routes directory
  - Define GET /api/bookings/available-slots route
  - Apply validation middleware for query parameters
  - Apply rate limiting middleware
  - Wire up AvailableSlotsController
  - Mount routes in main app.ts
  - _Requirements: 1.1, 1.5_

- [x] 10. Implement booking update and cancellation with external sync

  - Enhance updateBooking() in BookingService to call CalendarService.updateBookingEvent()
  - Enhance updateBooking() to call CRMService.updateContactBookingStatus()
  - Enhance cancelBooking() to call CalendarService.cancelBookingEvent()
  - Enhance cancelBooking() to call CRMService.updateContactBookingStatus()
  - Handle external API failures gracefully with manual sync flags
  - Update email templates to include calendar event information
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 11. Create error classes for new integration errors

  - Create CalendarError and CalendarAuthError in errors directory
  - Create CRMError and CRMAuthError in errors directory
  - Create FrequencyLimitError in errors directory
  - Update error handler middleware to handle new error types
  - Add appropriate HTTP status codes and error messages
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 12. Implement health check endpoints for integrations

  - Extend HealthController with checkCalendarHealth() method
  - Extend HealthController with checkCRMHealth() method
  - Add routes GET /api/health/calendar and GET /api/health/crm
  - Test authentication and basic connectivity for each service
  - Return status, response time, and any error messages
  - _Requirements: 10.4, 11.1_

- [x] 13. Add circuit breaker pattern for external APIs

  - Create CircuitBreaker utility class in utils directory
  - Implement state management (CLOSED, OPEN, HALF_OPEN)
  - Configure failure threshold and reset timeout
  - Wrap CalendarClient and HubSpotClient calls with circuit breaker
  - Log circuit state changes
  - _Requirements: 10.3, 10.5_

- [x] 14. Update Prisma schema and run migration

  - Update schema.prisma with new Booking model fields
  - Create migration file with npx prisma migrate dev
  - Test migration on development database
  - Document migration steps for production deployment
  - _Requirements: 5.1_

- [x] 15. Create configuration validation and startup checks

  - Add validation for Google Calendar configuration (service account file exists, valid JSON)
  - Add validation for HubSpot configuration (token format)
  - Add validation for business hours configuration (logical values)
  - Implement fail-fast behavior on invalid configuration in production
  - Allow disabled integrations in development mode
  - Print configuration summary on startup
  - _Requirements: 5.1, 5.2, 6.5, 7.4, 11.1, 11.2_

- [x] 16. Create setup documentation and credential guides

  - Document Google Cloud Project setup steps
  - Document service account creation and key download
  - Document calendar sharing with service account
  - Document HubSpot private app creation
  - Document access token generation
  - Create troubleshooting guide for common integration issues
  - Update main README.md with integration setup instructions
  - _Requirements: 11.5_

- [x] 17. Update email templates with calendar information

  - Modify booking confirmation email template to include calendar event details
  - Add instructions for adding event to personal calendar if calendar sync fails
  - Update cancellation email template with calendar cancellation confirmation
  - Update booking update email template with new calendar event details
  - _Requirements: 2.2, 2.3, 12.4_

- [x] 18. Implement caching for performance optimization

  - Install node-cache or similar caching library
  - Implement cache for calendar busy slots (5 minute TTL)
  - Implement cache for available slots API responses (5 minute TTL)
  - Implement cache for HubSpot contact lookups (30 minute TTL)
  - Add cache invalidation on booking creation
  - Add cache statistics to health check endpoint
  - _Requirements: 1.5_

- [x] 19. Update frontend to use available slots API

  - Create API client method in bookingApiService.ts for GET /api/bookings/available-slots
  - Update BookingModal to fetch and display available time slots
  - Replace manual time selection with slot picker UI
  - Add loading state while fetching slots
  - Handle errors when slots API fails
  - Show business hours information to users
  - _Requirements: 1.1, 1.4_

- [x] 20. Create deployment checklist and scripts

  - Create deployment script that validates all prerequisites
  - Create script to test Google Calendar authentication
  - Create script to test HubSpot authentication
  - Document database migration steps
  - Create rollback plan documentation
  - Set up monitoring alerts for integration failures
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]\* 21. Write unit tests for Calendar integration

  - Write unit tests for CalendarClient with mocked googleapis
  - Write unit tests for CalendarService with mocked CalendarClient
  - Test busy slot calculation logic
  - Test available slot generation with various business hours
  - Test buffer time application
  - Test timezone handling
  - _Requirements: 1.1, 2.1, 9.1, 9.5_

- [ ]\* 22. Write unit tests for CRM integration

  - Write unit tests for HubSpotClient with mocked @hubspot/api-client
  - Write unit tests for CRMService with mocked HubSpotClient
  - Test contact upsert logic (create vs update)
  - Test error handling for API failures
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]\* 23. Write unit tests for enhanced BookingService

  - Write unit tests for frequency limit checking
  - Write unit tests for calendar conflict detection
  - Write unit tests for graceful degradation when external APIs fail
  - Test manual sync flag setting on failures
  - Test successful booking with all integrations
  - _Requirements: 4.1, 4.2, 8.2, 10.1, 10.2_

- [ ]\* 24. Write integration tests for available slots endpoint

  - Write integration test for GET /api/bookings/available-slots with valid parameters
  - Test with various date ranges and durations
  - Test error responses for invalid date ranges
  - Test business hours filtering
  - Test that booked slots are excluded
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [ ]\* 25. Write integration tests for booking flow with external APIs
  - Write integration test for booking creation with mocked external APIs
  - Test frequency limit enforcement
  - Test calendar conflict detection
  - Test graceful degradation scenarios
  - Test booking update and cancellation flows
  - _Requirements: 2.1, 2.2, 3.1, 4.1, 8.2, 12.1, 12.2_
