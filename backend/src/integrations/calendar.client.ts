import { google, calendar_v3 } from "googleapis";
import { JWT } from "google-auth-library";
import { logger } from "../utils/logger";
import { RetryService } from "../services/retry.service";
import { CalendarError, CalendarAuthError } from "../errors/CalendarError";
import { config } from "../config";
import { CircuitBreaker } from "../utils/circuitBreaker";
import * as fs from "fs";

/**
 * Service account credentials structure
 */
export interface ServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
  calendarId: string;
}

/**
 * Calendar event structure
 */
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
  status: "confirmed" | "tentative" | "cancelled";
}

/**
 * Data required to create a calendar event
 */
export interface CreateEventData {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  timeZone: string;
  location?: string;
}

/**
 * Data for updating an existing calendar event
 */
export interface UpdateEventData {
  summary?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  attendees?: string[];
  timeZone?: string;
  location?: string;
}

/**
 * CalendarClient handles Google Calendar API communication
 * Implements authentication, event management, and retry logic
 */
export class CalendarClient {
  private calendar: calendar_v3.Calendar | null = null;
  private auth: JWT | null = null;
  private retryService: RetryService;
  private circuitBreaker: CircuitBreaker;
  private credentials: ServiceAccountCredentials | null = null;
  private initialized: boolean = false;

  constructor() {
    // Configure retry service with calendar-specific settings from config
    this.retryService = new RetryService({
      maxAttempts: config.googleCalendar.retryAttempts,
      initialDelay: config.googleCalendar.retryDelay,
      maxDelay: config.googleCalendar.retryDelay * 4,
      backoffMultiplier: 2,
    });

    // Configure circuit breaker for Google Calendar API
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5, // Open circuit after 5 failures
      resetTimeout: 60000, // Try again after 60 seconds
      monitoringPeriod: 120000, // Monitor failures over 2 minutes
      name: "GoogleCalendarAPI",
    });

    logger.info("CalendarClient instance created");
  }

  /**
   * Initialize the calendar client with service account credentials
   * Loads credentials from file and sets up authentication
   *
   * @param credentials - Service account credentials
   * @throws CalendarAuthError if authentication fails
   */
  async initialize(credentials: ServiceAccountCredentials): Promise<void> {
    try {
      logger.info("Initializing CalendarClient with service account", {
        email: credentials.clientEmail,
        calendarId: credentials.calendarId,
      });

      this.credentials = credentials;

      // Create JWT auth client with service account credentials
      this.auth = new google.auth.JWT({
        email: credentials.clientEmail,
        key: credentials.privateKey,
        scopes: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
        ],
      });

      // Verify authentication by getting access token
      await this.auth.authorize();

      // Initialize calendar API client
      this.calendar = google.calendar({
        version: "v3",
        auth: this.auth,
      });

      this.initialized = true;

      logger.info("CalendarClient initialized successfully", {
        calendarId: credentials.calendarId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to initialize CalendarClient", {
        error: errorMessage,
        email: credentials.clientEmail,
      });

      throw new CalendarAuthError(
        `Failed to authenticate with Google Calendar: ${errorMessage}`
      );
    }
  }

  /**
   * Initialize from configuration file
   * Loads service account key from file path specified in config
   *
   * @throws CalendarAuthError if credentials file is invalid or missing
   */
  async initializeFromConfig(): Promise<void> {
    try {
      const keyPath = config.googleCalendar.serviceAccountKeyPath;

      if (!keyPath) {
        throw new CalendarAuthError(
          "Google Calendar service account key path not configured"
        );
      }

      // Check if file exists
      if (!fs.existsSync(keyPath)) {
        throw new CalendarAuthError(
          `Service account key file not found: ${keyPath}`
        );
      }

      // Read and parse service account key file
      const keyFileContent = fs.readFileSync(keyPath, "utf8");
      const keyData = JSON.parse(keyFileContent);

      if (!keyData.client_email || !keyData.private_key) {
        throw new CalendarAuthError(
          "Invalid service account key file: missing client_email or private_key"
        );
      }

      const credentials: ServiceAccountCredentials = {
        clientEmail: keyData.client_email,
        privateKey: keyData.private_key,
        calendarId: config.googleCalendar.calendarId,
      };

      await this.initialize(credentials);
    } catch (error) {
      if (error instanceof CalendarAuthError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to load service account credentials from file", {
        error: errorMessage,
        keyPath: config.googleCalendar.serviceAccountKeyPath,
      });

      throw new CalendarAuthError(
        `Failed to load service account credentials: ${errorMessage}`
      );
    }
  }

  /**
   * Check if the client is authenticated and ready to use
   *
   * @returns true if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return this.initialized && this.auth !== null && this.calendar !== null;
  }

  /**
   * Ensure the client is initialized before making API calls
   *
   * @throws CalendarAuthError if not initialized
   */
  private ensureInitialized(): void {
    if (!this.isAuthenticated()) {
      throw new CalendarAuthError(
        "CalendarClient not initialized. Call initialize() first."
      );
    }
  }

  /**
   * Get calendar events within a date range
   *
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param calendarId - Calendar ID (defaults to configured calendar)
   * @returns Array of calendar events
   * @throws CalendarError if API call fails
   */
  async getEvents(
    startDate: Date,
    endDate: Date,
    calendarId?: string
  ): Promise<CalendarEvent[]> {
    this.ensureInitialized();

    const targetCalendarId = calendarId || this.credentials!.calendarId;

    try {
      logger.info("Fetching calendar events", {
        calendarId: targetCalendarId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Use circuit breaker and retry service for API call
      const response = await this.circuitBreaker.execute(async () => {
        return await this.retryService.withRetry(async () => {
          if (!this.calendar) {
            throw new CalendarError("Calendar client not initialized");
          }
          const params: calendar_v3.Params$Resource$Events$List = {
            calendarId: targetCalendarId,
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
          };
          return await this.calendar.events.list(params);
        });
      });

      const events = response.data.items || [];

      logger.info("Successfully fetched calendar events", {
        calendarId: targetCalendarId,
        eventCount: events.length,
      });

      // Map Google Calendar events to our CalendarEvent interface
      return events
        .filter((event) => event.start?.dateTime && event.end?.dateTime)
        .map((event) => ({
          id: event.id!,
          summary: event.summary || "Untitled Event",
          description: event.description || undefined,
          start: {
            dateTime: event.start!.dateTime!,
            timeZone: event.start!.timeZone || config.googleCalendar.timeZone,
          },
          end: {
            dateTime: event.end!.dateTime!,
            timeZone: event.end!.timeZone || config.googleCalendar.timeZone,
          },
          attendees: event.attendees?.map((attendee) => ({
            email: attendee.email!,
            responseStatus: attendee.responseStatus || undefined,
          })),
          status:
            (event.status as "confirmed" | "tentative" | "cancelled") ||
            "confirmed",
        }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to fetch calendar events", {
        calendarId: targetCalendarId,
        error: errorMessage,
      });

      throw new CalendarError(
        `Failed to fetch calendar events: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create a new calendar event
   *
   * @param eventData - Event data
   * @param calendarId - Calendar ID (defaults to configured calendar)
   * @returns Created calendar event
   * @throws CalendarError if API call fails
   */
  async createEvent(
    eventData: CreateEventData,
    calendarId?: string
  ): Promise<CalendarEvent> {
    this.ensureInitialized();

    const targetCalendarId = calendarId || this.credentials!.calendarId;

    try {
      logger.info("Creating calendar event", {
        calendarId: targetCalendarId,
        summary: eventData.summary,
        startTime: eventData.startTime.toISOString(),
      });

      // Prepare event data for Google Calendar API
      // Note: Service accounts cannot invite attendees without Domain-Wide Delegation
      // Attendees are stored in description instead
      const attendeesList = eventData.attendees.join(", ");
      const descriptionWithAttendees = `${eventData.description}\n\n📧 Attendees: ${attendeesList}`;

      const event: calendar_v3.Schema$Event = {
        summary: eventData.summary,
        description: descriptionWithAttendees,
        location: eventData.location,
        start: {
          dateTime: eventData.startTime.toISOString(),
          timeZone: eventData.timeZone,
        },
        end: {
          dateTime: eventData.endTime.toISOString(),
          timeZone: eventData.timeZone,
        },
        // Removed attendees field - service accounts need Domain-Wide Delegation to invite
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 24 hours before
            { method: "popup", minutes: 30 }, // 30 minutes before
          ],
        },
      };

      // Use circuit breaker and retry service for API call
      const response = await this.circuitBreaker.execute(async () => {
        return await this.retryService.withRetry(async () => {
          if (!this.calendar) {
            throw new CalendarError("Calendar client not initialized");
          }
          const params: calendar_v3.Params$Resource$Events$Insert = {
            calendarId: targetCalendarId,
            requestBody: event,
            sendUpdates: "none", // Service account cannot send invites without Domain-Wide Delegation
          };
          return await this.calendar.events.insert(params);
        });
      });

      const createdEvent = response.data;

      logger.info("Successfully created calendar event", {
        calendarId: targetCalendarId,
        eventId: createdEvent.id,
        summary: createdEvent.summary,
      });

      return {
        id: createdEvent.id!,
        summary: createdEvent.summary || eventData.summary,
        description: createdEvent.description || undefined,
        start: {
          dateTime: createdEvent.start!.dateTime!,
          timeZone:
            createdEvent.start!.timeZone || config.googleCalendar.timeZone,
        },
        end: {
          dateTime: createdEvent.end!.dateTime!,
          timeZone:
            createdEvent.end!.timeZone || config.googleCalendar.timeZone,
        },
        attendees: createdEvent.attendees?.map((attendee) => ({
          email: attendee.email!,
          responseStatus: attendee.responseStatus || undefined,
        })),
        status:
          (createdEvent.status as "confirmed" | "tentative" | "cancelled") ||
          "confirmed",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to create calendar event", {
        calendarId: targetCalendarId,
        summary: eventData.summary,
        error: errorMessage,
      });

      throw new CalendarError(
        `Failed to create calendar event: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update an existing calendar event
   *
   * @param eventId - Event ID to update
   * @param updates - Event updates
   * @param calendarId - Calendar ID (defaults to configured calendar)
   * @returns Updated calendar event
   * @throws CalendarError if API call fails
   */
  async updateEvent(
    eventId: string,
    updates: UpdateEventData,
    calendarId?: string
  ): Promise<CalendarEvent> {
    this.ensureInitialized();

    const targetCalendarId = calendarId || this.credentials!.calendarId;

    try {
      logger.info("Updating calendar event", {
        calendarId: targetCalendarId,
        eventId,
        updates: Object.keys(updates),
      });

      // First, get the existing event
      const existingEvent = await this.circuitBreaker.execute(async () => {
        return await this.retryService.withRetry(async () => {
          if (!this.calendar) {
            throw new CalendarError("Calendar client not initialized");
          }
          const params: calendar_v3.Params$Resource$Events$Get = {
            calendarId: targetCalendarId,
            eventId,
          };
          return await this.calendar.events.get(params);
        });
      });

      // Prepare updated event data
      const updatedEvent: calendar_v3.Schema$Event = {
        ...existingEvent.data,
        summary: updates.summary || existingEvent.data.summary,
        description: updates.description || existingEvent.data.description,
        location:
          updates.location !== undefined
            ? updates.location
            : existingEvent.data.location,
      };

      if (updates.startTime) {
        updatedEvent.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: updates.timeZone || config.googleCalendar.timeZone,
        };
      }

      if (updates.endTime) {
        updatedEvent.end = {
          dateTime: updates.endTime.toISOString(),
          timeZone: updates.timeZone || config.googleCalendar.timeZone,
        };
      }

      if (updates.attendees) {
        // Service accounts cannot invite attendees without Domain-Wide Delegation
        // Store attendees in description instead
        const attendeesList = updates.attendees.join(", ");
        const baseDescription =
          updates.description || existingEvent.data.description || "";
        updatedEvent.description = `${baseDescription}\n\n📧 Attendees: ${attendeesList}`;
      }

      // Use circuit breaker and retry service for API call
      const response = await this.circuitBreaker.execute(async () => {
        return await this.retryService.withRetry(async () => {
          if (!this.calendar) {
            throw new CalendarError("Calendar client not initialized");
          }
          const params: calendar_v3.Params$Resource$Events$Update = {
            calendarId: targetCalendarId,
            eventId,
            requestBody: updatedEvent,
            sendUpdates: "none", // Service account cannot send invites without Domain-Wide Delegation
          };
          return await this.calendar.events.update(params);
        });
      });

      const updated = response.data;

      logger.info("Successfully updated calendar event", {
        calendarId: targetCalendarId,
        eventId,
      });

      return {
        id: updated.id!,
        summary: updated.summary || "Untitled Event",
        description: updated.description || undefined,
        start: {
          dateTime: updated.start!.dateTime!,
          timeZone: updated.start!.timeZone || config.googleCalendar.timeZone,
        },
        end: {
          dateTime: updated.end!.dateTime!,
          timeZone: updated.end!.timeZone || config.googleCalendar.timeZone,
        },
        attendees: updated.attendees?.map((attendee) => ({
          email: attendee.email!,
          responseStatus: attendee.responseStatus || undefined,
        })),
        status:
          (updated.status as "confirmed" | "tentative" | "cancelled") ||
          "confirmed",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to update calendar event", {
        calendarId: targetCalendarId,
        eventId,
        error: errorMessage,
      });

      throw new CalendarError(
        `Failed to update calendar event: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete/cancel a calendar event
   *
   * @param eventId - Event ID to delete
   * @param calendarId - Calendar ID (defaults to configured calendar)
   * @throws CalendarError if API call fails
   */
  async deleteEvent(eventId: string, calendarId?: string): Promise<void> {
    this.ensureInitialized();

    const targetCalendarId = calendarId || this.credentials!.calendarId;

    try {
      logger.info("Deleting calendar event", {
        calendarId: targetCalendarId,
        eventId,
      });

      // Use circuit breaker and retry service for API call
      await this.circuitBreaker.execute(async () => {
        return await this.retryService.withRetry(async () => {
          if (!this.calendar) {
            throw new CalendarError("Calendar client not initialized");
          }
          const params: calendar_v3.Params$Resource$Events$Delete = {
            calendarId: targetCalendarId,
            eventId,
            sendUpdates: "none", // Service account cannot send invites without Domain-Wide Delegation
          };
          return await this.calendar.events.delete(params);
        });
      });

      logger.info("Successfully deleted calendar event", {
        calendarId: targetCalendarId,
        eventId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to delete calendar event", {
        calendarId: targetCalendarId,
        eventId,
        error: errorMessage,
      });

      throw new CalendarError(
        `Failed to delete calendar event: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get circuit breaker statistics
   * Useful for monitoring and health checks
   *
   * @returns Circuit breaker statistics
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }
}
