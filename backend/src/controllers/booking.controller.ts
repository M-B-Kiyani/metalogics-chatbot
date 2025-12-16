import { Request, Response, NextFunction } from "express";
import {
  BookingService,
  CreateBookingDTO,
  UpdateBookingDTO,
} from "../services/booking.service";
import { logger } from "../utils/logger";
import { BookingFilters } from "../dto/booking.dto";
import { BookingStatus } from "@prisma/client";

/**
 * Success response interface
 * Defines the structure of successful API responses
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * BookingController handles HTTP requests for booking management
 * Processes requests, delegates to BookingService, and formats responses
 */
export class BookingController {
  private bookingService: BookingService;

  constructor(bookingService: BookingService) {
    this.bookingService = bookingService;
    logger.info("BookingController initialized");
  }

  /**
   * POST /api/bookings
   * Creates a new booking
   */
  createBooking = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info("Processing createBooking request", {
        body: {
          email: req.body.email,
          company: req.body.company,
        },
      });

      // Request body is already validated by validation middleware
      const bookingData = req.body as CreateBookingDTO;

      const booking = await this.bookingService.createBooking(bookingData);

      const response: SuccessResponse<typeof booking> = {
        success: true,
        data: booking,
        message: "Booking created successfully",
      };

      logger.info("Booking created successfully", {
        bookingId: booking.id,
      });

      res.status(201).json(response);
    } catch (error) {
      logger.error("Error creating booking", {
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  };

  /**
   * GET /api/bookings
   * Retrieves bookings with pagination and filtering
   */
  getBookings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.debug("Processing getBookings request", {
        query: req.query,
      });

      // Query parameters are already validated by validation middleware
      const filters = req.query as unknown as BookingFilters;

      const result = await this.bookingService.getBookings(filters);

      const response: SuccessResponse<typeof result> = {
        success: true,
        data: result,
      };

      logger.debug("Bookings retrieved successfully", {
        count: result.data.length,
        page: result.pagination.page,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error("Error retrieving bookings", {
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  };

  /**
   * GET /api/bookings/:id
   * Retrieves a single booking by ID
   */
  getBookingById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      logger.debug("Processing getBookingById request", {
        bookingId: id,
      });

      const booking = await this.bookingService.getBookingById(id);

      const response: SuccessResponse<typeof booking> = {
        success: true,
        data: booking,
      };

      logger.debug("Booking retrieved successfully", {
        bookingId: id,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error("Error retrieving booking", {
        bookingId: req.params.id,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  };

  /**
   * PUT /api/bookings/:id
   * Updates booking details (inquiry and/or time slot)
   */
  updateBooking = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info("Processing updateBooking request", {
        bookingId: id,
        updates: req.body,
      });

      // Request body is already validated by validation middleware
      const updateData = req.body as UpdateBookingDTO;

      const booking = await this.bookingService.updateBooking(id, updateData);

      const response: SuccessResponse<typeof booking> = {
        success: true,
        data: booking,
        message: "Booking updated successfully",
      };

      logger.info("Booking updated successfully", {
        bookingId: id,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error("Error updating booking", {
        bookingId: req.params.id,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  };

  /**
   * PATCH /api/bookings/:id
   * Updates booking status
   */
  updateBookingStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      logger.info("Processing updateBookingStatus request", {
        bookingId: id,
        status,
      });

      if (!status || !Object.values(BookingStatus).includes(status)) {
        const response = {
          success: false,
          error: {
            statusCode: 400,
            message: "Invalid booking status",
            errorCode: "VALIDATION_ERROR",
            timestamp: new Date().toISOString(),
          },
        };
        res.status(400).json(response);
        return;
      }

      const booking = await this.bookingService.updateBookingStatus(
        id,
        status as BookingStatus
      );

      const response: SuccessResponse<typeof booking> = {
        success: true,
        data: booking,
        message: "Booking status updated successfully",
      };

      logger.info("Booking status updated successfully", {
        bookingId: id,
        status,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error("Error updating booking status", {
        bookingId: req.params.id,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  };

  /**
   * DELETE /api/bookings/:id
   * Cancels a booking
   */
  cancelBooking = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      logger.info("Processing cancelBooking request", {
        bookingId: id,
      });

      const booking = await this.bookingService.cancelBooking(id);

      const response: SuccessResponse<typeof booking> = {
        success: true,
        data: booking,
        message: "Booking cancelled successfully",
      };

      logger.info("Booking cancelled successfully", {
        bookingId: id,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error("Error cancelling booking", {
        bookingId: req.params.id,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  };
}
