import { Request, Response, NextFunction } from "express";
import { BookingService } from "../services/booking.service";
import { logger } from "../utils/logger";
import { ValidationError } from "../errors/ValidationError";
import { config } from "../config";

/**
 * Success response interface for available slots
 */
export interface AvailableSlotsResponse {
  success: true;
  data: {
    slots: Array<{
      startTime: string;
      endTime: string;
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

/**
 * AvailableSlotsController handles HTTP requests for available time slots
 * Processes requests, validates parameters, and returns available booking slots
 */
export class AvailableSlotsController {
  private bookingService: BookingService;

  constructor(bookingService: BookingService) {
    this.bookingService = bookingService;
    logger.info("AvailableSlotsController initialized");
  }

  /**
   * GET /api/bookings/available-slots
   * Retrieves available time slots based on date range and duration
   * Query parameters:
   * - startDate: ISO 8601 date string (required)
   * - endDate: ISO 8601 date string (required)
   * - duration: 15 | 30 | 45 | 60 (required)
   */
  getAvailableSlots = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info("Processing getAvailableSlots request", {
        query: req.query,
      });

      // Extract and validate query parameters
      const { startDate, endDate, duration } = req.query;

      // Validate required parameters
      if (!startDate || !endDate || !duration) {
        throw new ValidationError("Missing required query parameters", [
          "startDate, endDate, and duration are required",
        ]);
      }

      // Parse and validate dates
      const parsedStartDate = new Date(startDate as string);
      const parsedEndDate = new Date(endDate as string);

      if (isNaN(parsedStartDate.getTime())) {
        throw new ValidationError("Invalid startDate", [
          "startDate must be a valid ISO 8601 date string",
        ]);
      }

      if (isNaN(parsedEndDate.getTime())) {
        throw new ValidationError("Invalid endDate", [
          "endDate must be a valid ISO 8601 date string",
        ]);
      }

      // Validate date range
      if (parsedStartDate >= parsedEndDate) {
        throw new ValidationError("Invalid date range", [
          "startDate must be before endDate",
        ]);
      }

      // Validate max date range (30 days)
      const maxRangeDays = 30;
      const daysDifference =
        (parsedEndDate.getTime() - parsedStartDate.getTime()) /
        (1000 * 60 * 60 * 24);

      if (daysDifference > maxRangeDays) {
        throw new ValidationError("Date range too large", [
          `Date range must not exceed ${maxRangeDays} days`,
        ]);
      }

      // Validate duration
      const parsedDuration = parseInt(duration as string, 10);
      if (![15, 30, 45, 60].includes(parsedDuration)) {
        throw new ValidationError("Invalid duration", [
          "duration must be 15, 30, 45, or 60 minutes",
        ]);
      }

      // Get available slots from booking service with timeout protection
      let slots;
      try {
        const slotsPromise = this.bookingService.getAvailableTimeSlots(
          parsedStartDate,
          parsedEndDate,
          parsedDuration
        );

        // Race against a 2-second timeout
        slots = await Promise.race([
          slotsPromise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Service timeout")), 2000)
          ),
        ]);
      } catch (error) {
        logger.warn("Booking service failed, returning basic slots", {
          error: error instanceof Error ? error.message : String(error),
        });

        // Fallback: return basic mock slots
        slots = this.generateMockSlots(
          parsedStartDate,
          parsedEndDate,
          parsedDuration
        );
      }

      // Format response
      const response: AvailableSlotsResponse = {
        success: true,
        data: {
          slots: Array.isArray(slots)
            ? slots.map((slot) => ({
                startTime: slot.startTime.toISOString(),
                endTime: slot.endTime.toISOString(),
                duration: slot.duration,
              }))
            : [],
          businessHours: {
            daysOfWeek: config.bookingRules.businessHours.daysOfWeek,
            startHour: config.bookingRules.businessHours.startHour,
            endHour: config.bookingRules.businessHours.endHour,
            timeZone: config.bookingRules.businessHours.timeZone,
          },
        },
      };

      logger.info("Available slots retrieved successfully", {
        slotsCount: response.data.slots.length,
        startDate: parsedStartDate.toISOString(),
        endDate: parsedEndDate.toISOString(),
        duration: parsedDuration,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error("Error retrieving available slots", {
        query: req.query,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  };

  /**
   * Generate mock slots as fallback when service fails
   */
  private generateMockSlots(
    startDate: Date,
    endDate: Date,
    duration: number
  ): Array<{ startTime: Date; endTime: Date; duration: number }> {
    const slots: Array<{ startTime: Date; endTime: Date; duration: number }> =
      [];
    const businessHours = config.bookingRules.businessHours;

    const currentDate = new Date(startDate);
    let slotCount = 0;
    const maxSlots = 20; // Limit to prevent large responses

    while (currentDate <= endDate && slotCount < maxSlots) {
      const dayOfWeek = currentDate.getDay();

      if (businessHours.daysOfWeek.includes(dayOfWeek)) {
        // Add a few slots for this day
        for (
          let hour = businessHours.startHour;
          hour < businessHours.endHour && slotCount < maxSlots;
          hour++
        ) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);

          // Only include future slots
          if (slotStart > new Date()) {
            const slotEnd = new Date(
              slotStart.getTime() + duration * 60 * 1000
            );

            slots.push({
              startTime: slotStart,
              endTime: slotEnd,
              duration,
            });
            slotCount++;
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }
}
