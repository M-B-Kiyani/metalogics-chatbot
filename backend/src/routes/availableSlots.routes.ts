import { Router } from "express";
import { AvailableSlotsController } from "../controllers/availableSlots.controller";
import { validateQuery } from "../middleware/validation.middleware";
import { rateLimiter } from "../middleware/rateLimit.middleware";
import { availableSlotsQuerySchema } from "../dto/booking.dto";

/**
 * Create available slots routes with all middleware applied
 * @param availableSlotsController - Instance of AvailableSlotsController
 * @returns Express Router with available slots endpoints
 */
export const createAvailableSlotsRoutes = (
  availableSlotsController: AvailableSlotsController
): Router => {
  const router = Router();

  // Apply rate limiting to all available slots routes
  router.use(rateLimiter);

  /**
   * @openapi
   * /api/bookings/available-slots:
   *   get:
   *     tags:
   *       - Bookings
   *     summary: Get available time slots
   *     description: Returns available time slots based on calendar availability, business hours, and booking rules. Excludes existing bookings and calendar events.
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date for availability search (ISO 8601 format)
   *         example: "2024-11-20T00:00:00Z"
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date for availability search (ISO 8601 format, max 30 days from startDate)
   *         example: "2024-11-27T00:00:00Z"
   *       - in: query
   *         name: duration
   *         required: true
   *         schema:
   *           type: integer
   *           enum: [15, 30, 45, 60]
   *         description: Duration of the booking slot in minutes
   *         example: 30
   *     responses:
   *       200:
   *         description: Available slots retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     slots:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           startTime:
   *                             type: string
   *                             format: date-time
   *                             example: "2024-11-20T09:00:00Z"
   *                           endTime:
   *                             type: string
   *                             format: date-time
   *                             example: "2024-11-20T09:30:00Z"
   *                           duration:
   *                             type: integer
   *                             example: 30
   *                     businessHours:
   *                       type: object
   *                       properties:
   *                         daysOfWeek:
   *                           type: array
   *                           items:
   *                             type: integer
   *                           example: [1, 2, 3, 4, 5]
   *                         startHour:
   *                           type: integer
   *                           example: 9
   *                         endHour:
   *                           type: integer
   *                           example: 17
   *                         timeZone:
   *                           type: string
   *                           example: "America/New_York"
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       503:
   *         $ref: '#/components/responses/ServiceUnavailable'
   *       504:
   *         $ref: '#/components/responses/GatewayTimeout'
   */
  router.get(
    "/",
    validateQuery(availableSlotsQuerySchema),
    availableSlotsController.getAvailableSlots
  );

  return router;
};
