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
    "https://www.bilal.metalogics.io"
  ];
  
  // Explicitly allow all Railway subdomains for this project
  // This Regex allows any https://*.up.railway.app
  const railwayDomainRegex = /^https:\/\/[a-zA-Z0-9-]+\.up\.railway\.app$/;

  logger.info("CORS configuration initialized", {
    allowedOrigins,
    knownFrontendUrl,
    customDomains,
    environment: config.server.nodeEnv,
    credentials: config.cors.credentials
  });

  const corsOptions: CorsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void
    ) => {
      // 1. Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Allow file:// protocol for local testing
      if (origin === "null" || origin.startsWith("file://")) {
        return callback(null, true);
      }

      // 3. Check hardcoded known frontend
      if (origin === knownFrontendUrl) {
         return callback(null, true);
      }
      
      // 4. Check Custom Domains
      if (customDomains.includes(origin)) {
        return callback(null, true);
      }

      // 5. Check Railway Domains (Auto-Discovery)
      if (railwayDomainRegex.test(origin)) {
        return callback(null, true);
      }

      // 5. Check Configured Allowed Origins
      // WARNING: If credentials are set to true (default), Access-Control-Allow-Origin cannot be '*'.
      // If we see '*', we conceptually allow everything by reflecting the origin.
      if (allowedOrigins.includes("*")) {
        // If config says allow all, we allow this specific origin
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 6. Block everything else
      logger.warn("CORS request blocked", {
        origin,
        allowedOrigins,
      });
      callback(new Error("Not allowed by CORS"));
    },
    methods: config.cors.allowedMethods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: true, // Always allow credentials for this app to simplify auth
    maxAge: config.cors.maxAge,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  };

  return cors(corsOptions);
};
