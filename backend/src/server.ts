/**
 * Server entry point
 * Initializes database connection, starts Express server, and handles graceful shutdown
 */

import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";
import { createApp } from "./app";
import { retellLLMService } from "./services/retell-llm.service";
import { databaseClient } from "./config/database.client";
import { config } from "./config";
import { logger } from "./utils/logger";
import {
  validateConfigOnStartup,
  printDetailedConfigSummary,
} from "./utils/configValidator";
import { BookingController } from "./controllers/booking.controller";
import { HealthController } from "./controllers/health.controller";
import { AvailableSlotsController } from "./controllers/availableSlots.controller";
import { ConversationController } from "./controllers/conversation.controller";
import { RetellController } from "./controllers/retell.controller";
import { BookingService } from "./services/booking.service";
import { NotificationService } from "./services/notification.service";
import { CalendarService } from "./services/calendar.service";
import { CRMService } from "./services/crm.service";
import { ConversationService } from "./services/conversation.service";
import { VoiceFunctionsService } from "./services/voice-functions.service";
import { BookingRepository } from "./repositories/booking.repository";
import { EmailClient } from "./integrations/email.client";
import { CalendarClient } from "./integrations/calendar.client";
import { HubSpotClient } from "./integrations/hubspot.client";
import { withTimeout } from "./utils/timeout";

// Get configuration
const PORT = config.server.port;
const NODE_ENV = config.server.nodeEnv;
const VERSION = process.env.npm_package_version || "1.0.0";

// Server instance
let server: Server | undefined = undefined;

/**
 * Initialize and start the server
 */
/**
 * Initialize and start the server
 */
async function startServer(): Promise<void> {
  try {
    console.log("SERVER BOOT SEQUENCE STARTED"); // Direct console log for visibility
    logger.info("Starting server initialization", {
      environment: NODE_ENV,
      version: VERSION,
      port: PORT,
    });

    // Validate configuration on startup
    validateConfigOnStartup();

    // Print detailed configuration summary
    printDetailedConfigSummary();

    // Step 1: Initialize application dependencies (BUT DO NOT CONNECT YET)
    logger.info("Initializing application dependencies...");

    // Create repository
    const bookingRepository = new BookingRepository(databaseClient);

    // Create email client and notification service
    const emailClient = new EmailClient();
    const notificationService = new NotificationService(emailClient);

    // Create calendar client and service
    const calendarClient = new CalendarClient();
    const calendarService = new CalendarService(calendarClient);

    // Create HubSpot client and CRM service
    const hubspotClient = new HubSpotClient();
    const crmService = new CRMService(hubspotClient);

    // Get Prisma client for service
    const prismaClient = databaseClient.getClient();

    // Create booking service
    const bookingService = new BookingService(
      bookingRepository,
      notificationService,
      calendarService,
      crmService,
      prismaClient
    );

    // Create conversation service
    const conversationService = new ConversationService(bookingService);

    // Create voice functions service for calendar and CRM access
    const voiceFunctionsService = new VoiceFunctionsService(
      bookingService,
      calendarService,
      crmService
    );

    // Link services to Retell LLM service for voice integration
    retellLLMService.setConversationService(conversationService);
    retellLLMService.setVoiceFunctionsService(voiceFunctionsService);

    // Create controllers
    const bookingController = new BookingController(bookingService);
    const healthController = new HealthController(
      databaseClient,
      calendarClient,
      hubspotClient
    );
    const availableSlotsController = new AvailableSlotsController(
      bookingService
    );
    const conversationController = new ConversationController(
      conversationService
    );
    const retellController = new RetellController(
      conversationService,
      bookingService
    );

    logger.info("Application dependencies initialized");

    // Step 2: Create Express app
    logger.info("Creating Express application...");
    const app = createApp(
      bookingController,
      healthController,
      availableSlotsController,
      conversationController,
      retellController
    );

    // Step 3: Start HTTP server IMMEDIATELY (Before DB Connection)
    // This ensures Railway Healthchecks pass while DB connects in background
    server = app.listen(PORT, "0.0.0.0", () => {
      logger.info("Server started successfully", {
        port: PORT,
        environment: NODE_ENV,
        version: VERSION,
        apiBaseUrl: `http://localhost:${PORT}`,
        healthCheckUrl: `http://localhost:${PORT}/api/health`,
      });
      logger.info("Server is ready to accept connections (DB connecting in background...)");
    });

    // Step 4: Setup WebSocket server
    const wss = new WebSocketServer({ server });
    wss.on("connection", (ws: WebSocket, req) => {
        const parsedUrl = parse(req.url || "", true);
        const pathname = parsedUrl.pathname;
        if (pathname === "/api/retell/llm") {
          const callId = (parsedUrl.query.call_id as string) || `ws-${Date.now()}`;
          retellLLMService.handleConnection(ws, callId);
        } else {
          ws.close(1008, "Unknown path");
        }
    });

    // Step 5: Connect to database (with timeout)
    logger.info("Connecting to database...");
    withTimeout(
      databaseClient.connect(),
      15000, 
      "Database connection timed out after 15s. Check DATABASE_URL and network."
    ).then(() => {
        logger.info("✅ Database connection established");
    }).catch(err => {
      logger.error("❌ Critical: Database connection failed during startup", { error: err.message });
      // We do NOT exit here to keep the server running for logs/healthchecks, 
      // but the app won't function correctly for data.
    });

    // Initialize Google Calendar in background
    if (config.googleCalendar.enabled) {
      calendarClient.initializeFromConfig().catch(err => logger.error("Calendar init failed", err));
    }

    // Initialize HubSpot in background
    if (config.hubspot.enabled) {
      hubspotClient.initializeFromConfig().catch(err => logger.error("HubSpot init failed", err));
    }

    // Handle server errors
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error("Server error occurred", error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error("FATAL STARTUP ERROR:", error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 * Closes database connections and stops the server cleanly
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal} signal, starting graceful shutdown...`);

  // Step 1: Stop accepting new connections
  if (server) {
    logger.info("Closing HTTP server...");
    server.close(() => {
      logger.info("HTTP server closed");
    });

    // Force close after timeout
    setTimeout(() => {
      logger.warn("Forcing server shutdown after timeout");
      if (server && "closeAllConnections" in server) {
        (server as any).closeAllConnections?.();
      }
    }, 10000); // 10 second timeout
  }

  // Step 2: Close database connections
  try {
    logger.info("Closing database connections...");
    await databaseClient.disconnect();
    logger.info("Database connections closed");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Error closing database connections", {
      error: errorMessage,
    });
  }

  logger.info("Graceful shutdown completed");
}

/**
 * Setup process signal handlers for graceful shutdown
 */
function setupSignalHandlers(): void {
  // Handle SIGTERM (e.g., from Docker, Kubernetes)
  process.on("SIGTERM", async () => {
    await gracefulShutdown("SIGTERM");
    process.exit(0);
  });

  // Handle SIGINT (e.g., Ctrl+C)
  process.on("SIGINT", async () => {
    await gracefulShutdown("SIGINT");
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught exception", {
      error: error.message,
      stack: error.stack,
    });
    gracefulShutdown("uncaughtException").then(() => {
      process.exit(1);
    });
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason: any) => {
    logger.error("Unhandled promise rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    gracefulShutdown("unhandledRejection").then(() => {
      process.exit(1);
    });
  });

  logger.debug("Signal handlers configured");
}

// Main execution
if (require.main === module) {
  // Setup signal handlers
  setupSignalHandlers();

  // Start the server
  startServer().catch((error) => {
    logger.error("Fatal error during server startup", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}

// Export for testing
export { startServer, gracefulShutdown };
