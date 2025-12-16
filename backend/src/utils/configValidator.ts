/**
 * Configuration Validator
 * Validates configuration settings on application startup
 * Implements fail-fast behavior for production environments
 */

import fs from "fs";
import path from "path";
import { config, isProduction, isDevelopment } from "../config";
import { logger } from "./logger";

/**
 * Validation result interface
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate Google Calendar configuration
 */
export function validateGoogleCalendarConfig(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const gcConfig = config.googleCalendar;

  // If disabled, skip validation in development
  if (!gcConfig.enabled) {
    if (isDevelopment()) {
      result.warnings.push(
        "Google Calendar integration is disabled (development mode)"
      );
      return result;
    }
    // In production, warn but don't fail
    result.warnings.push(
      "Google Calendar integration is disabled in production"
    );
    return result;
  }

  // Validate service account email
  if (!gcConfig.serviceAccountEmail) {
    result.valid = false;
    result.errors.push(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL is required when Google Calendar is enabled"
    );
  } else if (!gcConfig.serviceAccountEmail.includes("@")) {
    result.valid = false;
    result.errors.push(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL must be a valid email address"
    );
  }

  // Validate service account key path
  if (!gcConfig.serviceAccountKeyPath) {
    result.valid = false;
    result.errors.push(
      "GOOGLE_SERVICE_ACCOUNT_KEY_PATH is required when Google Calendar is enabled"
    );
  } else {
    // Check if file exists
    const keyPath = path.resolve(gcConfig.serviceAccountKeyPath);
    if (!fs.existsSync(keyPath)) {
      result.valid = false;
      result.errors.push(`Service account key file not found at: ${keyPath}`);
    } else {
      // Validate JSON format
      try {
        const keyContent = fs.readFileSync(keyPath, "utf-8");
        const keyData = JSON.parse(keyContent);

        // Validate required fields in service account key
        const requiredFields = [
          "type",
          "project_id",
          "private_key_id",
          "private_key",
          "client_email",
          "client_id",
        ];

        for (const field of requiredFields) {
          if (!keyData[field]) {
            result.valid = false;
            result.errors.push(
              `Service account key file is missing required field: ${field}`
            );
          }
        }

        // Validate type is service_account
        if (keyData.type !== "service_account") {
          result.valid = false;
          result.errors.push(
            `Service account key type must be "service_account", got: ${keyData.type}`
          );
        }

        // Validate private key format
        if (
          keyData.private_key &&
          !keyData.private_key.includes("BEGIN PRIVATE KEY")
        ) {
          result.valid = false;
          result.errors.push(
            "Service account private_key appears to be invalid"
          );
        }
      } catch (error) {
        result.valid = false;
        if (error instanceof SyntaxError) {
          result.errors.push(
            `Service account key file is not valid JSON: ${error.message}`
          );
        } else {
          result.errors.push(
            `Failed to read service account key file: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    }
  }

  // Validate calendar ID
  if (!gcConfig.calendarId) {
    result.valid = false;
    result.errors.push(
      "GOOGLE_CALENDAR_ID is required when Google Calendar is enabled"
    );
  }

  // Validate timezone
  if (!gcConfig.timeZone) {
    result.valid = false;
    result.errors.push(
      "GOOGLE_CALENDAR_TIMEZONE is required when Google Calendar is enabled"
    );
  } else {
    // Basic timezone validation (IANA format)
    if (!isValidTimezone(gcConfig.timeZone)) {
      result.warnings.push(
        `GOOGLE_CALENDAR_TIMEZONE may not be a valid IANA timezone: ${gcConfig.timeZone}`
      );
    }
  }

  // Validate retry configuration
  if (gcConfig.retryAttempts < 0 || gcConfig.retryAttempts > 10) {
    result.warnings.push(
      `GOOGLE_CALENDAR_RETRY_ATTEMPTS should be between 0 and 10, got: ${gcConfig.retryAttempts}`
    );
  }

  if (gcConfig.retryDelay < 100 || gcConfig.retryDelay > 10000) {
    result.warnings.push(
      `GOOGLE_CALENDAR_RETRY_DELAY should be between 100 and 10000ms, got: ${gcConfig.retryDelay}`
    );
  }

  return result;
}

/**
 * Validate HubSpot configuration
 */
export function validateHubSpotConfig(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const hsConfig = config.hubspot;

  // If disabled, skip validation in development
  if (!hsConfig.enabled) {
    if (isDevelopment()) {
      result.warnings.push(
        "HubSpot CRM integration is disabled (development mode)"
      );
      return result;
    }
    // In production, warn but don't fail
    result.warnings.push("HubSpot CRM integration is disabled in production");
    return result;
  }

  // Validate access token
  if (!hsConfig.accessToken) {
    result.valid = false;
    result.errors.push(
      "HUBSPOT_ACCESS_TOKEN is required when HubSpot is enabled"
    );
  } else {
    // Validate token format (HubSpot tokens typically start with "pat-" for private apps)
    if (hsConfig.accessToken.length < 20) {
      result.valid = false;
      result.errors.push(
        "HUBSPOT_ACCESS_TOKEN appears to be too short (minimum 20 characters)"
      );
    }

    // Check for common placeholder values
    const placeholders = [
      "your-hubspot-access-token",
      "your-token-here",
      "placeholder",
      "changeme",
    ];
    if (
      placeholders.some((placeholder) =>
        hsConfig.accessToken.toLowerCase().includes(placeholder)
      )
    ) {
      result.valid = false;
      result.errors.push(
        "HUBSPOT_ACCESS_TOKEN appears to be a placeholder value"
      );
    }
  }

  // Validate retry configuration
  if (hsConfig.retryAttempts < 0 || hsConfig.retryAttempts > 10) {
    result.warnings.push(
      `HUBSPOT_RETRY_ATTEMPTS should be between 0 and 10, got: ${hsConfig.retryAttempts}`
    );
  }

  if (hsConfig.retryDelay < 100 || hsConfig.retryDelay > 10000) {
    result.warnings.push(
      `HUBSPOT_RETRY_DELAY should be between 100 and 10000ms, got: ${hsConfig.retryDelay}`
    );
  }

  return result;
}

/**
 * Validate business hours configuration
 */
export function validateBusinessHoursConfig(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const businessHours = config.bookingRules.businessHours;

  // Validate days of week
  if (!businessHours.daysOfWeek || businessHours.daysOfWeek.length === 0) {
    result.valid = false;
    result.errors.push("BUSINESS_DAYS must contain at least one day");
  } else {
    // Check each day is valid (0-6)
    for (const day of businessHours.daysOfWeek) {
      if (day < 0 || day > 6 || !Number.isInteger(day)) {
        result.valid = false;
        result.errors.push(
          `BUSINESS_DAYS contains invalid day: ${day} (must be 0-6 where 0=Sunday)`
        );
      }
    }

    // Check for duplicates
    const uniqueDays = new Set(businessHours.daysOfWeek);
    if (uniqueDays.size !== businessHours.daysOfWeek.length) {
      result.warnings.push("BUSINESS_DAYS contains duplicate days");
    }
  }

  // Validate start hour
  if (
    businessHours.startHour < 0 ||
    businessHours.startHour > 23 ||
    !Number.isInteger(businessHours.startHour)
  ) {
    result.valid = false;
    result.errors.push(
      `BUSINESS_START_HOUR must be between 0 and 23, got: ${businessHours.startHour}`
    );
  }

  // Validate end hour
  if (
    businessHours.endHour < 0 ||
    businessHours.endHour > 23 ||
    !Number.isInteger(businessHours.endHour)
  ) {
    result.valid = false;
    result.errors.push(
      `BUSINESS_END_HOUR must be between 0 and 23, got: ${businessHours.endHour}`
    );
  }

  // Validate start < end
  if (businessHours.startHour >= businessHours.endHour) {
    result.valid = false;
    result.errors.push(
      `BUSINESS_START_HOUR (${businessHours.startHour}) must be less than BUSINESS_END_HOUR (${businessHours.endHour})`
    );
  }

  // Validate timezone
  if (!businessHours.timeZone) {
    result.valid = false;
    result.errors.push("BUSINESS_TIMEZONE is required");
  } else if (!isValidTimezone(businessHours.timeZone)) {
    result.warnings.push(
      `BUSINESS_TIMEZONE may not be a valid IANA timezone: ${businessHours.timeZone}`
    );
  }

  // Validate buffer minutes
  if (
    config.bookingRules.bufferMinutes < 0 ||
    config.bookingRules.bufferMinutes > 120
  ) {
    result.warnings.push(
      `BUFFER_MINUTES should be between 0 and 120, got: ${config.bookingRules.bufferMinutes}`
    );
  }

  // Validate min advance hours
  if (
    config.bookingRules.minAdvanceHours < 0 ||
    config.bookingRules.minAdvanceHours > 168
  ) {
    result.warnings.push(
      `MIN_ADVANCE_HOURS should be between 0 and 168 (1 week), got: ${config.bookingRules.minAdvanceHours}`
    );
  }

  // Validate frequency limits
  if (
    config.bookingRules.maxBookingsPerEmail < 1 ||
    config.bookingRules.maxBookingsPerEmail > 100
  ) {
    result.warnings.push(
      `MAX_BOOKINGS_PER_EMAIL should be between 1 and 100, got: ${config.bookingRules.maxBookingsPerEmail}`
    );
  }

  if (
    config.bookingRules.frequencyWindowDays < 1 ||
    config.bookingRules.frequencyWindowDays > 365
  ) {
    result.warnings.push(
      `FREQUENCY_WINDOW_DAYS should be between 1 and 365, got: ${config.bookingRules.frequencyWindowDays}`
    );
  }

  return result;
}

/**
 * Validate all configuration settings
 */
export function validateAllConfig(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Validate Google Calendar
  const gcResult = validateGoogleCalendarConfig();
  result.errors.push(...gcResult.errors);
  result.warnings.push(...gcResult.warnings);
  if (!gcResult.valid) {
    result.valid = false;
  }

  // Validate HubSpot
  const hsResult = validateHubSpotConfig();
  result.errors.push(...hsResult.errors);
  result.warnings.push(...hsResult.warnings);
  if (!hsResult.valid) {
    result.valid = false;
  }

  // Validate Business Hours
  const bhResult = validateBusinessHoursConfig();
  result.errors.push(...bhResult.errors);
  result.warnings.push(...bhResult.warnings);
  if (!bhResult.valid) {
    result.valid = false;
  }

  return result;
}

/**
 * Print validation results
 */
export function printValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error("\n❌ Configuration Validation Errors:");
    result.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    console.warn("\n⚠️  Configuration Validation Warnings:");
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
  }

  if (result.valid && result.errors.length === 0) {
    console.log("\n✅ Configuration validation passed");
  }
}

/**
 * Validate configuration and handle failures based on environment
 */
export function validateConfigOnStartup(): void {
  logger.info("Validating configuration...");

  const result = validateAllConfig();

  // Print results
  printValidationResults(result);

  // Handle validation failures
  if (!result.valid) {
    if (isProduction()) {
      // Fail fast in production
      logger.error("Configuration validation failed in production environment");
      console.error(
        "\n💡 Please fix the configuration errors and restart the application."
      );
      console.error(
        "   Refer to .env.example for the complete list of required variables.\n"
      );
      process.exit(1);
    } else {
      // Warn in development but allow startup
      logger.warn(
        "Configuration validation failed in development environment - continuing with warnings"
      );
      console.warn(
        "\n💡 The application will start, but some features may not work correctly."
      );
      console.warn(
        "   Please fix the configuration errors for full functionality.\n"
      );
    }
  } else if (result.warnings.length > 0) {
    logger.warn("Configuration validation passed with warnings");
  } else {
    logger.info("Configuration validation passed successfully");
  }
}

/**
 * Helper function to validate timezone string
 * Basic validation - checks if it looks like an IANA timezone
 */
function isValidTimezone(timezone: string): boolean {
  // Basic format check: should contain at least one slash and no spaces
  if (!timezone.includes("/") || timezone.includes(" ")) {
    return false;
  }

  // Try to use it with Intl.DateTimeFormat (available in Node.js)
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Print detailed configuration summary with validation status
 */
export function printDetailedConfigSummary(): void {
  console.log("\n" + "=".repeat(60));
  console.log("📋 CONFIGURATION SUMMARY");
  console.log("=".repeat(60));

  // Environment
  console.log("\n🌍 Environment:");
  console.log(`   Mode: ${config.server.nodeEnv}`);
  console.log(`   Port: ${config.server.port}`);
  console.log(`   API Base URL: ${config.server.apiBaseUrl}`);

  // Database
  console.log("\n💾 Database:");
  console.log(`   Pool Size: ${config.database.poolSize}`);
  console.log(`   Connection Timeout: ${config.database.connectionTimeout}ms`);

  // Logging
  console.log("\n📝 Logging:");
  console.log(`   Level: ${config.logging.level}`);
  console.log(`   Console: ${config.logging.enableConsole ? "✓" : "✗"}`);
  console.log(`   File: ${config.logging.enableFile ? "✓" : "✗"}`);

  // Rate Limiting
  console.log("\n🚦 Rate Limiting:");
  console.log(
    `   Max Requests: ${config.rateLimit.maxRequests} per ${
      config.rateLimit.windowMs / 1000
    }s`
  );

  // CORS
  console.log("\n🔒 CORS:");
  console.log(`   Allowed Origins: ${config.cors.allowedOrigins.join(", ")}`);

  // Google Calendar
  console.log("\n📅 Google Calendar:");
  console.log(
    `   Status: ${config.googleCalendar.enabled ? "✓ Enabled" : "✗ Disabled"}`
  );
  if (config.googleCalendar.enabled) {
    console.log(`   Calendar ID: ${config.googleCalendar.calendarId}`);
    console.log(`   Timezone: ${config.googleCalendar.timeZone}`);
    console.log(
      `   Service Account: ${
        config.googleCalendar.serviceAccountEmail || "Not configured"
      }`
    );
  }

  // HubSpot
  console.log("\n🎯 HubSpot CRM:");
  console.log(
    `   Status: ${config.hubspot.enabled ? "✓ Enabled" : "✗ Disabled"}`
  );
  if (config.hubspot.enabled) {
    console.log(
      `   Access Token: ${
        config.hubspot.accessToken ? "Configured" : "Not configured"
      }`
    );
  }

  // Booking Rules
  console.log("\n📋 Booking Rules:");
  console.log(
    `   Max Bookings: ${config.bookingRules.maxBookingsPerEmail} per ${config.bookingRules.frequencyWindowDays} days`
  );
  console.log(
    `   Business Hours: ${config.bookingRules.businessHours.startHour}:00 - ${config.bookingRules.businessHours.endHour}:00`
  );
  console.log(
    `   Business Days: ${config.bookingRules.businessHours.daysOfWeek.join(
      ", "
    )}`
  );
  console.log(`   Buffer Time: ${config.bookingRules.bufferMinutes} minutes`);
  console.log(`   Min Advance: ${config.bookingRules.minAdvanceHours} hours`);
  console.log(`   Timezone: ${config.bookingRules.businessHours.timeZone}`);

  console.log("\n" + "=".repeat(60) + "\n");
}
