import { Booking, BookingStatus, PrismaClient } from "@prisma/client";
import {
  BookingRepository,
  CreateBookingData,
  UpdateBookingData,
  BookingFilters,
} from "../repositories/booking.repository";
import { NotificationService } from "./notification.service";
import { CalendarService } from "./calendar.service";
import { CRMService } from "./crm.service";
import { NotFoundError } from "../errors/NotFoundError";
import { ConflictError } from "../errors/ConflictError";
import { ValidationError } from "../errors/ValidationError";
import { FrequencyLimitError } from "../errors/FrequencyLimitError";
import { logger } from "../utils/logger";
import { config } from "../config";
import { cacheService, CacheKeys } from "../utils/cache.service";

/**
 * DTO for creating a booking
 */
export interface CreateBookingDTO {
  name: string;
  company: string;
  email: string;
  phone?: string;
  inquiry: string;
  timeSlot: {
    startTime: Date;
    duration: 15 | 30 | 45 | 60;
  };
}

/**
 * DTO for updating a booking
 */
export interface UpdateBookingDTO {
  inquiry?: string;
  timeSlot?: {
    startTime: Date;
    duration: 15 | 30 | 45 | 60;
  };
}

/**
 * Paginated response for bookings
 */
export interface PaginatedBookings {
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * BookingService handles business logic for booking management
 * Coordinates between repository and notification service
 * Implements validation, conflict checking, and transaction support
 */
export class BookingService {
  private bookingRepository: BookingRepository;
  private notificationService: NotificationService;
  private calendarService: CalendarService;
  private crmService: CRMService;
  // @ts-ignore - Reserved for transaction support in future operations
  private prisma: PrismaClient;

  constructor(
    bookingRepository: BookingRepository,
    notificationService: NotificationService,
    calendarService: CalendarService,
    crmService: CRMService,
    prisma: PrismaClient
  ) {
    this.bookingRepository = bookingRepository;
    this.notificationService = notificationService;
    this.calendarService = calendarService;
    this.crmService = crmService;
    this.prisma = prisma; // Will be used for transaction support in future operations

    logger.info("BookingService initialized");
  }

  /**
   * Creates a new booking with validation, conflict checking, and notifications
   * @param data - Booking creation data
   * @returns Created booking
   * @throws ValidationError if data is invalid
   * @throws FrequencyLimitError if frequency limit is exceeded
   * @throws ConflictError if time slot is already booked
   */
  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    logger.info("Creating booking", {
      email: data.email,
      startTime: data.timeSlot.startTime,
      duration: data.timeSlot.duration,
    });

    // Validate booking data
    this.validateBookingData(data);

    // Check duration-specific frequency limit (only duration-based rules apply)
    await this.checkDurationFrequencyLimit(
      data.email,
      data.timeSlot.startTime,
      data.timeSlot.duration
    );

    // Check calendar availability (if calendar integration is enabled)
    if (config.googleCalendar.enabled) {
      try {
        const isAvailable = await this.calendarService.isSlotAvailable(
          data.timeSlot.startTime,
          data.timeSlot.duration
        );

        if (!isAvailable) {
          logger.warn("Calendar conflict detected", {
            startTime: data.timeSlot.startTime,
            duration: data.timeSlot.duration,
          });
          throw new ConflictError(
            "The selected time slot is already booked in the calendar. Please choose a different time."
          );
        }
      } catch (error) {
        // If calendar check fails, log but continue with database check
        logger.error("Failed to check calendar availability", {
          startTime: data.timeSlot.startTime,
          duration: data.timeSlot.duration,
          error: error instanceof Error ? error.message : String(error),
        });
        // Re-throw ConflictError, but not other errors
        if (error instanceof ConflictError) {
          throw error;
        }
      }
    }

    // Check for time slot conflicts in database
    const hasConflict = await this.bookingRepository.checkTimeSlotConflict({
      startTime: data.timeSlot.startTime,
      duration: data.timeSlot.duration,
    });

    if (hasConflict) {
      logger.warn("Time slot conflict detected in database", {
        startTime: data.timeSlot.startTime,
        duration: data.timeSlot.duration,
      });
      throw new ConflictError(
        "The selected time slot is already booked. Please choose a different time."
      );
    }

    // Create booking data
    const bookingData: CreateBookingData = {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      inquiry: data.inquiry,
      startTime: data.timeSlot.startTime,
      duration: data.timeSlot.duration,
    };

    // Persist booking
    let booking = await this.bookingRepository.create(bookingData);

    // Update status to CONFIRMED immediately after creation
    booking = await this.bookingRepository.update(booking.id, {
      status: BookingStatus.CONFIRMED,
    });

    logger.info("Booking confirmed", {
      bookingId: booking.id,
      status: booking.status,
    });

    // Invalidate cache for calendar and available slots
    this.invalidateBookingCaches();

    // Create calendar event (async, non-blocking)
    if (config.googleCalendar.enabled) {
      // Use setImmediate to ensure this runs after the response is sent
      setImmediate(async () => {
        try {
          logger.info("Starting async calendar event creation", {
            bookingId: booking.id,
          });

          const eventId = await this.calendarService.createBookingEvent(
            booking
          );

          // Update booking with calendar event ID and sync status
          await this.bookingRepository.update(booking.id, {
            calendarEventId: eventId,
            calendarSynced: true,
            requiresManualCalendarSync: false,
          });

          logger.info("Calendar event created and booking updated", {
            bookingId: booking.id,
            eventId,
          });
        } catch (error) {
          // Mark booking as requiring manual calendar sync
          logger.error("Failed to create calendar event - detailed error", {
            bookingId: booking.id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            errorType:
              error instanceof Error ? error.constructor.name : typeof error,
          });

          try {
            await this.bookingRepository.update(booking.id, {
              requiresManualCalendarSync: true,
              calendarSynced: false,
            });
          } catch (updateError) {
            logger.error("Failed to update booking after calendar error", {
              bookingId: booking.id,
              updateError:
                updateError instanceof Error
                  ? updateError.message
                  : String(updateError),
            });
          }
        }
      });
    }

    // Sync to CRM (async, non-blocking)
    if (config.hubspot.enabled) {
      // Use setImmediate to ensure this runs after the response is sent
      setImmediate(async () => {
        try {
          logger.info("Starting async CRM contact sync", {
            bookingId: booking.id,
          });

          const contactId = await this.crmService.syncBookingToContact(booking);

          // Update booking with CRM contact ID and sync status
          await this.bookingRepository.update(booking.id, {
            crmContactId: contactId,
            crmSynced: true,
            requiresManualCrmSync: false,
          });

          logger.info("CRM contact synced and booking updated", {
            bookingId: booking.id,
            contactId,
          });
        } catch (error) {
          // Mark booking as requiring manual CRM sync
          logger.error("Failed to sync to CRM - detailed error", {
            bookingId: booking.id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            errorType:
              error instanceof Error ? error.constructor.name : typeof error,
          });

          try {
            await this.bookingRepository.update(booking.id, {
              requiresManualCrmSync: true,
              crmSynced: false,
            });
          } catch (updateError) {
            logger.error("Failed to update booking after CRM error", {
              bookingId: booking.id,
              updateError:
                updateError instanceof Error
                  ? updateError.message
                  : String(updateError),
            });
          }
        }
      });
    }

    // Trigger notifications (non-blocking)
    this.notificationService.sendBookingConfirmation(booking).catch((error) => {
      logger.error("Failed to send booking confirmation", {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    // Update confirmation sent flag
    await this.bookingRepository.update(booking.id, {
      confirmationSent: true,
    });

    logger.info("Booking created successfully", {
      bookingId: booking.id,
      email: booking.email,
    });

    return booking;
  }

  /**
   * Retrieves bookings with pagination and filtering
   * @param filters - Filter options
   * @returns Paginated bookings
   */
  async getBookings(filters: BookingFilters = {}): Promise<PaginatedBookings> {
    logger.debug("Retrieving bookings", { filters });

    const { page = 1, limit = 10 } = filters;

    // Get bookings
    const bookings = await this.bookingRepository.findMany(filters);

    // Get total count for pagination
    const total = await this.bookingRepository.count({
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      email: filters.email,
    });

    const totalPages = Math.ceil(total / limit);

    logger.debug("Bookings retrieved", {
      count: bookings.length,
      total,
      page,
      totalPages,
    });

    return {
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a single booking by ID
   * @param id - Booking ID
   * @returns Booking
   * @throws NotFoundError if booking doesn't exist
   */
  async getBookingById(id: string): Promise<Booking> {
    logger.debug("Retrieving booking by ID", { bookingId: id });

    const booking = await this.bookingRepository.findById(id);

    if (!booking) {
      logger.warn("Booking not found", { bookingId: id });
      throw new NotFoundError("Booking");
    }

    logger.debug("Booking retrieved", { bookingId: id });

    return booking;
  }

  /**
   * Updates a booking with validation and conflict checking
   * @param id - Booking ID
   * @param data - Update data
   * @returns Updated booking
   * @throws NotFoundError if booking doesn't exist
   * @throws ConflictError if new time slot conflicts
   */
  async updateBooking(id: string, data: UpdateBookingDTO): Promise<Booking> {
    logger.info("Updating booking", { bookingId: id, updates: data });

    // Check if booking exists (throws NotFoundError if not)
    const existingBooking = await this.getBookingById(id);

    // If time slot is being updated, check for conflicts
    if (data.timeSlot) {
      const hasConflict = await this.bookingRepository.checkTimeSlotConflict({
        startTime: data.timeSlot.startTime,
        duration: data.timeSlot.duration,
        excludeBookingId: id,
      });

      if (hasConflict) {
        logger.warn("Time slot conflict detected for update", {
          bookingId: id,
          startTime: data.timeSlot.startTime,
          duration: data.timeSlot.duration,
        });
        throw new ConflictError(
          "The selected time slot is already booked. Please choose a different time."
        );
      }
    }

    // Prepare update data
    const updateData: UpdateBookingData = {};

    if (data.inquiry !== undefined) {
      updateData.inquiry = data.inquiry;
    }

    if (data.timeSlot) {
      updateData.startTime = data.timeSlot.startTime;
      updateData.duration = data.timeSlot.duration;
    }

    // Update booking
    const updatedBooking = await this.bookingRepository.update(id, updateData);

    // Invalidate cache for calendar and available slots
    this.invalidateBookingCaches();

    // Update calendar event if it exists (async, non-blocking)
    if (
      config.googleCalendar.enabled &&
      existingBooking.calendarEventId &&
      existingBooking.calendarSynced
    ) {
      this.calendarService
        .updateBookingEvent(existingBooking.calendarEventId, updatedBooking)
        .then(async () => {
          logger.info("Calendar event updated successfully", {
            bookingId: id,
            eventId: existingBooking.calendarEventId,
          });
        })
        .catch(async (error) => {
          // Mark booking as requiring manual calendar sync
          await this.bookingRepository.update(id, {
            requiresManualCalendarSync: true,
          });
          logger.error("Failed to update calendar event", {
            bookingId: id,
            eventId: existingBooking.calendarEventId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }

    // Update CRM contact (async, non-blocking)
    if (config.hubspot.enabled) {
      this.crmService
        .updateContactBookingStatus(
          updatedBooking.email,
          updatedBooking.id,
          updatedBooking.status
        )
        .then(() => {
          logger.info("CRM contact updated successfully", {
            bookingId: id,
            email: updatedBooking.email,
          });
        })
        .catch(async (error) => {
          // Mark booking as requiring manual CRM sync
          await this.bookingRepository.update(id, {
            requiresManualCrmSync: true,
          });
          logger.error("Failed to update CRM contact", {
            bookingId: id,
            email: updatedBooking.email,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }

    // Send update notification (non-blocking)
    this.notificationService
      .sendBookingUpdate(updatedBooking)
      .catch((error) => {
        logger.error("Failed to send booking update notification", {
          bookingId: id,
          error: error instanceof Error ? error.message : String(error),
        });
      });

    logger.info("Booking updated successfully", { bookingId: id });

    return updatedBooking;
  }

  /**
   * Updates booking status and triggers status-change notifications
   * @param id - Booking ID
   * @param status - New status
   * @returns Updated booking
   * @throws NotFoundError if booking doesn't exist
   */
  async updateBookingStatus(
    id: string,
    status: BookingStatus
  ): Promise<Booking> {
    logger.info("Updating booking status", { bookingId: id, status });

    // Check if booking exists
    await this.getBookingById(id);

    // Update status
    const updatedBooking = await this.bookingRepository.update(id, { status });

    // Send status-change notification based on new status
    if (status === BookingStatus.CANCELLED) {
      this.notificationService
        .sendCancellationNotification(updatedBooking)
        .catch((error) => {
          logger.error("Failed to send cancellation notification", {
            bookingId: id,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    } else {
      this.notificationService
        .sendBookingUpdate(updatedBooking)
        .catch((error) => {
          logger.error("Failed to send status update notification", {
            bookingId: id,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }

    logger.info("Booking status updated successfully", {
      bookingId: id,
      status,
    });

    return updatedBooking;
  }

  /**
   * Cancels a booking and sends cancellation notification
   * @param id - Booking ID
   * @returns Cancelled booking
   * @throws NotFoundError if booking doesn't exist
   */
  async cancelBooking(id: string): Promise<Booking> {
    logger.info("Cancelling booking", { bookingId: id });

    // Get booking before cancellation to access calendar event ID
    const existingBooking = await this.getBookingById(id);

    // Use updateBookingStatus to handle cancellation
    const cancelledBooking = await this.updateBookingStatus(
      id,
      BookingStatus.CANCELLED
    );

    // Invalidate cache for calendar and available slots
    this.invalidateBookingCaches();

    // Cancel calendar event if it exists (async, non-blocking)
    if (
      config.googleCalendar.enabled &&
      existingBooking.calendarEventId &&
      existingBooking.calendarSynced
    ) {
      this.calendarService
        .cancelBookingEvent(existingBooking.calendarEventId)
        .then(() => {
          logger.info("Calendar event cancelled successfully", {
            bookingId: id,
            eventId: existingBooking.calendarEventId,
          });
        })
        .catch(async (error) => {
          // Mark booking as requiring manual calendar sync
          await this.bookingRepository.update(id, {
            requiresManualCalendarSync: true,
          });
          logger.error("Failed to cancel calendar event", {
            bookingId: id,
            eventId: existingBooking.calendarEventId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }

    // Update CRM contact with cancellation status (async, non-blocking)
    if (config.hubspot.enabled) {
      this.crmService
        .updateContactBookingStatus(
          cancelledBooking.email,
          cancelledBooking.id,
          BookingStatus.CANCELLED
        )
        .then(() => {
          logger.info("CRM contact updated with cancellation", {
            bookingId: id,
            email: cancelledBooking.email,
          });
        })
        .catch(async (error) => {
          // Mark booking as requiring manual CRM sync
          await this.bookingRepository.update(id, {
            requiresManualCrmSync: true,
          });
          logger.error("Failed to update CRM contact with cancellation", {
            bookingId: id,
            email: cancelledBooking.email,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }

    logger.info("Booking cancelled successfully", { bookingId: id });

    return cancelledBooking;
  }

  /**
   * Validates booking data
   * @param data - Booking data to validate
   * @throws ValidationError if validation fails
   */
  private validateBookingData(data: CreateBookingDTO): void {
    const errors: string[] = [];

    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      errors.push("Name is required");
    }

    if (!data.company || data.company.trim().length === 0) {
      errors.push("Company is required");
    }

    if (!data.email || data.email.trim().length === 0) {
      errors.push("Email is required");
    } else if (!this.isValidEmail(data.email)) {
      errors.push("Invalid email format");
    }

    if (!data.inquiry || data.inquiry.trim().length === 0) {
      errors.push("Inquiry is required");
    }

    // Validate time slot
    if (!data.timeSlot) {
      errors.push("Time slot is required");
    } else {
      if (!data.timeSlot.startTime) {
        errors.push("Start time is required");
      } else {
        const startTime = new Date(data.timeSlot.startTime);
        const now = new Date();

        if (isNaN(startTime.getTime())) {
          errors.push("Invalid start time");
        } else if (startTime < now) {
          errors.push("Start time must be in the future");
        }
      }

      if (!data.timeSlot.duration) {
        errors.push("Duration is required");
      } else if (![15, 30, 45, 60].includes(data.timeSlot.duration)) {
        errors.push("Duration must be 15, 30, 45, or 60 minutes");
      }
    }

    // Validate phone if provided
    if (data.phone && data.phone.trim().length > 0) {
      if (!this.isValidPhone(data.phone)) {
        errors.push("Invalid phone format");
      }
    }

    if (errors.length > 0) {
      logger.warn("Booking validation failed", { errors });
      throw new ValidationError("Booking validation failed", errors);
    }
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates phone format (basic validation)
   */
  private isValidPhone(phone: string): boolean {
    // Remove common formatting characters
    const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    // Check if it's a valid phone number (10-15 digits, optionally starting with +)
    const phoneRegex = /^\+?\d{10,15}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Check if an email has exceeded the frequency limit for bookings
   * @param email - Email address to check
   * @throws FrequencyLimitError if limit is exceeded
   */
  async checkFrequencyLimit(email: string): Promise<void> {
    const maxBookings = config.bookingRules.maxBookingsPerEmail;
    const windowDays = config.bookingRules.frequencyWindowDays;

    logger.debug("Checking frequency limit", {
      email,
      maxBookings,
      windowDays,
    });

    const bookingCount = await this.getBookingCountForEmail(email, windowDays);

    if (bookingCount >= maxBookings) {
      logger.warn("Frequency limit exceeded", {
        email,
        bookingCount,
        maxBookings,
        windowDays,
      });
      throw new FrequencyLimitError(maxBookings, windowDays);
    }

    logger.debug("Frequency limit check passed", {
      email,
      bookingCount,
      maxBookings,
    });
  }

  /**
   * Check if an email has exceeded the duration-specific frequency limit
   * @param email - Email address to check
   * @param startTime - Proposed booking start time
   * @param duration - Booking duration in minutes
   * @throws FrequencyLimitError if duration-specific limit is exceeded
   */
  async checkDurationFrequencyLimit(
    email: string,
    startTime: Date,
    duration: 15 | 30 | 45 | 60
  ): Promise<void> {
    // Find the rule for this duration
    const rule = config.bookingRules.durationRules.find(
      (r) => r.duration === duration
    );

    if (!rule) {
      logger.warn("No frequency rule found for duration", { duration });
      return;
    }

    logger.debug("Checking duration-specific frequency limit", {
      email,
      duration,
      maxBookings: rule.maxBookings,
      windowMinutes: rule.windowMinutes,
    });

    // Calculate the rolling window
    const windowStart = new Date(
      startTime.getTime() - rule.windowMinutes * 60 * 1000
    );
    const windowEnd = new Date(
      startTime.getTime() + rule.windowMinutes * 60 * 1000
    );

    // Get bookings in the rolling window for this email and duration
    const bookings = await this.bookingRepository.findMany({
      email,
      dateFrom: windowStart,
      dateTo: windowEnd,
      limit: 1000,
    });

    // Filter bookings by duration and exclude cancelled ones
    const matchingBookings = bookings.filter(
      (booking) =>
        booking.duration === duration && booking.status !== "CANCELLED"
    );

    const bookingCount = matchingBookings.length;

    if (bookingCount >= rule.maxBookings) {
      logger.warn("Duration-specific frequency limit exceeded", {
        email,
        duration,
        bookingCount,
        maxBookings: rule.maxBookings,
        windowMinutes: rule.windowMinutes,
        windowStart,
        windowEnd,
      });
      throw new FrequencyLimitError(
        rule.maxBookings,
        undefined,
        rule.windowMinutes,
        duration
      );
    }

    logger.debug("Duration-specific frequency limit check passed", {
      email,
      duration,
      bookingCount,
      maxBookings: rule.maxBookings,
    });
  }

  /**
   * Get the count of bookings for an email within a time window
   * @param email - Email address to check
   * @param days - Number of days to look back
   * @returns Count of non-cancelled bookings
   */
  async getBookingCountForEmail(email: string, days: number): Promise<number> {
    logger.debug("Getting booking count for email", { email, days });

    const count = await this.bookingRepository.countByEmailInWindow(
      email,
      days
    );

    logger.debug("Booking count retrieved", { email, days, count });

    return count;
  }

  /**
   * Get available time slots based on calendar availability and business rules
   * Combines calendar busy slots with database bookings to calculate availability
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param duration - Desired slot duration in minutes
   * @returns Array of available time slots
   */
  async getAvailableTimeSlots(
    startDate: Date,
    endDate: Date,
    duration: number
  ): Promise<Array<{ startTime: Date; endTime: Date; duration: number }>> {
    logger.info("Getting available time slots", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration,
    });

    // Get available slots from calendar service (if enabled)
    let availableSlots: Array<{
      startTime: Date;
      endTime: Date;
      duration: number;
    }> = [];

    if (config.googleCalendar.enabled) {
      try {
        availableSlots = await this.calendarService.getAvailableSlots(
          startDate,
          endDate,
          duration
        );
      } catch (error) {
        logger.error("Failed to get available slots from calendar", {
          error: error instanceof Error ? error.message : String(error),
        });
        // If calendar service fails, return empty array or throw error
        throw error;
      }
    } else {
      // If calendar is not enabled, generate slots based on business hours only
      // and filter by database bookings
      const businessHours = this.calendarService.getBusinessHours();
      availableSlots = await this.calendarService.getAvailableSlots(
        startDate,
        endDate,
        duration,
        businessHours
      );
    }

    // Get database bookings in the date range to double-check availability
    const bookings = await this.bookingRepository.findMany({
      dateFrom: startDate,
      dateTo: endDate,
      limit: 1000, // Large limit to get all bookings in range
    });

    // Filter out slots that conflict with database bookings
    const finalAvailableSlots = availableSlots.filter((slot) => {
      const hasConflict = bookings.some((booking) => {
        if (booking.status === "CANCELLED") {
          return false;
        }

        const bookingEndTime = new Date(
          booking.startTime.getTime() + booking.duration * 60 * 1000
        );

        // Check for overlap
        return (
          (slot.startTime >= booking.startTime &&
            slot.startTime < bookingEndTime) ||
          (slot.endTime > booking.startTime &&
            slot.endTime <= bookingEndTime) ||
          (slot.startTime <= booking.startTime &&
            slot.endTime >= bookingEndTime)
        );
      });

      return !hasConflict;
    });

    logger.info("Available time slots calculated", {
      totalSlots: availableSlots.length,
      availableAfterDbFilter: finalAvailableSlots.length,
      databaseBookings: bookings.length,
    });

    return finalAvailableSlots;
  }

  /**
   * Invalidate all booking-related caches
   * Called when a booking is created, updated, or cancelled
   * Clears calendar busy slots and available slots caches
   */
  private invalidateBookingCaches(): void {
    logger.debug("Invalidating booking-related caches");

    // Invalidate all calendar and slots caches
    const deletedCalendar = cacheService.delPattern(
      CacheKeys.patterns.calendar
    );
    const deletedSlots = cacheService.delPattern(CacheKeys.patterns.slots);

    logger.info("Booking caches invalidated", {
      calendarCachesCleared: deletedCalendar,
      slotsCachesCleared: deletedSlots,
    });
  }
}
