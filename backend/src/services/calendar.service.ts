import { Booking } from "@prisma/client";
import {
  CalendarClient,
  CreateEventData,
  UpdateEventData,
} from "../integrations/calendar.client";
import { logger } from "../utils/logger";
import { config } from "../config";
import {
  addMinutes,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  isBefore,
  isAfter,
  addHours,
  parseISO,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { cacheService, CacheKeys, CacheTTL } from "../utils/cache.service";

/**
 * Time slot interface
 */
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
}

/**
 * Business hours configuration
 */
export interface BusinessHours {
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  startHour: number; // 0-23
  endHour: number; // 0-23
  timeZone: string;
  bufferMinutes: number; // Buffer between bookings
  minAdvanceHours: number; // Minimum hours in advance for booking
  maxAdvanceHours: number; // Maximum hours in advance for booking
}

/**
 * CalendarService handles business logic for calendar operations
 * Coordinates with CalendarClient for Google Calendar API communication
 * Implements availability checking, slot calculation, and event management
 */
export class CalendarService {
  private calendarClient: CalendarClient;
  private businessHours: BusinessHours;

  constructor(calendarClient: CalendarClient) {
    this.calendarClient = calendarClient;

    // Load business hours from configuration
    this.businessHours = {
      daysOfWeek: config.bookingRules.businessHours.daysOfWeek,
      startHour: config.bookingRules.businessHours.startHour,
      endHour: config.bookingRules.businessHours.endHour,
      timeZone: config.bookingRules.businessHours.timeZone,
      bufferMinutes: config.bookingRules.bufferMinutes,
      minAdvanceHours: config.bookingRules.minAdvanceHours,
      maxAdvanceHours: config.bookingRules.maxAdvanceHours,
    };

    logger.info("CalendarService initialized", {
      businessHours: this.businessHours,
    });
  }

  /**
   * Get busy time slots from calendar events
   * Extracts time periods when the calendar is occupied
   * Results are cached for 5 minutes to improve performance
   *
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @returns Array of busy time slots
   */
  async getBusySlots(startDate: Date, endDate: Date): Promise<TimeSlot[]> {
    const cacheKey = CacheKeys.calendarBusySlots(
      startDate.toISOString(),
      endDate.toISOString()
    );

    // Check cache first
    const cachedSlots = cacheService.get<TimeSlot[]>(cacheKey);
    if (cachedSlots) {
      logger.debug("Returning cached busy slots", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        count: cachedSlots.length,
      });
      return cachedSlots;
    }

    logger.info("Getting busy slots from calendar", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    try {
      // Fetch calendar events
      const events = await this.calendarClient.getEvents(startDate, endDate);

      // Filter out cancelled events and extract busy slots
      const busySlots: TimeSlot[] = events
        .filter((event) => event.status !== "cancelled")
        .map((event) => {
          const startTime = parseISO(event.start.dateTime);
          const endTime = parseISO(event.end.dateTime);
          const duration = Math.round(
            (endTime.getTime() - startTime.getTime()) / (1000 * 60)
          );

          return {
            startTime,
            endTime,
            duration,
          };
        });

      // Cache the results
      cacheService.set(cacheKey, busySlots, CacheTTL.CALENDAR_BUSY_SLOTS);

      logger.info("Busy slots retrieved and cached", {
        count: busySlots.length,
      });

      return busySlots;
    } catch (error) {
      logger.error("Failed to get busy slots", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if a specific time slot is available
   * Verifies no conflicts with existing calendar events
   *
   * @param startTime - Slot start time
   * @param duration - Slot duration in minutes
   * @returns true if slot is available, false otherwise
   */
  async isSlotAvailable(startTime: Date, duration: number): Promise<boolean> {
    logger.debug("Checking slot availability", {
      startTime: startTime.toISOString(),
      duration,
    });

    try {
      const endTime = addMinutes(startTime, duration);

      // Get busy slots for the day
      const dayStart = startOfDay(startTime);
      const dayEnd = endOfDay(startTime);
      const busySlots = await this.getBusySlots(dayStart, dayEnd);

      // Check if the requested slot overlaps with any busy slot
      const hasConflict = busySlots.some((busySlot) => {
        // Check for any overlap between requested slot and busy slot
        return (
          (startTime >= busySlot.startTime && startTime < busySlot.endTime) ||
          (endTime > busySlot.startTime && endTime <= busySlot.endTime) ||
          (startTime <= busySlot.startTime && endTime >= busySlot.endTime)
        );
      });

      const isAvailable = !hasConflict;

      logger.debug("Slot availability checked", {
        startTime: startTime.toISOString(),
        duration,
        isAvailable,
      });

      return isAvailable;
    } catch (error) {
      logger.error("Failed to check slot availability", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a calendar event from booking data
   * Generates event with booking details and attendees
   *
   * @param booking - Booking data
   * @returns Calendar event ID
   */
  async createBookingEvent(booking: Booking): Promise<string> {
    logger.info("Creating calendar event for booking", {
      bookingId: booking.id,
      startTime: booking.startTime.toISOString(),
    });

    try {
      const endTime = addMinutes(booking.startTime, booking.duration);

      const eventData: CreateEventData = {
        summary: `Metalogics Consultation - ${booking.company}`,
        description: `📅 Consultation Booking\n\nClient: ${
          booking.name
        }\nCompany: ${booking.company}\nEmail: ${booking.email}\nPhone: ${
          booking.phone || "N/A"
        }\n\nInquiry:\n${booking.inquiry}\n\nBooking ID: ${
          booking.id
        }\n\n---\nThis meeting was scheduled through Metalogics AI Assistant.`,
        startTime: booking.startTime,
        endTime,
        attendees: [booking.email, config.email.adminEmail],
        timeZone: this.businessHours.timeZone,
        location: "metalogics.io",
      };

      const event = await this.calendarClient.createEvent(eventData);

      logger.info("Calendar event created successfully", {
        bookingId: booking.id,
        eventId: event.id,
      });

      return event.id;
    } catch (error) {
      logger.error("Failed to create calendar event", {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   * Modifies event details based on updated booking data
   *
   * @param eventId - Calendar event ID
   * @param booking - Updated booking data
   */
  async updateBookingEvent(eventId: string, booking: Booking): Promise<void> {
    logger.info("Updating calendar event", {
      eventId,
      bookingId: booking.id,
    });

    try {
      const endTime = addMinutes(booking.startTime, booking.duration);

      const updates: UpdateEventData = {
        summary: `Metalogics Consultation - ${booking.company}`,
        description: `📅 Consultation Booking\n\nClient: ${
          booking.name
        }\nCompany: ${booking.company}\nEmail: ${booking.email}\nPhone: ${
          booking.phone || "N/A"
        }\n\nInquiry:\n${booking.inquiry}\n\nBooking ID: ${
          booking.id
        }\n\n---\nThis meeting was scheduled through Metalogics AI Assistant.`,
        startTime: booking.startTime,
        endTime,
        attendees: [booking.email, config.email.adminEmail],
        timeZone: this.businessHours.timeZone,
        location: "metalogics.io",
      };

      await this.calendarClient.updateEvent(eventId, updates);

      logger.info("Calendar event updated successfully", {
        eventId,
        bookingId: booking.id,
      });
    } catch (error) {
      logger.error("Failed to update calendar event", {
        eventId,
        bookingId: booking.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Cancel/delete a calendar event
   * Removes event from calendar and notifies attendees
   *
   * @param eventId - Calendar event ID
   */
  async cancelBookingEvent(eventId: string): Promise<void> {
    logger.info("Cancelling calendar event", {
      eventId,
    });

    try {
      await this.calendarClient.deleteEvent(eventId);

      logger.info("Calendar event cancelled successfully", {
        eventId,
      });
    } catch (error) {
      logger.error("Failed to cancel calendar event", {
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Calculate available time slots based on business hours, buffer time, and busy slots
   * Generates all possible slots and filters out unavailable ones
   * Results are cached for 5 minutes to improve performance
   *
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param duration - Desired slot duration in minutes
   * @param businessHours - Optional business hours override
   * @returns Array of available time slots
   */
  async getAvailableSlots(
    startDate: Date,
    endDate: Date,
    duration: number,
    businessHours?: BusinessHours
  ): Promise<TimeSlot[]> {
    const hours = businessHours || this.businessHours;

    const cacheKey = CacheKeys.availableSlots(
      startDate.toISOString(),
      endDate.toISOString(),
      duration
    );

    // Check cache first
    const cachedSlots = cacheService.get<TimeSlot[]>(cacheKey);
    if (cachedSlots) {
      logger.debug("Returning cached available slots", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration,
        count: cachedSlots.length,
      });
      return cachedSlots;
    }

    logger.info("Calculating available slots", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration,
      businessHours: hours,
    });

    try {
      // Get busy slots from calendar
      const busySlots = await this.getBusySlots(startDate, endDate);

      // Calculate minimum and maximum start times
      const now = new Date();
      const minStartTime = addHours(now, hours.minAdvanceHours);
      const maxStartTime = addHours(now, hours.maxAdvanceHours);

      // Generate all possible time slots within business hours
      const possibleSlots = this.generatePossibleSlots(
        startDate,
        endDate,
        duration,
        hours
      );

      // Filter out slots that are:
      // 1. In the past or too soon (less than minAdvanceHours)
      // 2. Too far in the future (more than maxAdvanceHours)
      // 3. Overlap with busy slots
      // 4. Don't respect buffer time
      const availableSlots = possibleSlots.filter((slot) => {
        // Check if slot is within the allowed advance time window
        if (isBefore(slot.startTime, minStartTime)) {
          return false;
        }

        // Check if slot is not too far in the future
        if (isAfter(slot.startTime, maxStartTime)) {
          return false;
        }

        // Check for conflicts with busy slots (including buffer time)
        const slotWithBuffer = {
          startTime: addMinutes(slot.startTime, -hours.bufferMinutes),
          endTime: addMinutes(slot.endTime, hours.bufferMinutes),
        };

        const hasConflict = busySlots.some((busySlot) => {
          return (
            (slotWithBuffer.startTime >= busySlot.startTime &&
              slotWithBuffer.startTime < busySlot.endTime) ||
            (slotWithBuffer.endTime > busySlot.startTime &&
              slotWithBuffer.endTime <= busySlot.endTime) ||
            (slotWithBuffer.startTime <= busySlot.startTime &&
              slotWithBuffer.endTime >= busySlot.endTime)
          );
        });

        return !hasConflict;
      });

      // Cache the results
      cacheService.set(cacheKey, availableSlots, CacheTTL.AVAILABLE_SLOTS);

      logger.info("Available slots calculated and cached", {
        totalPossibleSlots: possibleSlots.length,
        availableSlots: availableSlots.length,
        busySlots: busySlots.length,
      });

      return availableSlots;
    } catch (error) {
      logger.error("Failed to calculate available slots", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate all possible time slots within business hours
   * Creates slots for each business day in the date range
   *
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param duration - Slot duration in minutes
   * @param hours - Business hours configuration
   * @returns Array of possible time slots
   */
  private generatePossibleSlots(
    startDate: Date,
    endDate: Date,
    duration: number,
    hours: BusinessHours
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const currentDate = new Date(startDate);

    // Iterate through each day in the range
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      // Check if this day is a business day
      if (hours.daysOfWeek.includes(dayOfWeek)) {
        // Generate slots for this business day
        const daySlots = this.generateDaySlots(currentDate, duration, hours);
        slots.push(...daySlots);
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  /**
   * Generate time slots for a single business day
   * Creates slots from start hour to end hour with specified duration
   *
   * @param date - The date to generate slots for
   * @param duration - Slot duration in minutes
   * @param hours - Business hours configuration
   * @returns Array of time slots for the day
   */
  private generateDaySlots(
    date: Date,
    duration: number,
    hours: BusinessHours
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // Convert date to business timezone
    const zonedDate = toZonedTime(date, hours.timeZone);

    // Set to start of business hours
    let currentTime = setMinutes(setHours(zonedDate, hours.startHour), 0);

    // Set end of business hours
    const endTime = setMinutes(setHours(zonedDate, hours.endHour), 0);

    // Generate slots until end of business hours
    while (currentTime < endTime) {
      const slotEndTime = addMinutes(currentTime, duration);

      // Only add slot if it ends before or at business hours end
      if (slotEndTime <= endTime) {
        // Convert back from timezone to UTC
        const slotStart = fromZonedTime(currentTime, hours.timeZone);
        const slotEnd = fromZonedTime(slotEndTime, hours.timeZone);

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          duration,
        });
      }

      // Move to next slot (duration + buffer)
      currentTime = addMinutes(currentTime, duration + hours.bufferMinutes);
    }

    return slots;
  }

  /**
   * Get business hours configuration
   * @returns Current business hours settings
   */
  getBusinessHours(): BusinessHours {
    return { ...this.businessHours };
  }

  /**
   * Set business hours configuration
   * @param hours - New business hours settings
   */
  setBusinessHours(hours: BusinessHours): void {
    this.businessHours = hours;
    logger.info("Business hours updated", { businessHours: hours });
  }
}
