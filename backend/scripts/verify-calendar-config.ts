/**
 * Verification script for Google Calendar configuration
 * Tests that calendar ID and service account credentials load properly
 */

import { config } from "../src/config";
import { CalendarClient } from "../src/integrations/calendar.client";
import { logger } from "../src/utils/logger";
import * as fs from "fs";
import * as path from "path";

async function verifyCalendarConfig() {
  console.log("\n🔍 Verifying Google Calendar Configuration...\n");

  // Step 1: Check environment variables
  console.log("📋 Step 1: Checking Environment Variables");
  console.log("─".repeat(50));

  const checks = {
    enabled: config.googleCalendar.enabled,
    calendarId: config.googleCalendar.calendarId,
    serviceAccountEmail: config.googleCalendar.serviceAccountEmail,
    keyPath: config.googleCalendar.serviceAccountKeyPath,
    timeZone: config.googleCalendar.timeZone,
  };

  console.log(`✓ Google Calendar Enabled: ${checks.enabled}`);
  console.log(`✓ Calendar ID: ${checks.calendarId}`);
  console.log(`✓ Service Account Email: ${checks.serviceAccountEmail}`);
  console.log(`✓ Key File Path: ${checks.keyPath}`);
  console.log(`✓ Time Zone: ${checks.timeZone}`);

  if (!checks.enabled) {
    console.log("\n❌ Google Calendar is disabled in configuration");
    process.exit(1);
  }

  // Step 2: Verify service account key file exists
  console.log("\n📄 Step 2: Verifying Service Account Key File");
  console.log("─".repeat(50));

  const keyPath = path.resolve(process.cwd(), checks.keyPath);
  console.log(`Looking for key file at: ${keyPath}`);

  if (!fs.existsSync(keyPath)) {
    console.log(`\n❌ Service account key file not found at: ${keyPath}`);
    process.exit(1);
  }

  console.log("✓ Key file exists");

  // Step 3: Parse and validate key file
  console.log("\n🔑 Step 3: Validating Key File Contents");
  console.log("─".repeat(50));

  try {
    const keyContent = fs.readFileSync(keyPath, "utf8");
    const keyData = JSON.parse(keyContent);

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
        console.log(`❌ Missing required field: ${field}`);
        process.exit(1);
      }
      console.log(
        `✓ ${field}: ${field === "private_key" ? "[REDACTED]" : keyData[field]}`
      );
    }

    // Verify email matches
    if (keyData.client_email !== checks.serviceAccountEmail) {
      console.log(
        `\n⚠️  Warning: Email mismatch!\n` +
          `   .env: ${checks.serviceAccountEmail}\n` +
          `   Key file: ${keyData.client_email}`
      );
    }

    // Verify private key format
    if (!keyData.private_key.includes("BEGIN PRIVATE KEY")) {
      console.log("❌ Invalid private key format");
      process.exit(1);
    }
    console.log("✓ Private key format is valid");
  } catch (error) {
    console.log(`\n❌ Failed to parse key file: ${error}`);
    process.exit(1);
  }

  // Step 4: Initialize Calendar Client
  console.log("\n🔌 Step 4: Initializing Calendar Client");
  console.log("─".repeat(50));

  const calendarClient = new CalendarClient();

  try {
    await calendarClient.initializeFromConfig();
    console.log("✓ Calendar client initialized successfully");
  } catch (error) {
    console.log(`\n❌ Failed to initialize calendar client:`);
    console.log(error);
    process.exit(1);
  }

  // Step 5: Verify authentication
  console.log("\n🔐 Step 5: Verifying Authentication");
  console.log("─".repeat(50));

  if (!calendarClient.isAuthenticated()) {
    console.log("❌ Calendar client is not authenticated");
    process.exit(1);
  }

  console.log("✓ Calendar client is authenticated");

  // Step 6: Test API access by fetching events
  console.log("\n📅 Step 6: Testing Calendar API Access");
  console.log("─".repeat(50));

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(
      `Fetching events from ${now.toISOString()} to ${tomorrow.toISOString()}`
    );

    const events = await calendarClient.getEvents(now, tomorrow);

    console.log(`✓ Successfully fetched ${events.length} events from calendar`);

    if (events.length > 0) {
      console.log("\nSample events:");
      events.slice(0, 3).forEach((event, index) => {
        console.log(
          `  ${index + 1}. ${event.summary} - ${event.start.dateTime}`
        );
      });
    }
  } catch (error) {
    console.log(`\n❌ Failed to fetch calendar events:`);
    console.log(error);
    process.exit(1);
  }

  // Step 7: Check circuit breaker stats
  console.log("\n📊 Step 7: Circuit Breaker Statistics");
  console.log("─".repeat(50));

  const stats = calendarClient.getCircuitBreakerStats();
  console.log(`State: ${stats.state}`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful Requests: ${stats.successfulRequests}`);
  console.log(`Failed Requests: ${stats.failedRequests}`);

  // Final summary
  console.log("\n" + "=".repeat(50));
  console.log("✅ ALL CHECKS PASSED!");
  console.log("=".repeat(50));
  console.log("\nYour Google Calendar configuration is properly set up:");
  console.log(`  • Calendar ID: ${checks.calendarId}`);
  console.log(`  • Service Account: ${checks.serviceAccountEmail}`);
  console.log(`  • Private Key: Loaded and valid`);
  console.log(`  • API Access: Working`);
  console.log("\n");
}

// Run verification
verifyCalendarConfig()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });
