import { Router } from "express";
import { HealthController } from "../controllers/health.controller";
import { rateLimiter } from "../middleware/rateLimit.middleware";

/**
 * Create health check routes
 * @param healthController - Instance of HealthController
 * @returns Express Router with health check endpoints
 */
export const createHealthRoutes = (
  healthController: HealthController
): Router => {
  const router = Router();

  // Apply rate limiting to health check routes
  router.use(rateLimiter);

  /**
   * @openapi
   * /api/health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Check overall service health
   *     description: Returns the health status of the API service including uptime and version information.
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HealthResponse'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   */
  router.get("/", healthController.checkHealth);

  /**
   * @openapi
   * /api/health/db:
   *   get:
   *     tags:
   *       - Health
   *     summary: Check database health and connectivity
   *     description: Returns database connectivity status, response time, and connection pool statistics.
   *     responses:
   *       200:
   *         description: Database is healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DatabaseHealthResponse'
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       503:
   *         $ref: '#/components/responses/ServiceUnavailable'
   */
  router.get("/db", healthController.checkDatabaseHealth);

  /**
   * @openapi
   * /api/health/calendar:
   *   get:
   *     tags:
   *       - Health
   *     summary: Check Google Calendar integration health
   *     description: Returns Google Calendar service status, authentication status, and response time.
   *     responses:
   *       200:
   *         description: Calendar integration is healthy or disabled
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [healthy, disabled, unavailable, unhealthy]
   *                 authenticated:
   *                   type: boolean
   *                 responseTime:
   *                   type: number
   *                 calendarId:
   *                   type: string
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       503:
   *         $ref: '#/components/responses/ServiceUnavailable'
   */
  router.get("/calendar", healthController.checkCalendarHealth);

  /**
   * @openapi
   * /api/health/crm:
   *   get:
   *     tags:
   *       - Health
   *     summary: Check HubSpot CRM integration health
   *     description: Returns HubSpot CRM service status, authentication status, and response time.
   *     responses:
   *       200:
   *         description: CRM integration is healthy or disabled
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   enum: [healthy, disabled, unavailable, unhealthy]
   *                 authenticated:
   *                   type: boolean
   *                 responseTime:
   *                   type: number
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   *       429:
   *         $ref: '#/components/responses/TooManyRequests'
   *       503:
   *         $ref: '#/components/responses/ServiceUnavailable'
   */
  router.get("/crm", healthController.checkCRMHealth);

  return router;
};
