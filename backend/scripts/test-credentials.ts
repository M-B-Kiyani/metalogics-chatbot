/**
 * Test Google Calendar and HubSpot credentials
 */

import { config } from "../src/config";
import { CalendarClient } from "../src/integrations/calendar.client";
import { HubSpotClient } from "../src/integrations/hubspot.client";

async function testCredentials() {
  console.log("=".repeat(80));
  console.log("TESTING CREDENTIALS");
  console.log("=".repeat(80));
  console.log();

  // Test Google Calendar
  console.log("1️⃣  Testing Google Calendar...");
  console.log(`   Enabled: ${config.googleCalendar.enabled}`);

  if (config.googleCalendar.enabled) {
    console.log(
      `   Service Account: ${config.googleCalendar.serviceAccountEmail}`
    );
    console.log(`   Key Path: ${config.googleCalendar.serviceAccountKeyPath}`);
    console.log(`   Calendar ID: ${config.googleCalendar.calendarId}`);
    console.log();

    try {
      const calendarClient = new CalendarClient();
      await calendarClient.initializeFromConfig();
      console.log("   ✅ Calendar authentication successful!");

      // Try to fetch events
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const events = await calendarClient.getEvents(now, tomorrow);
      console.log(`   ✅ Calendar API working - ${events.length} events found`);
      console.log();
    } catch (error) {
      console.log("   ❌ Calendar authentication failed!");
      console.log(
        `   Error: ${error instanceof Error ? error.message : String(error)}`
      );
      console.log();
    }
  } else {
    console.log("   ⚠️  Google Calendar is disabled");
    console.log();
  }

  // Test HubSpot
  console.log("2️⃣  Testing HubSpot...");
  console.log(`   Enabled: ${config.hubspot.enabled}`);

  if (config.hubspot.enabled) {
    const token = config.hubspot.accessToken;
    console.log(
      `   Access Token: ${
        token ? token.substring(0, 20) + "..." : "❌ Not set"
      }`
    );
    console.log();

    try {
      const hubspotClient = new HubSpotClient();
      await hubspotClient.initialize(token);
      console.log("   ✅ HubSpot authentication successful!");

      // Try to search for a contact
      const contacts = await hubspotClient.searchContacts("test@example.com");
      console.log(`   ✅ HubSpot API working - search completed`);
      console.log();
    } catch (error) {
      console.log("   ❌ HubSpot authentication failed!");
      console.log(
        `   Error: ${error instanceof Error ? error.message : String(error)}`
      );
      console.log();
    }
  } else {
    console.log("   ⚠️  HubSpot is disabled");
    console.log();
  }

  console.log("=".repeat(80));
  console.log("CREDENTIAL TEST COMPLETE");
  console.log("=".repeat(80));
}

testCredentials()
  .then(() => {
    console.log("\n✅ Test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
