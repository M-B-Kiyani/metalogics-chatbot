/**
 * Configuration Management System
 * Loads, validates, and provides type-safe access to environment variables
 * Supports different environments (development, staging, production)
 */

import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

/**
 * Environment type
 */
export type Environment = "development" | "staging" | "production" | "test";

/**
 * Server configuration interface
 */
export interface ServerConfig {
  nodeEnv: Environment;
  port: number;
  apiBaseUrl: string;
  requestTimeout: number;
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  url: string;
  poolSize: number;
  connectionTimeout: number;
  queryTimeout: number;
}

/**
 * Email configuration interface
 */
export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  adminEmail: string;
  fromEmail: string;
  fromName: string;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Authentication configuration interface
 */
export interface AuthConfig {
  apiKey: string;
  apiKeyHeader: string;
}

/**
 * Logging configuration interface
 */
export interface LoggingConfig {
  level: "error" | "warn" | "info" | "debug";
  filePath?: string;
  enableConsole: boolean;
  enableFile: boolean;
  maxFileSize: string;
  maxFiles: string;
}

/**
 * Rate limiting configuration interface
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
}

/**
 * CORS configuration interface
 */
export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

/**
 * Google Calendar configuration interface
 */
export interface GoogleCalendarConfig {
  enabled: boolean;
  serviceAccountEmail: string;
  serviceAccountKeyPath: string;
  calendarId: string;
  timeZone: string;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * HubSpot CRM configuration interface
 */
export interface HubSpotConfig {
  enabled: boolean;
  accessToken: string;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Retell AI Voice Integration configuration interface
 */
export interface RetellConfig {
  apiKey: string;
  agentId: string;
  llmId?: string;
  enabled: boolean;
  customLlmUrl?: string;
  webhookUrl?: string;
}

/**
 * Duration-specific frequency rule
 */
export interface DurationFrequencyRule {
  duration: 15 | 30 | 45 | 60;
  maxBookings: number;
  windowMinutes: number;
}

/**
 * Booking rules configuration interface
 */
export interface BookingRulesConfig {
  maxBookingsPerEmail: number; // Deprecated - not used, kept for backward compatibility
  frequencyWindowDays: number; // Deprecated - not used, kept for backward compatibility
  durationRules: DurationFrequencyRule[];
  businessHours: {
    daysOfWeek: number[];
    startHour: number;
    endHour: number;
    timeZone: string;
  };
  bufferMinutes: number;
  minAdvanceHours: number; // Minimum hours in advance (1 hour)
  maxAdvanceHours: number; // Maximum hours in advance (24 hours)
}

/**
 * Complete application configuration interface
 */
export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  email: EmailConfig;
  auth: AuthConfig;
  logging: LoggingConfig;
  rateLimit: RateLimitConfig;
  cors: CorsConfig;
  googleCalendar: GoogleCalendarConfig;
  hubspot: HubSpotConfig;
  bookingRules: BookingRulesConfig;
  retell: RetellConfig;
}

/**
 * Zod schema for environment variable validation
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10)),
  API_BASE_URL: z.string().url().optional(),
  REQUEST_TIMEOUT: z
    .string()
    .default("30000")
    .transform((val) => parseInt(val, 10)),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_POOL_SIZE: z
    .string()
    .default("20")
    .transform((val) => parseInt(val, 10)),
  DATABASE_CONNECTION_TIMEOUT: z
    .string()
    .default("10000")
    .transform((val) => parseInt(val, 10)),
  DATABASE_QUERY_TIMEOUT: z
    .string()
    .default("10000")
    .transform((val) => parseInt(val, 10)),

  // Email
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string().email("SMTP_USER must be a valid email"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required"),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email"),
  FROM_EMAIL: z.string().email().optional(),
  FROM_NAME: z.string().default("Metalogics AI Assistant"),
  EMAIL_RETRY_ATTEMPTS: z
    .string()
    .default("3")
    .transform((val) => parseInt(val, 10)),
  EMAIL_RETRY_DELAY: z
    .string()
    .default("2000")
    .transform((val) => parseInt(val, 10)),

  // Authentication
  API_KEY: z.string().min(32, "API_KEY must be at least 32 characters"),
  API_KEY_HEADER: z.string().default("Authorization"),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FILE_PATH: z.string().optional(),
  LOG_ENABLE_CONSOLE: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  LOG_ENABLE_FILE: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  LOG_MAX_FILE_SIZE: z.string().default("20m"),
  LOG_MAX_FILES: z.string().default("14d"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default("60000")
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default("100")
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_SKIP_SUCCESSFUL: z
    .string()
    .default("false")
    .transform((val) => val === "true"),

  // CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  ALLOWED_METHODS: z.string().default("GET,POST,PUT,PATCH,DELETE"),
  ALLOWED_HEADERS: z.string().default("Content-Type,Authorization"),
  CORS_CREDENTIALS: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  CORS_MAX_AGE: z
    .string()
    .default("86400")
    .transform((val) => parseInt(val, 10)),

  // Google Calendar
  GOOGLE_CALENDAR_ENABLED: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_KEY_PATH: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().default("primary"),
  GOOGLE_CALENDAR_TIMEZONE: z.string().default("Europe/London"),
  GOOGLE_CALENDAR_RETRY_ATTEMPTS: z
    .string()
    .default("3")
    .transform((val) => parseInt(val, 10)),
  GOOGLE_CALENDAR_RETRY_DELAY: z
    .string()
    .default("1000")
    .transform((val) => parseInt(val, 10)),

  // HubSpot CRM
  HUBSPOT_ENABLED: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  HUBSPOT_ACCESS_TOKEN: z.string().optional(),
  HUBSPOT_RETRY_ATTEMPTS: z
    .string()
    .default("3")
    .transform((val) => parseInt(val, 10)),
  HUBSPOT_RETRY_DELAY: z
    .string()
    .default("1000")
    .transform((val) => parseInt(val, 10)),

  // Retell AI Voice Integration
  RETELL_API_KEY: z.string().optional(),
  RETELL_AGENT_ID: z.string().optional(),
  RETELL_LLM_ID: z.string().optional(),
  RETELL_ENABLED: z.string().optional(),
  Custom_LLM_URL: z.string().optional(),
  Agent_Level_Webhook_URL: z.string().optional(),

  // Booking Rules
  MAX_BOOKINGS_PER_EMAIL: z
    .string()
    .default("999")
    .transform((val) => parseInt(val, 10)), // Not used - kept for backward compatibility
  FREQUENCY_WINDOW_DAYS: z
    .string()
    .default("999")
    .transform((val) => parseInt(val, 10)), // Not used - kept for backward compatibility
  BUSINESS_DAYS: z.string().default("1,2,3,4,5"),
  BUSINESS_START_HOUR: z
    .string()
    .default("9")
    .transform((val) => parseInt(val, 10)),
  BUSINESS_END_HOUR: z
    .string()
    .default("17")
    .transform((val) => parseInt(val, 10)),
  BUSINESS_TIMEZONE: z.string().default("Europe/London"),
  BUFFER_MINUTES: z
    .string()
    .default("15")
    .transform((val) => parseInt(val, 10)),
  MIN_ADVANCE_HOURS: z
    .string()
    .default("1")
    .transform((val) => parseInt(val, 10)),
  MAX_ADVANCE_HOURS: z
    .string()
    .default("24")
    .transform((val) => parseInt(val, 10)),
});

/**
 * Validate environment variables and throw detailed errors if validation fails
 */
function validateEnv(): z.infer<typeof envSchema> {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join(".");
        return `  - ${path}: ${err.message}`;
      });

      console.error("❌ Environment variable validation failed:\n");
      console.error(errorMessages.join("\n"));
      console.error(
        "\n💡 Please check your .env file and ensure all required variables are set."
      );
      console.error(
        "   Refer to .env.example for the complete list of required variables.\n"
      );

      process.exit(1);
    }
    throw error;
  }
}

/**
 * Load and validate environment variables
 */
const env = validateEnv();

/**
 * Build server configuration
 */
function buildServerConfig(): ServerConfig {
  const apiBaseUrl = env.API_BASE_URL || `http://localhost:${env.PORT}`;

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    apiBaseUrl,
    requestTimeout: env.REQUEST_TIMEOUT,
  };
}

/**
 * Build database configuration
 */
function buildDatabaseConfig(): DatabaseConfig {
  return {
    url: env.DATABASE_URL,
    poolSize: env.DATABASE_POOL_SIZE,
    connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT,
    queryTimeout: env.DATABASE_QUERY_TIMEOUT,
  };
}

/**
 * Build email configuration
 */
function buildEmailConfig(): EmailConfig {
  return {
    smtpHost: env.SMTP_HOST,
    smtpPort: env.SMTP_PORT,
    smtpUser: env.SMTP_USER,
    smtpPassword: env.SMTP_PASSWORD,
    adminEmail: env.ADMIN_EMAIL,
    fromEmail: env.FROM_EMAIL || env.SMTP_USER,
    fromName: env.FROM_NAME,
    retryAttempts: env.EMAIL_RETRY_ATTEMPTS,
    retryDelay: env.EMAIL_RETRY_DELAY,
  };
}

/**
 * Build authentication configuration
 */
function buildAuthConfig(): AuthConfig {
  return {
    apiKey: env.API_KEY,
    apiKeyHeader: env.API_KEY_HEADER,
  };
}

/**
 * Build logging configuration
 */
function buildLoggingConfig(): LoggingConfig {
  // Enable file logging in production by default
  const enableFile = env.LOG_ENABLE_FILE || env.NODE_ENV === "production";

  return {
    level: env.LOG_LEVEL,
    filePath: env.LOG_FILE_PATH,
    enableConsole: env.LOG_ENABLE_CONSOLE,
    enableFile,
    maxFileSize: env.LOG_MAX_FILE_SIZE,
    maxFiles: env.LOG_MAX_FILES,
  };
}

/**
 * Build rate limiting configuration
 */
function buildRateLimitConfig(): RateLimitConfig {
  return {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    skipSuccessfulRequests: env.RATE_LIMIT_SKIP_SUCCESSFUL,
  };
}

/**
 * Build CORS configuration
 */
function buildCorsConfig(): CorsConfig {
  return {
    allowedOrigins: env.ALLOWED_ORIGINS.split(",").map((origin) =>
      origin.trim()
    ),
    allowedMethods: env.ALLOWED_METHODS.split(",").map((method) =>
      method.trim()
    ),
    allowedHeaders: env.ALLOWED_HEADERS.split(",").map((header) =>
      header.trim()
    ),
    credentials: env.CORS_CREDENTIALS,
    maxAge: env.CORS_MAX_AGE,
  };
}

/**
 * Build Google Calendar configuration
 */
function buildGoogleCalendarConfig(): GoogleCalendarConfig {
  return {
    enabled: env.GOOGLE_CALENDAR_ENABLED,
    serviceAccountEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    serviceAccountKeyPath: env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || "",
    calendarId: env.GOOGLE_CALENDAR_ID,
    timeZone: env.GOOGLE_CALENDAR_TIMEZONE,
    retryAttempts: env.GOOGLE_CALENDAR_RETRY_ATTEMPTS,
    retryDelay: env.GOOGLE_CALENDAR_RETRY_DELAY,
  };
}

/**
 * Build HubSpot configuration
 */
function buildHubSpotConfig(): HubSpotConfig {
  return {
    enabled: env.HUBSPOT_ENABLED,
    accessToken: env.HUBSPOT_ACCESS_TOKEN || "",
    retryAttempts: env.HUBSPOT_RETRY_ATTEMPTS,
    retryDelay: env.HUBSPOT_RETRY_DELAY,
  };
}

/**
 * Build Retell AI configuration
 */
function buildRetellConfig(): RetellConfig {
  return {
    apiKey: env.RETELL_API_KEY || "",
    agentId: env.RETELL_AGENT_ID || "",
    llmId: env.RETELL_LLM_ID,
    enabled: env.RETELL_ENABLED === "true",
    customLlmUrl: env.Custom_LLM_URL,
    webhookUrl: env.Agent_Level_Webhook_URL,
  };
}

/**
 * Build booking rules configuration
 */
function buildBookingRulesConfig(): BookingRulesConfig {
  const daysOfWeek = env.BUSINESS_DAYS.split(",").map((day) =>
    parseInt(day.trim(), 10)
  );

  return {
    maxBookingsPerEmail: env.MAX_BOOKINGS_PER_EMAIL, // Not used - kept for backward compatibility
    frequencyWindowDays: env.FREQUENCY_WINDOW_DAYS, // Not used - kept for backward compatibility
    durationRules: [
      {
        duration: 15,
        maxBookings: 2,
        windowMinutes: 90, // 90-minute rolling window
      },
      {
        duration: 30,
        maxBookings: 2,
        windowMinutes: 180, // 3-hour rolling window
      },
      {
        duration: 45,
        maxBookings: 2,
        windowMinutes: 300, // 5-hour rolling window
      },
      {
        duration: 60,
        maxBookings: 2,
        windowMinutes: 720, // 12-hour rolling window
      },
    ],
    businessHours: {
      daysOfWeek,
      startHour: env.BUSINESS_START_HOUR,
      endHour: env.BUSINESS_END_HOUR,
      timeZone: env.BUSINESS_TIMEZONE,
    },
    bufferMinutes: env.BUFFER_MINUTES,
    minAdvanceHours: env.MIN_ADVANCE_HOURS, // 1 hour minimum
    maxAdvanceHours: env.MAX_ADVANCE_HOURS, // 24 hours maximum
  };
}

/**
 * Build complete application configuration
 */
function buildConfig(): AppConfig {
  return {
    server: buildServerConfig(),
    database: buildDatabaseConfig(),
    email: buildEmailConfig(),
    auth: buildAuthConfig(),
    logging: buildLoggingConfig(),
    rateLimit: buildRateLimitConfig(),
    cors: buildCorsConfig(),
    googleCalendar: buildGoogleCalendarConfig(),
    hubspot: buildHubSpotConfig(),
    bookingRules: buildBookingRulesConfig(),
    retell: buildRetellConfig(),
  };
}

/**
 * Export the validated and structured configuration
 */
export const config: AppConfig = buildConfig();

/**
 * Helper function to check if running in production
 */
export const isProduction = (): boolean =>
  config.server.nodeEnv === "production";

/**
 * Helper function to check if running in development
 */
export const isDevelopment = (): boolean =>
  config.server.nodeEnv === "development";

/**
 * Helper function to check if running in test
 */
export const isTest = (): boolean => config.server.nodeEnv === "test";

/**
 * Helper function to get environment name
 */
export const getEnvironment = (): Environment => config.server.nodeEnv;

/**
 * Print configuration summary (without sensitive data)
 */
export function printConfigSummary(): void {
  console.log("\n📋 Configuration Summary:");
  console.log(`   Environment: ${config.server.nodeEnv}`);
  console.log(`   Port: ${config.server.port}`);
  console.log(`   API Base URL: ${config.server.apiBaseUrl}`);
  console.log(`   Database Pool Size: ${config.database.poolSize}`);
  console.log(`   Log Level: ${config.logging.level}`);
  console.log(`   Rate Limit: ${config.rateLimit.maxRequests} req/min`);
  console.log(`   CORS Origins: ${config.cors.allowedOrigins.join(", ")}`);
  console.log(
    `   Google Calendar: ${
      config.googleCalendar.enabled ? "Enabled" : "Disabled"
    }`
  );
  console.log(
    `   HubSpot CRM: ${config.hubspot.enabled ? "Enabled" : "Disabled"}`
  );
  console.log(
    `   Booking Rules: Max ${config.bookingRules.maxBookingsPerEmail} bookings per ${config.bookingRules.frequencyWindowDays} days`
  );
  console.log(
    `   Retell AI: ${config.retell.enabled ? "Enabled" : "Disabled"}`
  );
  console.log("");
}
