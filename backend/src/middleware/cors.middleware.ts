import cors, { CorsOptions } from "cors";
import { config, isProduction } from "../config";

/**
 * CORS middleware configuration
 * Railway-compatible configuration with correct backend URL
 */
export const corsMiddleware = () => {
  console.log("Initializing CORS middleware for Railway deployment");

  // Allow specific origins from config
  const allowedOrigins = config.cors.allowedOrigins;

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // 1. Allow all Railway domains dynamically (crucial for dynamic PR deployments)
      if (origin.endsWith(".railway.app")) {
        return callback(null, true);
      }

      // 2. Allow explicitly configured domains
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 3. Development/Staging fallback: Allow all if NOT production
      if (!isProduction()) {
        console.warn(`CORS: Allowing origin in non-production: ${origin}`);
        return callback(null, true);
      }

      // Block unknown origins in production
      console.warn(`CORS: Blocked origin in production: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: config.cors.allowedMethods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: config.cors.credentials,
    maxAge: config.cors.maxAge,
    optionsSuccessStatus: 200,
  };

  console.log("CORS middleware configured with Railway-compatible settings");
  console.log("Static Allowed origins:", allowedOrigins);
  console.log("Dynamic: *.railway.app enabled");
  
  return cors(corsOptions);
};
