import cors, { CorsOptions } from "cors";

/**
 * CORS middleware configuration
 * Railway-compatible configuration with correct backend URL
 */
export const corsMiddleware = () => {
  console.log("Initializing CORS middleware for Railway deployment");

  // Allow specific origins including the correct backend URL
  const allowedOrigins = [
    "*",
    "https://frontend-production-metabot.up.railway.app",
    "https://metalogics-chatbot-production.up.railway.app",
    "https://bilal.metalogics.io",
    "https://www.bilal.metalogics.io",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
  ];

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        console.log("CORS: Allowing request with no origin");
        return callback(null, true);
      }

      // Allow all Railway domains
      if (origin.includes(".railway.app")) {
        console.log(`CORS: Allowing Railway domain: ${origin}`);
        return callback(null, true);
      }

      // Allow specific known domains
      if (allowedOrigins.includes(origin)) {
        console.log(`CORS: Allowing known domain: ${origin}`);
        return callback(null, true);
      }

      // For debugging, allow all origins temporarily
      console.log(`CORS: Allowing origin for debugging: ${origin}`);
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    credentials: true,
    maxAge: 86400,
    optionsSuccessStatus: 200,
  };

  console.log("CORS middleware configured with Railway-compatible settings");
  console.log("Allowed origins:", allowedOrigins);
  return cors(corsOptions);
};
