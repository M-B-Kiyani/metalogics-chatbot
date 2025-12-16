# Requirements Document

## Introduction

This document defines the requirements for completing the Metalogics AI Assistant booking system by implementing critical missing integrations and configurations. The system currently has a functional backend API and frontend UI but lacks Google Calendar integration for availability checking and event creation, HubSpot CRM integration for lead capture, an available time slots API endpoint, and proper production configuration. These components are essential for the booking system to function in a production environment.

## Glossary

- **Booking_System**: The complete application including frontend chatbot, backend API, and external integrations
- **Calendar_Service**: A component that integrates with Google Calendar API to check availability and create calendar events
- **CRM_Service**: A component that integrates with HubSpot CRM API to capture and manage leads
- **Available_Slots_API**: A REST endpoint that returns available time slots based on calendar availability and booking rules
- **Booking_Rules**: Business logic that enforces constraints such as maximum bookings per time window and buffer times
- **Time_Slot**: A specific date and time period with a defined duration (15, 30, 45, or 60 minutes)
- **Calendar_Event**: A scheduled appointment in Google Calendar with attendees, time, and description
- **CRM_Contact**: A lead record in HubSpot containing contact information and booking details
- **Configuration_System**: Environment-based settings for database, email, API keys, and external services
- **Frequency_Limit**: A rule that restricts the maximum number of bookings within a specified time window

## Requirements

### Requirement 1

**User Story:** As a potential client, I want to see only available time slots when booking, so that I don't attempt to book times that are already taken or outside business hours.

#### Acceptance Criteria

1. THE Booking_System SHALL expose a GET endpoint at /api/bookings/available-slots that accepts date range parameters (startDate, endDate, duration)
2. WHEN the Available_Slots_API receives a request, THE Calendar_Service SHALL query Google Calendar for existing events within the specified date range
3. THE Available_Slots_API SHALL calculate available time slots by excluding existing calendar events, non-business hours (9 AM - 5 PM weekdays), and past times
4. THE Available_Slots_API SHALL return a JSON array of available Time_Slots with startTime and endTime for each slot
5. THE Available_Slots_API SHALL respond within 3 seconds for a 7-day date range query

### Requirement 2

**User Story:** As a potential client, I want my booking to automatically create a calendar event, so that the consultation is scheduled and both parties receive calendar invitations.

#### Acceptance Criteria

1. WHEN a booking is successfully created in the database, THE Calendar_Service SHALL create a Calendar_Event in Google Calendar within 5 seconds
2. THE Calendar_Event SHALL include the booking details (client name, company, inquiry), scheduled time, duration, and attendee email addresses
3. THE Calendar_Service SHALL add both the client email and administrator email as attendees to the Calendar_Event
4. IF the Google Calendar API call fails, THEN THE Calendar_Service SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s)
5. IF all retry attempts fail, THEN THE Booking_System SHALL log the error, mark the booking as requiring manual calendar entry, but still return success to the client

### Requirement 3

**User Story:** As a system administrator, I want bookings to automatically create leads in HubSpot CRM, so that I can track and manage potential clients through our sales pipeline.

#### Acceptance Criteria

1. WHEN a booking is successfully created in the database, THE CRM_Service SHALL create or update a CRM_Contact in HubSpot within 5 seconds
2. THE CRM_Contact SHALL include contact information (name, email, company, phone) and custom properties (booking date, inquiry, booking status)
3. THE CRM_Service SHALL check if a contact with the same email already exists and update the existing contact rather than creating a duplicate
4. IF the HubSpot API call fails, THEN THE CRM_Service SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s)
5. IF all retry attempts fail, THEN THE Booking_System SHALL log the error but still return success to the client

### Requirement 4

**User Story:** As a system administrator, I want to enforce booking frequency limits, so that the system prevents abuse and ensures fair access to consultation slots.

#### Acceptance Criteria

1. THE Booking_System SHALL enforce a Frequency_Limit of maximum 2 bookings per email address within a 30-day rolling window
2. WHEN a booking request is received, THE Booking_System SHALL query existing bookings for the same email address within the past 30 days
3. IF the email address has 2 or more bookings in the past 30 days, THEN THE Booking_System SHALL return a 429 status code with an error message indicating the frequency limit
4. THE Booking_System SHALL allow administrators to override frequency limits via an admin API endpoint with authentication
5. THE Frequency_Limit rules SHALL be configurable via environment variables (max bookings count and time window in days)

### Requirement 5

**User Story:** As a system administrator, I want to configure the booking system for production deployment, so that it connects to real services with proper credentials and security settings.

#### Acceptance Criteria

1. THE Configuration_System SHALL validate all required environment variables on application startup and fail fast with clear error messages if any are missing
2. THE Configuration_System SHALL support separate configuration for development, staging, and production environments
3. THE Booking_System SHALL load database credentials from environment variables and establish connection to PostgreSQL database
4. THE Booking_System SHALL load SMTP credentials from environment variables and configure email service for sending notifications
5. THE Booking_System SHALL load API keys for Google Calendar and HubSpot from environment variables and validate their format

### Requirement 6

**User Story:** As a developer, I want to authenticate with Google Calendar API using OAuth 2.0, so that the system can access calendar data securely on behalf of the organization.

#### Acceptance Criteria

1. THE Calendar_Service SHALL authenticate with Google Calendar API using OAuth 2.0 service account credentials
2. THE Calendar_Service SHALL load service account credentials from a JSON file path specified in environment variables
3. THE Calendar_Service SHALL request appropriate OAuth scopes (calendar.events, calendar.readonly) for calendar operations
4. THE Calendar_Service SHALL handle token refresh automatically when access tokens expire
5. IF authentication fails, THEN THE Calendar_Service SHALL log the error with details and throw an authentication error

### Requirement 7

**User Story:** As a developer, I want to authenticate with HubSpot CRM API using an access token, so that the system can create and update contacts securely.

#### Acceptance Criteria

1. THE CRM_Service SHALL authenticate with HubSpot API using a private app access token
2. THE CRM_Service SHALL load the access token from environment variables
3. THE CRM_Service SHALL include the access token in the Authorization header for all HubSpot API requests
4. THE CRM_Service SHALL validate the token format on initialization and fail fast if invalid
5. IF authentication fails with a 401 status, THEN THE CRM_Service SHALL log the error and throw an authentication error

### Requirement 8

**User Story:** As a potential client, I want the system to prevent double-booking, so that I don't schedule a consultation at a time that's already taken.

#### Acceptance Criteria

1. WHEN calculating available slots, THE Available_Slots_API SHALL exclude time slots that overlap with existing Calendar_Events in Google Calendar
2. WHEN creating a booking, THE Booking_System SHALL check both the database and Google Calendar for conflicts before confirming the booking
3. THE Booking_System SHALL consider a conflict to exist if any part of the requested time slot overlaps with an existing booking or calendar event
4. IF a conflict is detected, THEN THE Booking_System SHALL return a 409 status code with details about the conflicting time
5. THE Booking_System SHALL use database transactions to ensure atomicity when checking conflicts and creating bookings

### Requirement 9

**User Story:** As a system administrator, I want the system to respect business hours and buffer times, so that bookings only occur during appropriate times with adequate preparation.

#### Acceptance Criteria

1. THE Available_Slots_API SHALL only return time slots within configured business hours (default: Monday-Friday, 9 AM - 5 PM)
2. THE Available_Slots_API SHALL exclude time slots that are less than 24 hours in the future to allow preparation time
3. THE Available_Slots_API SHALL add a configurable buffer time (default: 15 minutes) between consecutive bookings
4. THE business hours, minimum advance booking time, and buffer time SHALL be configurable via environment variables
5. THE Available_Slots_API SHALL respect timezone settings and return times in the organization's local timezone

### Requirement 10

**User Story:** As a developer, I want comprehensive error handling for external API failures, so that the system degrades gracefully when third-party services are unavailable.

#### Acceptance Criteria

1. WHEN Google Calendar API is unavailable, THE Booking_System SHALL log the error, mark the booking for manual processing, and still allow the booking to be created in the database
2. WHEN HubSpot API is unavailable, THE Booking_System SHALL log the error and still allow the booking to be created without failing the request
3. THE Booking_System SHALL implement circuit breaker pattern for external API calls to prevent cascading failures
4. THE Booking_System SHALL expose health check endpoints that report the status of Google Calendar and HubSpot integrations
5. THE Booking_System SHALL log all external API failures with request/response details for debugging

### Requirement 11

**User Story:** As a system administrator, I want to test the integrations in a development environment, so that I can verify functionality before deploying to production.

#### Acceptance Criteria

1. THE Configuration_System SHALL support a development mode that uses mock implementations of Calendar_Service and CRM_Service
2. WHEN running in development mode, THE Booking_System SHALL log all external API calls without making actual requests
3. THE Booking_System SHALL provide test endpoints for manually triggering calendar and CRM operations
4. THE Booking_System SHALL include example configuration files with placeholder values for all required settings
5. THE Booking_System SHALL provide clear documentation on how to obtain and configure API credentials for Google Calendar and HubSpot

### Requirement 12

**User Story:** As a potential client, I want to update or cancel my booking, so that I can make changes if my schedule changes.

#### Acceptance Criteria

1. WHEN a booking is cancelled via the API, THE Calendar_Service SHALL delete or cancel the corresponding Calendar_Event in Google Calendar
2. WHEN a booking time is updated via the API, THE Calendar_Service SHALL update the corresponding Calendar_Event with the new time
3. WHEN a booking is updated, THE CRM_Service SHALL update the corresponding CRM_Contact in HubSpot with the new information
4. THE Booking_System SHALL send notification emails to both client and administrator when bookings are updated or cancelled
5. IF external API updates fail, THEN THE Booking_System SHALL log the error and mark the booking for manual synchronization
