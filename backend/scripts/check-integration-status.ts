#!/usr/bin/env ts-node

/**
 * Simple Integration Status Check
 * Checks the configuration and basic connectivity of all integrations
 */

import { config } from "../src/config";
import { logger } from "../src/utils/logger";

async function checkIntegrationStatus() {
  console.log("🔍 Checking Integration Status");
  console.log("============================================================");

  // Database Configuration
  console.log("\n📊 DATABASE:");
  console.log(
    `   Status: ${config.database.url ? "✅ Configured" : "❌ Not configured"}`
  );
  console.log(`   Pool Size: ${config.database.poolSize}`);
  console.log(`   Connection Timeout: ${config.database.connectionTimeout}ms`);

  // Email Configuration
  console.log("\n📧 EMAIL:");
  console.log(`   SMTP Host: ${config.email.smtpHost}`);
  console.log(`   SMTP Port: ${config.email.smtpPort}`);
  console.log(`   From Email: ${config.email.fromEmail}`);
  console.log(
    `   Status: ${
      config.email.smtpHost && config.email.smtpUser
        ? "✅ Configured"
        : "❌ Not configured"
    }`
  );

  // Google Calendar Configuration
  console.log("\n📅 GOOGLE CALENDAR:");
  console.log(
    `   Enabled: ${config.googleCalendar.enabled ? "✅ Yes" : "❌ No"}`
  );
  if (config.googleCalendar.enabled) {
    console.log(
      `   Service Account: ${config.googleCalendar.serviceAccountEmail}`
    );
    console.log(`   Calendar ID: ${config.googleCalendar.calendarId}`);
    console.log(`   Timezone: ${config.googleCalendar.timeZone}`);
    console.log(
      `   Key Source: ${
        config.googleCalendar.serviceAccountKey
          ? "Environment Variable"
          : "File Path"
      }`
    );
  }

  // HubSpot Configuration
  console.log("\n🏢 HUBSPOT CRM:");
  console.log(`   Enabled: ${config.hubspot.enabled ? "✅ Yes" : "❌ No"}`);
  if (config.hubspot.enabled) {
    console.log(
      `   Access Token: ${
        config.hubspot.accessToken ? "✅ Configured" : "❌ Missing"
      }`
    );
    console.log(
      `   Token Preview: ${
        config.hubspot.accessToken
          ? config.hubspot.accessToken.substring(0, 10) + "..."
          : "N/A"
      }`
    );
  }

  // Retell AI Configuration
  console.log("\n🎤 RETELL AI:");
  console.log(`   Enabled: ${config.retell.enabled ? "✅ Yes" : "❌ No"}`);
  if (config.retell.enabled) {
    console.log(
      `   API Key: ${config.retell.apiKey ? "✅ Configured" : "❌ Missing"}`
    );
    console.log(
      `   Agent ID: ${config.retell.agentId ? "✅ Configured" : "❌ Missing"}`
    );
    console.log(
      `   Custom LLM URL: ${config.retell.customLlmUrl || "Not set"}`
    );
    console.log(`   Webhook URL: ${config.retell.webhookUrl || "Not set"}`);
  }

  // Gemini AI Configuration
  console.log("\n🤖 GEMINI AI:");
  console.log(
    `   API Key: ${config.gemini.apiKey ? "✅ Configured" : "❌ Missing"}`
  );
  console.log(
    `   Key Preview: ${
      config.gemini.apiKey
        ? config.gemini.apiKey.substring(0, 10) + "..."
        : "N/A"
    }`
  );

  // Server Configuration
  console.log("\n🖥️  SERVER:");
  console.log(`   Environment: ${config.server.nodeEnv}`);
  console.log(`   Port: ${config.server.port}`);
  console.log(`   API Base URL: ${config.server.apiBaseUrl}`);
  console.log(`   Request Timeout: ${config.server.requestTimeout}ms`);

  // Authentication
  console.log("\n🔐 AUTHENTICATION:");
  console.log(
    `   API Key: ${config.auth.apiKey ? "✅ Configured" : "❌ Missing"}`
  );
  console.log(
    `   Widget API Key: ${
      config.auth.widgetApiKey ? "✅ Configured" : "❌ Missing"
    }`
  );

  // Business Rules
  console.log("\n📋 BUSINESS RULES:");
  console.log(
    `   Business Days: ${config.bookingRules.businessHours.daysOfWeek.join(
      ", "
    )}`
  );
  console.log(
    `   Business Hours: ${config.bookingRules.businessHours.startHour}:00 - ${config.bookingRules.businessHours.endHour}:00`
  );
  console.log(`   Timezone: ${config.bookingRules.businessHours.timeZone}`);
  console.log(`   Buffer Minutes: ${config.bookingRules.bufferMinutes}`);
  console.log(
    `   Advance Booking: ${config.bookingRules.minAdvanceHours}-${config.bookingRules.maxAdvanceHours} hours`
  );

  console.log("\n============================================================");
  console.log("✅ Configuration check completed");
  console.log("============================================================");
}

// Run the check
checkIntegrationStatus().catch((error) => {
  console.error("❌ Error checking integration status:", error);
  process.exit(1);
});
