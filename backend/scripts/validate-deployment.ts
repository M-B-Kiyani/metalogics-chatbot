#!/usr/bin/env ts-node
/**
 * Deployment Validation Script
 *
 * This script validates all prerequisites before deployment:
 * - Environment variables
 * - Database connectivity
 * - Google Calendar authentication
 * - HubSpot authentication
 * - Configuration files
 *
 * Run this before deploying to any environment.
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "../src/config";
import { PrismaClient } from "@prisma/client";
import { CalendarClient } from "../src/integrations/calendar.client";
import { HubSpotClient } from "../src/integrations/hubspot.client";
import logger from "../src/utils/logger";

interface ValidationResult {
  category: string;
  check: string;
  status: "PASS" | "FAIL" | "WARN" | "SKIP";
  message: string;
}

const results: ValidationResult[] = [];

function addResult(
  category: string,
  check: string,
  status: ValidationResult["status"],
  message: string
) {
  results.push({ category, check, status, message });
  const icon =
    status === "PASS"
      ? "✓"
      : status === "FAIL"
      ? "✗"
      : status === "WARN"
      ? "⚠"
      : "○";
  console.log(`  ${icon} ${check}: ${message}`);
}

async function validateEnvironmentVariables(): Promise<void> {
  console.log("\n📋 Validating Environment Variables...");

  const requiredVars = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "ADMIN_EMAIL",
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      addResult("Environment", varName, "PASS", "Set");
    } else {
      addResult("Environment", varName, "FAIL", "Missing");
    }
  }

  // Check optional integration variables
  const googleCalendarEnabled = process.env.GOOGLE_CALENDAR_ENABLED === "true";
  const hubspotEnabled = process.env.HUBSPOT_ENABLED === "true";

  if (googleCalendarEnabled) {
    const googleVars = [
      "GOOGLE_SERVICE_ACCOUNT_KEY_PATH",
      "GOOGLE_CALENDAR_ID",
      "GOOGLE_CALENDAR_TIMEZONE",
    ];
    for (const varName of googleVars) {
      if (process.env[varName]) {
        addResult("Environment", varName, "PASS", "Set");
      } else {
        addResult(
          "Environment",
          varName,
          "FAIL",
          "Missing (required when Google Calendar enabled)"
        );
      }
    }
  } else {
    addResult(
      "Environment",
      "Google Calendar",
      "WARN",
      "Disabled - booking system will work without calendar integration"
    );
  }

  if (hubspotEnabled) {
    if (process.env.HUBSPOT_ACCESS_TOKEN) {
      addResult("Environment", "HUBSPOT_ACCESS_TOKEN", "PASS", "Set");
    } else {
      addResult(
        "Environment",
        "HUBSPOT_ACCESS_TOKEN",
        "FAIL",
        "Missing (required when HubSpot enabled)"
      );
    }
  } else {
    addResult(
      "Environment",
      "HubSpot",
      "WARN",
      "Disabled - booking system will work without CRM integration"
    );
  }
}

async function validateDatabaseConnection(): Promise<void> {
  console.log("\n🗄️  Validating Database Connection...");

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    addResult(
      "Database",
      "Connection",
      "PASS",
      "Successfully connected to database"
    );

    // Check if migrations are up to date
    try {
      await prisma.booking.findFirst();
      addResult("Database", "Schema", "PASS", "Schema is accessible");
    } catch (error) {
      addResult(
        "Database",
        "Schema",
        "FAIL",
        "Schema error - migrations may need to be run"
      );
    }
  } catch (error) {
    addResult(
      "Database",
      "Connection",
      "FAIL",
      `Failed to connect: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function validateGoogleCalendar(): Promise<void> {
  console.log("\n📅 Validating Google Calendar Integration...");

  if (!config.googleCalendar.enabled) {
    addResult(
      "Google Calendar",
      "Integration",
      "SKIP",
      "Disabled in configuration"
    );
    return;
  }

  // Check service account key file exists
  const keyPath = config.googleCalendar.serviceAccountKeyPath;
  if (!fs.existsSync(keyPath)) {
    addResult(
      "Google Calendar",
      "Service Account Key",
      "FAIL",
      `File not found: ${keyPath}`
    );
    return;
  }
  addResult("Google Calendar", "Service Account Key", "PASS", "File exists");

  // Validate JSON format
  try {
    const keyContent = fs.readFileSync(keyPath, "utf-8");
    const keyData = JSON.parse(keyContent);

    if (
      keyData.type === "service_account" &&
      keyData.private_key &&
      keyData.client_email
    ) {
      addResult(
        "Google Calendar",
        "Key Format",
        "PASS",
        "Valid service account key"
      );
    } else {
      addResult(
        "Google Calendar",
        "Key Format",
        "FAIL",
        "Invalid service account key format"
      );
      return;
    }
  } catch (error) {
    addResult("Google Calendar", "Key Format", "FAIL", "Invalid JSON format");
    return;
  }

  // Test authentication
  try {
    const calendarClient = new CalendarClient();
    await calendarClient.initialize({
      clientEmail: config.googleCalendar.serviceAccountEmail,
      privateKey: config.googleCalendar.privateKey,
      calendarId: config.googleCalendar.calendarId,
    });

    if (calendarClient.isAuthenticated()) {
      addResult(
        "Google Calendar",
        "Authentication",
        "PASS",
        "Successfully authenticated"
      );

      // Test API access
      try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        await calendarClient.getEvents(
          now,
          tomorrow,
          config.googleCalendar.calendarId
        );
        addResult(
          "Google Calendar",
          "API Access",
          "PASS",
          "Successfully accessed calendar"
        );
      } catch (error) {
        addResult(
          "Google Calendar",
          "API Access",
          "FAIL",
          `API call failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else {
      addResult(
        "Google Calendar",
        "Authentication",
        "FAIL",
        "Authentication failed"
      );
    }
  } catch (error) {
    addResult(
      "Google Calendar",
      "Authentication",
      "FAIL",
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function validateHubSpot(): Promise<void> {
  console.log("\n🔗 Validating HubSpot Integration...");

  if (!config.hubspot.enabled) {
    addResult("HubSpot", "Integration", "SKIP", "Disabled in configuration");
    return;
  }

  // Validate token format
  const token = config.hubspot.accessToken;
  if (!token || token.length < 20) {
    addResult("HubSpot", "Access Token", "FAIL", "Invalid token format");
    return;
  }
  addResult("HubSpot", "Access Token", "PASS", "Token format valid");

  // Test authentication
  try {
    const hubspotClient = new HubSpotClient();
    await hubspotClient.initialize(token);

    if (hubspotClient.isAuthenticated()) {
      addResult(
        "HubSpot",
        "Authentication",
        "PASS",
        "Successfully authenticated"
      );

      // Test API access with a simple search
      try {
        await hubspotClient.searchContactByEmail("test@example.com");
        addResult(
          "HubSpot",
          "API Access",
          "PASS",
          "Successfully accessed HubSpot API"
        );
      } catch (error) {
        addResult(
          "HubSpot",
          "API Access",
          "FAIL",
          `API call failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else {
      addResult("HubSpot", "Authentication", "FAIL", "Authentication failed");
    }
  } catch (error) {
    addResult(
      "HubSpot",
      "Authentication",
      "FAIL",
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function validateConfiguration(): Promise<void> {
  console.log("\n⚙️  Validating Configuration...");

  // Validate business hours
  const { businessHours } = config.bookingRules;
  if (businessHours.startHour >= 0 && businessHours.startHour < 24) {
    addResult(
      "Configuration",
      "Business Start Hour",
      "PASS",
      `${businessHours.startHour}:00`
    );
  } else {
    addResult(
      "Configuration",
      "Business Start Hour",
      "FAIL",
      "Invalid hour (must be 0-23)"
    );
  }

  if (
    businessHours.endHour > businessHours.startHour &&
    businessHours.endHour <= 24
  ) {
    addResult(
      "Configuration",
      "Business End Hour",
      "PASS",
      `${businessHours.endHour}:00`
    );
  } else {
    addResult(
      "Configuration",
      "Business End Hour",
      "FAIL",
      "Invalid hour or not after start hour"
    );
  }

  if (
    businessHours.daysOfWeek.length > 0 &&
    businessHours.daysOfWeek.every((d) => d >= 0 && d <= 6)
  ) {
    addResult(
      "Configuration",
      "Business Days",
      "PASS",
      `${businessHours.daysOfWeek.length} days configured`
    );
  } else {
    addResult("Configuration", "Business Days", "FAIL", "Invalid days of week");
  }

  // Validate booking rules
  if (config.bookingRules.maxBookingsPerEmail > 0) {
    addResult(
      "Configuration",
      "Frequency Limit",
      "PASS",
      `${config.bookingRules.maxBookingsPerEmail} bookings per ${config.bookingRules.frequencyWindowDays} days`
    );
  } else {
    addResult(
      "Configuration",
      "Frequency Limit",
      "WARN",
      "No frequency limit set"
    );
  }

  if (config.bookingRules.bufferMinutes >= 0) {
    addResult(
      "Configuration",
      "Buffer Time",
      "PASS",
      `${config.bookingRules.bufferMinutes} minutes`
    );
  } else {
    addResult("Configuration", "Buffer Time", "FAIL", "Invalid buffer time");
  }

  if (config.bookingRules.minAdvanceHours >= 0) {
    addResult(
      "Configuration",
      "Min Advance Time",
      "PASS",
      `${config.bookingRules.minAdvanceHours} hours`
    );
  } else {
    addResult(
      "Configuration",
      "Min Advance Time",
      "FAIL",
      "Invalid advance time"
    );
  }
}

async function printSummary(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT VALIDATION SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warnings = results.filter((r) => r.status === "WARN").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  console.log(`\n✓ Passed:   ${passed}`);
  console.log(`✗ Failed:   ${failed}`);
  console.log(`⚠ Warnings: ${warnings}`);
  console.log(`○ Skipped:  ${skipped}`);
  console.log(`\nTotal:      ${results.length}`);

  if (failed > 0) {
    console.log("\n❌ DEPLOYMENT VALIDATION FAILED");
    console.log("\nFailed checks:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`  - ${r.category} > ${r.check}: ${r.message}`);
      });
    console.log("\nPlease fix the failed checks before deploying.");
    process.exit(1);
  } else if (warnings > 0) {
    console.log("\n⚠️  DEPLOYMENT VALIDATION PASSED WITH WARNINGS");
    console.log("\nWarnings:");
    results
      .filter((r) => r.status === "WARN")
      .forEach((r) => {
        console.log(`  - ${r.category} > ${r.check}: ${r.message}`);
      });
    console.log("\nReview warnings before deploying.");
    process.exit(0);
  } else {
    console.log("\n✅ DEPLOYMENT VALIDATION PASSED");
    console.log("\nAll checks passed. System is ready for deployment.");
    process.exit(0);
  }
}

async function main() {
  console.log("🚀 Booking System Deployment Validation");
  console.log("=".repeat(60));
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  try {
    await validateEnvironmentVariables();
    await validateDatabaseConnection();
    await validateGoogleCalendar();
    await validateHubSpot();
    await validateConfiguration();
    await printSummary();
  } catch (error) {
    console.error("\n❌ Validation script error:", error);
    process.exit(1);
  }
}

main();
