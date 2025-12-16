#!/usr/bin/env ts-node
/**
 * Google Calendar Authentication Test Script
 *
 * This script tests Google Calendar authentication and basic API operations.
 * Use this to verify your Google Calendar setup before deployment.
 */

import * as fs from "fs";
import { config } from "../src/config";
import { CalendarClient } from "../src/integrations/calendar.client";

async function testGoogleCalendar() {
  console.log("🔍 Testing Google Calendar Integration");
  console.log("=".repeat(60));

  // Check if enabled
  if (!config.googleCalendar.enabled) {
    console.log("❌ Google Calendar is disabled in configuration");
    console.log("Set GOOGLE_CALENDAR_ENABLED=true to enable");
    process.exit(1);
  }

  console.log("✓ Google Calendar is enabled");

  // Check service account key file
  const keyPath = config.googleCalendar.serviceAccountKeyPath;
  console.log(`\n📄 Checking service account key file: ${keyPath}`);

  if (!fs.existsSync(keyPath)) {
    console.log(`❌ Service account key file not found: ${keyPath}`);
    console.log("\nPlease ensure:");
    console.log(
      "1. You have created a service account in Google Cloud Console"
    );
    console.log("2. You have downloaded the JSON key file");
    console.log(
      "3. The GOOGLE_SERVICE_ACCOUNT_KEY_PATH environment variable points to the correct file"
    );
    process.exit(1);
  }

  console.log("✓ Service account key file exists");

  // Validate JSON format
  console.log("\n🔍 Validating key file format...");
  let keyData: any;
  try {
    const keyContent = fs.readFileSync(keyPath, "utf-8");
    keyData = JSON.parse(keyContent);

    if (keyData.type !== "service_account") {
      console.log("❌ Invalid key file: not a service account key");
      process.exit(1);
    }

    if (!keyData.private_key || !keyData.client_email) {
      console.log("❌ Invalid key file: missing required fields");
      process.exit(1);
    }

    console.log("✓ Key file format is valid");
    console.log(`  Service Account Email: ${keyData.client_email}`);
    console.log(`  Project ID: ${keyData.project_id || "N/A"}`);
  } catch (error) {
    console.log(
      "❌ Failed to parse key file:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }

  // Test authentication
  console.log("\n🔐 Testing authentication...");
  const calendarClient = new CalendarClient();

  try {
    await calendarClient.initializeFromConfig();

    if (!calendarClient.isAuthenticated()) {
      console.log("❌ Authentication failed");
      process.exit(1);
    }

    console.log("✓ Successfully authenticated with Google Calendar API");
  } catch (error) {
    console.log(
      "❌ Authentication error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.log("\nTroubleshooting:");
    console.log("1. Verify the service account key is valid and not expired");
    console.log(
      "2. Ensure Google Calendar API is enabled in your Google Cloud project"
    );
    console.log(
      "3. Check that the service account has the necessary permissions"
    );
    process.exit(1);
  }

  // Test calendar access
  console.log("\n📅 Testing calendar access...");
  console.log(`  Calendar ID: ${config.googleCalendar.calendarId}`);

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const events = await calendarClient.getEvents(
      now,
      tomorrow,
      config.googleCalendar.calendarId
    );

    console.log(`✓ Successfully accessed calendar`);
    console.log(`  Found ${events.length} event(s) in the next 24 hours`);

    if (events.length > 0) {
      console.log("\n  Recent events:");
      events.slice(0, 3).forEach((event, index) => {
        console.log(`    ${index + 1}. ${event.summary || "Untitled"}`);
        console.log(`       Start: ${event.start.dateTime}`);
      });
    }
  } catch (error) {
    console.log(
      "❌ Failed to access calendar:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.log("\nTroubleshooting:");
    console.log("1. Verify the calendar ID is correct");
    console.log(
      "2. Ensure the calendar is shared with the service account email:"
    );
    console.log(`   ${keyData.client_email}`);
    console.log(
      '3. Grant "Make changes to events" permission to the service account'
    );
    console.log(
      '4. If using "primary", ensure you\'re using the correct calendar'
    );
    process.exit(1);
  }

  // Test event creation (optional)
  console.log("\n🧪 Testing event creation...");
  console.log("Creating a test event...");

  try {
    const testStartTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const testEndTime = new Date(testStartTime.getTime() + 30 * 60 * 1000); // 30 minutes duration

    const testEvent = await calendarClient.createEvent(
      {
        summary: "[TEST] Booking System Validation",
        description:
          "This is a test event created by the deployment validation script. You can safely delete it.",
        startTime: testStartTime,
        endTime: testEndTime,
        attendees: [], // Service accounts can't add attendees without Domain-Wide Delegation
        timeZone: config.googleCalendar.timeZone,
      },
      config.googleCalendar.calendarId
    );

    console.log("✓ Successfully created test event");
    console.log(`  Event ID: ${testEvent.id}`);
    console.log(`  Summary: ${testEvent.summary}`);
    console.log(`  Start: ${testEvent.start.dateTime}`);

    // Clean up test event
    console.log("\n🧹 Cleaning up test event...");
    await calendarClient.deleteEvent(
      testEvent.id,
      config.googleCalendar.calendarId
    );
    console.log("✓ Test event deleted");
  } catch (error) {
    console.log(
      "⚠️  Event creation test failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.log("This may indicate insufficient permissions.");
    console.log(
      'Ensure the service account has "Make changes to events" permission.'
    );
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ GOOGLE CALENDAR INTEGRATION TEST PASSED");
  console.log("=".repeat(60));
  console.log("\nYour Google Calendar integration is properly configured.");
  console.log("\nConfiguration summary:");
  console.log(`  Service Account: ${keyData.client_email}`);
  console.log(`  Calendar ID: ${config.googleCalendar.calendarId}`);
  console.log(`  Timezone: ${config.googleCalendar.timeZone}`);
  console.log(`  Retry Attempts: ${config.googleCalendar.retryAttempts}`);
  console.log("\nThe booking system is ready to use Google Calendar.");
}

testGoogleCalendar().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
