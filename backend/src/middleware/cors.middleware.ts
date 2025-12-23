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

  // Specific fallback for the user's frontend if not in env
  const knownFrontendUrl = "https://frontend-production-metabot.up.railway.app";

  // Custom domains
  const customDomains = [
    "https://bilal.metalogics.io",
    "https://www.bilal.metalogics.io",
  ];

  logger.info("CORS configuration initialized", {
    allowedOrigins,
    knownFrontendUrl,
    customDomains,
    environment: config.server.nodeEnv,
    credentials: config.cors.credentials,
  });

  const corsOptions: CorsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void
    ) => {
      try {
        logger.info("CORS origin check", { origin });

        // 1. Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) {
          logger.info("CORS: Allowing request with no origin");
          return callback(null, true);
        }

        // 2. Allow file:// protocol for local testing
        if (origin === "null" || origin.startsWith("file://")) {
          logger.info("CORS: Allowing file:// protocol");
          return callback(null, true);
        }

        // 3. Check hardcoded known frontend
        if (origin === knownFrontendUrl) {
          logger.info("CORS: Allowing known frontend URL", { origin });
          return callback(null, true);
        }

        // 4. Check Custom Domains
        if (customDomains.includes(origin)) {
          logger.info("CORS: Allowing custom domain", { origin });
          return callback(null, true);
        }

        // 5. Check Railway Domains (Auto-Discovery) - More permissive
        if (origin.includes(".railway.app")) {
          logger.info("CORS: Allowing Railway domain", { origin });
          return callback(null, true);
        }

        // 6. Check Configured Allowed Origins
        if (allowedOrigins.includes("*")) {
          logger.info("CORS: Allowing all origins (wildcard)", { origin });
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          logger.info("CORS: Allowing configured origin", { origin });
          return callback(null, true);
        }

        // 7. Block everything else
        logger.warn("CORS request blocked", {
          origin,
          allowedOrigins,
          knownFrontendUrl,
          customDomains,
        });
        callback(new Error("Not allowed by CORS"));
      } catch (error) {
        logger.error("CORS middleware error", { error: error.message, origin });
        // Allow the request to proceed to avoid breaking the app
        callback(null, true);
      }
    },
    methods: config.cors.allowedMethods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: true, // Always allow credentials for this app to simplify auth
    maxAge: config.cors.maxAge,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  };

  return cors(corsOptions);
};
