import cors, { CorsOptions } from "cors";
import { logger } from "../utils/logger";
import { config } from "../config";

/**
 * CORS middleware configuration
 * Configures Cross-Origin Resource Sharing based on environment variables
 *
 * Configuration from environment variables:
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins
 */
export const corsMiddleware = () => {
  // Get allowed origins from configuration
  const allowedOrigins = config.cors.allowedOrigins;

  logger.info("CORS configuration initialized", {
    allowedOrigins,
    environment: config.server.nodeEnv,
  });

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl requests, or file:// protocol)
      if (!origin) {
        return callback(null, true);
      }

      // Allow file:// protocol for local testing
      if (origin === "null" || origin.startsWith("file://")) {
        return callback(null, true);
      }

      // Check if the origin is in the allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn("CORS request blocked", {
          origin,
          allowedOrigins,
        });
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: config.cors.allowedMethods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: config.cors.credentials,
    maxAge: config.cors.maxAge, // Cache preflight requests
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  };

  return cors(corsOptions);
};
