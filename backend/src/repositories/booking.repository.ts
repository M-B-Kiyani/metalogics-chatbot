import { PrismaClient, Booking, BookingStatus, Prisma } from "@prisma/client";
import { DatabaseClient } from "../config/database.client";
import { DatabaseError } from "../errors/AppError";
import { RetryService } from "../services/retry.service";
import { logger } from "../utils/logger";

/**
 * Data structure for creating a new booking
 */
export interface CreateBookingData {
  name: string;
  company: string;
  email: string;
  phone?: string;
  inquiry: string;
  startTime: Date;
  duration: number;
}

/**
 * Data structure for updating an existing booking
 */
export interface UpdateBookingData {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  inquiry?: string;
  startTime?: Date;
  duration?: number;
  status?: BookingStatus;
  confirmationSent?: boolean;
  reminderSent?: boolean;
  calendarEventId?: string;
  crmContactId?: string;
  calendarSynced?: boolean;
  crmSynced?: boolean;
  requiresManualCalendarSync?: boolean;
  requiresManualCrmSync?: boolean;
}

/**
 * Filter options for querying bookings
 */
export interface BookingFilters {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  dateFrom?: Date;
  dateTo?: Date;
  email?: string;
}

/**
 * Time slot structure for conflict checking
 */
export interface TimeSlot {
  startTime: Date;
  duration: number;
  excludeBookingId?: string;
}

/**
 * BookingRepository handles all database operations for bookings
 * Implements retry logic for resilience and provides methods for CRUD operations
 */
export class BookingRepository {
  private prisma: PrismaClient;
  private retryService: RetryService;

  constructor(databaseClient: DatabaseClient, retryService?: RetryService) {
    this.prisma = databaseClient.getClient();
    this.retryService = retryService || new RetryService();
  }

  /**
   * Create a new booking record with retry logic
   * @param data - Booking data to create
   * @returns Created booking record
   * @throws DatabaseError if creation fails after retries
   */
  async create(data: CreateBookingData): Promise<Booking> {
    try {
      logger.info("Creating new booking", {
        email: data.email,
        startTime: data.startTime,
      });

      const booking = await this.retryService.withRetry(async () => {
        try {
          return await this.prisma.booking.create({
            data: {
              name: data.name,
              company: data.company,
              email: data.email,
              phone: data.phone,
              inquiry: data.inquiry,
              startTime: data.startTime,
              duration: data.duration,
            },
          });
        } catch (error) {
          logger.error("Database error during booking creation", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw new DatabaseError(
            "Failed to create booking",
            error instanceof Error ? error : undefined
          );
        }
      });

      logger.info("Booking created successfully", {
        bookingId: booking.id,
        email: booking.email,
      });

      return booking;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        "Failed to create booking after retries",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find a booking by its unique ID
   * @param id - Booking ID
   * @returns Booking record or null if not found
   * @throws DatabaseError if query fails
   */
  async findById(id: string): Promise<Booking | null> {
    try {
      logger.debug("Finding booking by ID", { bookingId: id });

      const booking = await this.prisma.booking.findUnique({
        where: { id },
      });

      if (booking) {
        logger.debug("Booking found", { bookingId: id });
      } else {
        logger.debug("Booking not found", { bookingId: id });
      }

      return booking;
    } catch (error) {
      logger.error("Database error during booking lookup", {
        bookingId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new DatabaseError(
        `Failed to find booking with ID ${id}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find multiple bookings with pagination and filtering
   * @param filters - Filter options including pagination, status, date range, and email
   * @returns Array of booking records
   * @throws DatabaseError if query fails
   */
  async findMany(filters: BookingFilters = {}): Promise<Booking[]> {
    try {
      const { page = 1, limit = 10, status, dateFrom, dateTo, email } = filters;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.BookingWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (email) {
        where.email = {
          contains: email,
          mode: "insensitive",
        };
      }

      if (dateFrom || dateTo) {
        where.startTime = {};
        if (dateFrom) {
          where.startTime.gte = dateFrom;
        }
        if (dateTo) {
          where.startTime.lte = dateTo;
        }
      }

      logger.debug("Finding bookings with filters", {
        page,
        limit,
        filters: where,
      });

      const bookings = await this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          startTime: "desc",
        },
      });

      logger.debug("Bookings found", { count: bookings.length });

      return bookings;
    } catch (error) {
      logger.error("Database error during booking search", {
        filters,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new DatabaseError(
        "Failed to find bookings",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update an existing booking
   * @param id - Booking ID
   * @param data - Fields to update
   * @returns Updated booking record
   * @throws DatabaseError if update fails
   */
  async update(id: string, data: UpdateBookingData): Promise<Booking> {
    try {
      logger.info("Updating booking", { bookingId: id, updates: data });

      const booking = await this.prisma.booking.update({
        where: { id },
        data,
      });

      logger.info("Booking updated successfully", { bookingId: id });

      return booking;
    } catch (error) {
      // Check if the error is due to record not found
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        logger.warn("Booking not found for update", { bookingId: id });
        throw new DatabaseError(`Booking with ID ${id} not found`);
      }

      logger.error("Database error during booking update", {
        bookingId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new DatabaseError(
        `Failed to update booking with ID ${id}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete a booking (hard delete)
   * @param id - Booking ID
   * @throws DatabaseError if deletion fails
   */
  async delete(id: string): Promise<void> {
    try {
      logger.info("Deleting booking", { bookingId: id });

      await this.prisma.booking.delete({
        where: { id },
      });

      logger.info("Booking deleted successfully", { bookingId: id });
    } catch (error) {
      // Check if the error is due to record not found
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        logger.warn("Booking not found for deletion", { bookingId: id });
        throw new DatabaseError(`Booking with ID ${id} not found`);
      }

      logger.error("Database error during booking deletion", {
        bookingId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new DatabaseError(
        `Failed to delete booking with ID ${id}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if a time slot conflicts with existing bookings
   * A conflict occurs when a new booking overlaps with an existing booking
   * @param timeSlot - Time slot to check (startTime, duration, optional excludeBookingId)
   * @returns true if conflict exists, false otherwise
   * @throws DatabaseError if query fails
   */
  async checkTimeSlotConflict(timeSlot: TimeSlot): Promise<boolean> {
    try {
      const { startTime, duration, excludeBookingId } = timeSlot;

      // Calculate end time for the requested slot
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      logger.debug("Checking time slot conflict", {
        startTime,
        endTime,
        duration,
        excludeBookingId,
      });

      // Find bookings that overlap with the requested time slot
      // A booking overlaps if:
      // 1. It starts before the requested slot ends AND
      // 2. It ends after the requested slot starts
      const conflictingBookings = await this.prisma.booking.findMany({
        where: {
          AND: [
            // Exclude cancelled bookings from conflict check
            {
              status: {
                notIn: [BookingStatus.CANCELLED],
              },
            },
            // Booking starts before requested slot ends
            {
              startTime: {
                lt: endTime,
              },
            },
            // Booking ends after requested slot starts
            // We need to calculate the end time using a raw query or filter in memory
          ],
          // Exclude the booking being updated (if provided)
          ...(excludeBookingId && {
            id: {
              not: excludeBookingId,
            },
          }),
        },
      });

      // Filter bookings that actually overlap
      // Check if booking end time is after requested start time
      const hasConflict = conflictingBookings.some((booking) => {
        const bookingEndTime = new Date(
          booking.startTime.getTime() + booking.duration * 60 * 1000
        );
        return bookingEndTime > startTime;
      });

      if (hasConflict) {
        logger.warn("Time slot conflict detected", {
          startTime,
          duration,
          conflictingBookings: conflictingBookings.length,
        });
      } else {
        logger.debug("No time slot conflict", { startTime, duration });
      }

      return hasConflict;
    } catch (error) {
      logger.error("Database error during conflict check", {
        timeSlot,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new DatabaseError(
        "Failed to check time slot conflict",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Count total bookings matching the given filters
   * Useful for pagination
   * @param filters - Filter options (status, date range, email)
   * @returns Total count of matching bookings
   * @throws DatabaseError if query fails
   */
  async count(
    filters: Omit<BookingFilters, "page" | "limit"> = {}
  ): Promise<number> {
    try {
      const { status, dateFrom, dateTo, email } = filters;

      // Build where clause
      const where: Prisma.BookingWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (email) {
        where.email = {
          contains: email,
          mode: "insensitive",
        };
      }

      if (dateFrom || dateTo) {
        where.startTime = {};
        if (dateFrom) {
          where.startTime.gte = dateFrom;
        }
        if (dateTo) {
          where.startTime.lte = dateTo;
        }
      }

      const count = await this.prisma.booking.count({
        where,
      });

      logger.debug("Booking count", { count, filters });

      return count;
    } catch (error) {
      logger.error("Database error during booking count", {
        filters,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new DatabaseError(
        "Failed to count bookings",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Count bookings for a specific email within a time window
   * Used for frequency limit checking
   * @param email - Email address to check
   * @param days - Number of days to look back
   * @returns Count of non-cancelled bookings for the email
   * @throws DatabaseError if query fails
   */
  async countByEmailInWindow(email: string, days: number): Promise<number> {
    try {
      const windowStart = new Date();
      windowStart.setDate(windowStart.getDate() - days);

      logger.debug("Counting bookings for email in time window", {
        email,
        days,
        windowStart,
      });

      const count = await this.prisma.booking.count({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
          createdAt: {
            gte: windowStart,
          },
          status: {
            notIn: [BookingStatus.CANCELLED],
          },
        },
      });

      logger.debug("Booking count for email in window", {
        email,
        days,
        count,
      });

      return count;
    } catch (error) {
      logger.error("Database error during email booking count", {
        email,
        days,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new DatabaseError(
        "Failed to count bookings for email",
        error instanceof Error ? error : undefined
      );
    }
  }
}
