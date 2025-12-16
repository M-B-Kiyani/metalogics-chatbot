/**
 * Diagnostic Script for Booking Flow
 * Checks calendar, email, and HubSpot integrations
 */

import { PrismaClient } from "@prisma/client";
import { config } from "../src/config";
import { CalendarClient } from "../src/integrations/calendar.client";
import { EmailClient } from "../src/integrations/email.client";
import { HubSpotClient } from "../src/integrations/hubspot.client";

const prisma = new PrismaClient();

async function diagnoseBookingFlow() {
  console.log("=".repeat(80));
  console.log("BOOKING FLOW DIAGNOSTIC");
  console.log("=".repeat(80));
  console.log();

  // 1. Check Database Connection
  console.log("1️⃣  Checking Database Connection...");
  try {
    await prisma.$connect();
    const bookingCount = await prisma.booking.count();
    console.log(`   ✅ Database connected - ${bookingCount} total bookings`);
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error}`);
    return;
  }

  // 2. Check Recent Bookings
  console.log("\n2️⃣  Checking Recent Bookings...");
  try {
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        startTime: true,
        status: true,
        confirmationSent: true,
        calendarEventId: true,
        calendarSynced: true,
        requiresManualCalendarSync: true,
        crmContactId: true,
        crmSynced: true,
        requiresManualCrmSync: true,
        createdAt: true,
      },
    });

    if (recentBookings.length === 0) {
      console.log("   ⚠️  No bookings found in database");
    } else {
      console.log(`   Found ${recentBookings.length} recent bookings:\n`);
      recentBookings.forEach((booking, index) => {
        console.log(`   Booking ${index + 1}:`);
        console.log(`   - ID: ${booking.id}`);
        console.log(`   - Name: ${booking.name}`);
        console.log(`   - Email: ${booking.email}`);
        console.log(`   - Status: ${booking.status}`);
        console.log(`   - Created: ${booking.createdAt.toISOString()}`);
        console.log(
          `   - Confirmation Sent: ${booking.confirmationSent ? "✅" : "❌"}`
        );
        console.log(
          `   - Calendar Event ID: ${
            booking.calendarEventId
              ? "✅ " + booking.calendarEventId
              : "❌ null"
          }`
        );
        console.log(
          `   - Calendar Synced: ${booking.calendarSynced ? "✅" : "❌"}`
        );
        console.log(
          `   - Requires Manual Calendar Sync: ${
            booking.requiresManualCalendarSync ? "⚠️  YES" : "✅ NO"
          }`
        );
        console.log(
          `   - CRM Contact ID: ${
            booking.crmContactId ? "✅ " + booking.crmContactId : "❌ null"
          }`
        );
        console.log(`   - CRM Synced: ${booking.crmSynced ? "✅" : "❌"}`);
        console.log(
          `   - Requires Manual CRM Sync: ${
            booking.requiresManualCrmSync ? "⚠️  YES" : "✅ NO"
          }`
        );
        console.log();
      });
    }
  } catch (error) {
    console.log(`   ❌ Failed to fetch bookings: ${error}`);
  }

  // 3. Check Google Calendar Configuration
  console.log("3️⃣  Checking Google Calendar Configuration...");
  console.log(`   - Enabled: ${config.googleCalendar.enabled ? "✅" : "❌"}`);
  if (config.googleCalendar.enabled) {
    console.log(
      `   - Service Account: ${config.googleCalendar.serviceAccountEmail}`
    );
    console.log(`   - Calendar ID: ${config.googleCalendar.calendarId}`);
    console.log(
      `   - Key Path: ${config.googleCalendar.serviceAccountKeyPath}`
    );
    console.log(`   - Timezone: ${config.googleCalendar.timeZone}`);

    // Test calendar authentication
    try {
      const calendarClient = new CalendarClient();
      await calendarClient.initializeFromConfig();
      console.log("   ✅ Calendar authentication successful");

      // Try to fetch events
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const events = await calendarClient.getEvents(now, tomorrow);
      console.log(`   ✅ Calendar API working - ${events.length} events found`);
    } catch (error) {
      console.log(
        `   ❌ Calendar authentication/API failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  } else {
    console.log("   ⚠️  Google Calendar integration is disabled");
  }

  // 4. Check Email Configuration
  console.log("\n4️⃣  Checking Email Configuration...");
  console.log(`   - SMTP Host: ${config.email.smtpHost}`);
  console.log(`   - SMTP Port: ${config.email.smtpPort}`);
  console.log(`   - SMTP User: ${config.email.smtpUser}`);
  console.log(`   - From Email: ${config.email.fromEmail}`);
  console.log(`   - Admin Email: ${config.email.adminEmail}`);

  // Test email connection
  try {
    const emailClient = new EmailClient();
    // Note: EmailClient doesn't have a test method, so we just check if it initializes
    console.log("   ✅ Email client initialized");
    await emailClient.close();
  } catch (error) {
    console.log(
      `   ❌ Email client initialization failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // 5. Check HubSpot Configuration
  console.log("\n5️⃣  Checking HubSpot Configuration...");
  console.log(`   - Enabled: ${config.hubspot.enabled ? "✅" : "❌"}`);
  if (config.hubspot.enabled) {
    console.log(
      `   - Access Token: ${
        config.hubspot.accessToken
          ? "✅ " + config.hubspot.accessToken.substring(0, 20) + "..."
          : "❌ Not set"
      }`
    );

    // Test HubSpot authentication
    try {
      const hubspotClient = new HubSpotClient();
      await hubspotClient.initialize(config.hubspot.accessToken);
      console.log("   ✅ HubSpot authentication successful");

      // Try to search for a contact
      const contacts = await hubspotClient.searchContacts("test@example.com");
      console.log(`   ✅ HubSpot API working - search returned results`);
    } catch (error) {
      console.log(
        `   ❌ HubSpot authentication/API failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  } else {
    console.log("   ⚠️  HubSpot integration is disabled");
  }

  // 6. Summary
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));

  const issues: string[] = [];

  if (!config.googleCalendar.enabled) {
    issues.push("⚠️  Google Calendar is disabled");
  }

  if (!config.hubspot.enabled) {
    issues.push("⚠️  HubSpot is disabled");
  }

  // Check if recent bookings have issues
  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const bookingsWithoutCalendar = recentBookings.filter(
    (b) => !b.calendarEventId && config.googleCalendar.enabled
  ).length;
  const bookingsWithoutCRM = recentBookings.filter(
    (b) => !b.crmContactId && config.hubspot.enabled
  ).length;
  const bookingsWithoutConfirmation = recentBookings.filter(
    (b) => !b.confirmationSent
  ).length;

  if (bookingsWithoutCalendar > 0) {
    issues.push(
      `❌ ${bookingsWithoutCalendar} recent bookings missing calendar events`
    );
  }

  if (bookingsWithoutCRM > 0) {
    issues.push(
      `❌ ${bookingsWithoutCRM} recent bookings missing CRM contacts`
    );
  }

  if (bookingsWithoutConfirmation > 0) {
    issues.push(
      `❌ ${bookingsWithoutConfirmation} recent bookings missing confirmation emails`
    );
  }

  if (issues.length === 0) {
    console.log("\n✅ All systems operational!");
  } else {
    console.log("\n⚠️  Issues found:");
    issues.forEach((issue) => console.log(`   ${issue}`));
  }

  console.log("\n" + "=".repeat(80));

  await prisma.$disconnect();
}

// Run diagnostic
diagnoseBookingFlow()
  .then(() => {
    console.log("\n✅ Diagnostic complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Diagnostic failed:", error);
    process.exit(1);
  });
