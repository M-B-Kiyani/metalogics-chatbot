#!/usr/bin/env ts-node

/**
 * Simple Google Calendar Integration Test
 */

import { CalendarClient } from "../src/integrations/calendar.client";

async function testCalendarIntegration() {
  console.log("📅 Testing Google Calendar Integration");
  console.log("============================================================");

  try {
    const calendarClient = new CalendarClient();

    console.log("🔍 Initializing calendar client...");
    await calendarClient.initializeFromConfig();

    console.log("✅ Calendar client initialized successfully");

    console.log("🔍 Testing calendar access...");
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1); // Next day

    const events = await calendarClient.getEvents(startDate, endDate);

    console.log(`✅ Successfully retrieved ${events.length} events`);
    console.log("📅 Google Calendar integration is working properly");
  } catch (error) {
    console.error(
      "❌ Calendar test failed:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

testCalendarIntegration();
