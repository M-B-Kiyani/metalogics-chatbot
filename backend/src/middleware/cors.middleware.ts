import cors, { CorsOptions } from "cors";
import { logger } from "../utils/logger";
import { config } from "../config";

/**
 * CORS middleware configuration
 * Configures Cross-Origin Resource Sharing based on environment variables
 */
export const corsMiddleware = () => {
  logger.info("Initializing CORS middleware");

  // Simple and robust CORS configuration
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Log the origin for debugging
      logger.info("CORS request from origin", { origin });

      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow all Railway domains
      if (origin.includes(".railway.app")) {
        logger.info("Allowing Railway domain", { origin });
        return callback(null, true);
      }

      // Allow specific known domains
      const allowedDomains = [
        "https://frontend-production-metabot.up.railway.app",
        "https://bilal.metalogics.io",
        "https://www.bilal.metalogics.io",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
      ];

      if (allowedDomains.includes(origin)) {
        logger.info("Allowing known domain", { origin });
        return callback(null, true);
      }

      // Check config origins (with fallback)
      try {
        const configOrigins = config?.cors?.allowedOrigins || ["*"];
        if (configOrigins.includes("*") || configOrigins.includes(origin)) {
          logger.info("Allowing configured origin", { origin });
          return callback(null, true);
        }
      } catch (error) {
        logger.warn("Error checking config origins, allowing request", {
          error: error.message,
        });
        return callback(null, true);
      }

      // Default: allow the request (permissive for debugging)
      logger.warn("Unknown origin, but allowing for debugging", { origin });
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true,
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200,
  };

  logger.info("CORS middleware configured successfully");
  return cors(corsOptions);
};
