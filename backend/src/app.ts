import express, { Application, Request, Response } from "express";
import { BookingController } from "./controllers/booking.controller";
import { HealthController } from "./controllers/health.controller";
import { AvailableSlotsController } from "./controllers/availableSlots.controller";
import { ConversationController } from "./controllers/conversation.controller";
import {
  createBookingRoutes,
  createHealthRoutes,
  createDocsRoutes,
  createAvailableSlotsRoutes,
  createRetellRoutes,
} from "./routes";
import { RetellController } from "./controllers/retell.controller";
import { createConversationRoutes } from "./routes/conversation.routes";
import {
  errorHandler,
  corsMiddleware,
  requestLogger,
  requestTimeout,
  sanitizeInput,
} from "./middleware";
import { logger } from "./utils/logger";

/**
 * Create and configure Express application with middleware stack and routes
 * @param bookingController - Instance of BookingController
 * @param healthController - Instance of HealthController
 * @param availableSlotsController - Instance of AvailableSlotsController
 * @param conversationController - Instance of ConversationController
 * @param retellController - Instance of RetellController
 * @returns Configured Express application
 */
export const createApp = (
  bookingController: BookingController,
  healthController: HealthController,
  availableSlotsController: AvailableSlotsController,
  conversationController: ConversationController,
  retellController: RetellController
): Application => {
  const app = express();

  logger.info("Initializing Express application");

  // ============================================
  // Middleware Stack (order is important!)
  // ============================================

  // 1. CORS - Must be first to handle preflight requests
  app.use(corsMiddleware());
  logger.debug("CORS middleware configured");

  // 2. Request logging - Log all incoming requests
  app.use(requestLogger);
  logger.debug("Request logging middleware configured");

  // 3. Body parser - Parse JSON request bodies
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  logger.debug("Body parser middleware configured");

  // 4. Input sanitization - Prevent XSS attacks
  app.use(sanitizeInput);
  logger.debug("Input sanitization middleware configured");

  // 5. Request timeout - Ensure requests complete within time limit
  app.use(requestTimeout);
  logger.debug("Request timeout middleware configured");

  // Note: Rate limiting is applied per-route in the route handlers
  // to allow different limits for different endpoints if needed

  // ============================================
  // API Routes
  // ============================================

  // Create route instances
  const bookingRoutes = createBookingRoutes(bookingController);
  const healthRoutes = createHealthRoutes(healthController);
  const docsRoutes = createDocsRoutes();
  const availableSlotsRoutes = createAvailableSlotsRoutes(
    availableSlotsController
  );
  const conversationRoutes = createConversationRoutes(conversationController);
  const retellRoutes = createRetellRoutes(retellController);

  // Mount routes with /api prefix
  // Note: More specific routes must come before general routes
  app.use("/api/bookings/available-slots", availableSlotsRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/health", healthRoutes);
  app.use("/api/docs", docsRoutes);
  app.use("/api/chat", conversationRoutes);
  app.use("/api/retell", retellRoutes);

  logger.info("Routes mounted successfully", {
    bookingRoutes: "/api/bookings",
    availableSlotsRoutes: "/api/bookings/available-slots",
    healthRoutes: "/api/health",
    docsRoutes: "/api/docs",
    chatRoutes: "/api/chat",
    retellRoutes: "/api/retell",
  });

  // ============================================
  // Error Handling
  // ============================================

  // 404 handler for undefined routes
  app.use((req: Request, res: Response) => {
    logger.warn("Route not found", {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    res.status(404).json({
      success: false,
      error: {
        statusCode: 404,
        message: `Route ${req.method} ${req.path} not found`,
        errorCode: "ROUTE_NOT_FOUND",
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Error handler middleware (must be last)
  app.use(errorHandler);
  logger.debug("Error handler middleware configured");

  logger.info("Express application configured successfully");

  return app;
};
