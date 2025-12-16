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
let server: Server | null = null;

/**
 * Initialize and start the server
 */
async function startServer(): Promise<void> {
  try {
    logger.info("Starting server initialization", {
      environment: NODE_ENV,
      version: VERSION,
      port: PORT,
    });

    // Validate configuration on startup
    validateConfigOnStartup();

    // Print detailed configuration summary
    printDetailedConfigSummary();

    // Step 1: Connect to database
    logger.info("Connecting to database...");
    await databaseClient.connect();
    logger.info("Database connection established");

    // Step 2: Initialize dependencies
    logger.info("Initializing application dependencies...");

    // Create repository
    const bookingRepository = new BookingRepository(databaseClient);

    // Create email client and notification service
    const emailClient = new EmailClient();
    const notificationService = new NotificationService(emailClient);

    // Create calendar client and service
    const calendarClient = new CalendarClient();
    const calendarService = new CalendarService(calendarClient);

    // Initialize Google Calendar in background (non-blocking)
    if (config.googleCalendar.enabled) {
      logger.info("Initializing Google Calendar in background...");
      withTimeout(
        calendarClient.initializeFromConfig(),
        5000,
        "Google Calendar initialization timed out"
      )
        .then(() => {
          logger.info("✅ Google Calendar initialized successfully");
        })
        .catch((error) => {
          logger.error("❌ Failed to initialize Google Calendar", {
            error: error instanceof Error ? error.message : String(error),
          });
          logger.warn("⚠️  Calendar integration disabled");
          config.googleCalendar.enabled = false;
        });
    }

    // Create HubSpot client and CRM service
    const hubspotClient = new HubSpotClient();
    const crmService = new CRMService(hubspotClient);

    // Initialize HubSpot in background (non-blocking)
    if (config.hubspot.enabled) {
      logger.info("Initializing HubSpot CRM in background...");
      withTimeout(
        hubspotClient.initializeFromConfig(),
        5000,
        "HubSpot initialization timed out"
      )
        .then(() => {
          logger.info("✅ HubSpot CRM initialized successfully");
        })
        .catch((error) => {
          logger.error("❌ Failed to initialize HubSpot", {
            error: error instanceof Error ? error.message : String(error),
          });
          logger.warn("⚠️  HubSpot integration disabled");
          config.hubspot.enabled = false;
        });
    }

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
    logger.info("Voice integration enabled with calendar and CRM access");

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

    // Step 3: Create Express app
    logger.info("Creating Express application...");
    const app = createApp(
      bookingController,
      healthController,
      availableSlotsController,
      conversationController,
      retellController
    );

    // Step 4: Start HTTP server
    server = app.listen(PORT, () => {
      logger.info("Server started successfully", {
        port: PORT,
        environment: NODE_ENV,
        version: VERSION,
        apiBaseUrl: `http://localhost:${PORT}`,
        healthCheckUrl: `http://localhost:${PORT}/api/health`,
        docsUrl: `http://localhost:${PORT}/api/docs`,
      });

      logger.info("Server is ready to accept connections");
    });

    // Step 5: Setup WebSocket server for Retell custom LLM
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws: WebSocket, req) => {
      const parsedUrl = parse(req.url || "", true);
      const pathname = parsedUrl.pathname;

      logger.info("WebSocket connection attempt", {
        pathname,
        origin: req.headers.origin,
      });

      // Handle Retell LLM WebSocket connections
      if (pathname === "/api/retell/llm") {
        const callId =
          (parsedUrl.query.call_id as string) || `ws-${Date.now()}`;
        logger.info("Retell LLM WebSocket connected", { callId });
        retellLLMService.handleConnection(ws, callId);
      } else {
        logger.warn("Unknown WebSocket path", { pathname });
        ws.close(1008, "Unknown path");
      }
    });

    wss.on("error", (error: Error) => {
      logger.error("WebSocket server error", {
        error: error.message,
        stack: error.stack,
      });
    });

    logger.info("WebSocket server initialized", {
      path: "/api/retell/llm",
    });

    // Handle server errors
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use`, {
          error: error.message,
        });
      } else {
        logger.error("Server error occurred", {
          error: error.message,
          stack: error.stack,
        });
      }
      process.exit(1);
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error("Failed to start server", {
      error: errorMessage,
      stack: errorStack,
    });

    // Cleanup and exit
    await gracefulShutdown("startup_error");
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
      server?.closeAllConnections?.();
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
