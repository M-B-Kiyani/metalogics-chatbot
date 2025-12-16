import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";
import { validateApiKey } from "../middleware/auth.middleware";
import {
  validateBody,
  validateQuery,
} from "../middleware/validation.middleware";
import { rateLimiter } from "../middleware/rateLimit.middleware";
import {
  createBookingSchema,
  updateBookingSchema,
  bookingFiltersSchema,
  updateBookingStatusSchema,
} from "../dto/booking.dto";

/**
 * Create booking routes with all middleware applied
 * @param bookingController - Instance of BookingController
 * @returns Express Router with booking endpoints
 */
export const createBookingRoutes = (
  bookingController: BookingController
): Router => {
  const router = Router();

  // Apply rate limiting to all booking routes
  router.use(rateLimiter);

  /**
   * @openapi
   * /api/bookings:
   *   post:
   *     tags:
   *       - Bookings
   *     summary: Create a new booking
   *     description: Creates a new consultation booking with the provided details. Validates time slot availability and sends confirmation emails.
   *     security:
   *       - ApiKeyAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateBookingRequest'
   *     responses:
   *       201:
   *         description: Booking created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       409:
   *         $ref: '#/components/responses/Conflict'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       503:
   *         $ref: '#/components/responses/ServiceUnavailable'
   *       504:
   *         $ref: '#/components/responses/GatewayTimeout'
   */
  router.post(
    "/",
    validateApiKey,
    validateBody(createBookingSchema),
    bookingController.createBooking
  );

  /**
   * @openapi
   * /api/bookings:
   *   get:
   *     tags:
   *       - Bookings
   *     summary: Retrieve bookings with pagination and filtering
   *     description: Returns a paginated list of bookings with optional filtering by status, date range, and email.
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of items per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW]
   *         description: Filter by booking status
   *       - in: query
   *         name: dateFrom
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter bookings from this date
   *       - in: query
   *         name: dateTo
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter bookings until this date
   *       - in: query
   *         name: email
   *         schema:
   *           type: string
   *           format: email
   *         description: Filter by client email
   *     responses:
   *       200:
   *         description: Bookings retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedBookingsResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       504:
   *         $ref: '#/components/responses/GatewayTimeout'
   */
  router.get(
    "/",
    validateQuery(bookingFiltersSchema),
    bookingController.getBookings
  );

  /**
   * @openapi
   * /api/bookings/{id}:
   *   get:
   *     tags:
   *       - Bookings
   *     summary: Retrieve a single booking by ID
   *     description: Returns detailed information about a specific booking.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Unique booking identifier
   *     responses:
   *       200:
   *         description: Booking retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       504:
   *         $ref: '#/components/responses/GatewayTimeout'
   */
  router.get("/:id", bookingController.getBookingById);

  /**
   * @openapi
   * /api/bookings/{id}:
   *   put:
   *     tags:
   *       - Bookings
   *     summary: Update booking details
   *     description: Updates booking inquiry and/or time slot. Validates time slot availability for conflicts.
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Unique booking identifier
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateBookingRequest'
   *     responses:
   *       200:
   *         description: Booking updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       409:
   *         $ref: '#/components/responses/Conflict'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       504:
   *         $ref: '#/components/responses/GatewayTimeout'
   */
  router.put(
    "/:id",
    validateApiKey,
    validateBody(updateBookingSchema),
    bookingController.updateBooking
  );

  /**
   * @openapi
   * /api/bookings/{id}:
   *   patch:
   *     tags:
   *       - Bookings
   *     summary: Update booking status
   *     description: Updates the status of a booking and triggers appropriate notifications.
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Unique booking identifier
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateBookingStatusRequest'
   *     responses:
   *       200:
   *         description: Booking status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       504:
   *         $ref: '#/components/responses/GatewayTimeout'
   */
  router.patch(
    "/:id",
    validateApiKey,
    validateBody(updateBookingStatusSchema),
    bookingController.updateBookingStatus
  );

  /**
   * @openapi
   * /api/bookings/{id}:
   *   delete:
   *     tags:
   *       - Bookings
   *     summary: Cancel a booking
   *     description: Cancels a booking by setting its status to CANCELLED and sends cancellation notification emails.
   *     security:
   *       - ApiKeyAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Unique booking identifier
   *     responses:
   *       200:
   *         description: Booking cancelled successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       504:
   *         $ref: '#/components/responses/GatewayTimeout'
   */
  router.delete("/:id", validateApiKey, bookingController.cancelBooking);

  return router;
};
