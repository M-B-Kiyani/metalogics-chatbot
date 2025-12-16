/**
 * Test script to verify Google Calendar integration is working
 * Tests all major calendar functions
 */

import { CalendarClient } from "../src/integrations/calendar.client";
import { CalendarService } from "../src/services/calendar.service";
import { addDays, setHours, setMinutes } from "date-fns";

async function testCalendarIntegration() {
  console.log("\n🧪 Testing Google Calendar Integration\n");
  console.log("=".repeat(60));

  try {
    // Step 1: Initialize Calendar Client
    console.log("\n1️⃣  Initializing Calendar Client...");
    const calendarClient = new CalendarClient();
    await calendarClient.initializeFromConfig();

    if (calendarClient.isAuthenticated()) {
      console.log("✅ Calendar client authenticated successfully");
    } else {
      console.log("❌ Calendar client authentication failed");
      return;
    }

    // Step 2: Initialize Calendar Service
    console.log("\n2️⃣  Initializing Calendar Service...");
    const calendarService = new CalendarService(calendarClient);
    console.log("✅ Calendar service initialized");

    // Step 3: Test Getting Events
    console.log("\n3️⃣  Testing getEvents()...");
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const events = await calendarClient.getEvents(now, tomorrow);
    console.log(`✅ Retrieved ${events.length} events from calendar`);

    if (events.length > 0) {
      console.log("\n   Sample event:");
      const event = events[0];
      console.log(`   - ID: ${event.id}`);
      console.log(`   - Summary: ${event.summary}`);
      console.log(`   - Start: ${event.start.dateTime}`);
      console.log(`   - Status: ${event.status}`);
    }

    // Step 4: Test Getting Busy Slots
    console.log("\n4️⃣  Testing getBusySlots()...");
    const busySlots = await calendarService.getBusySlots(now, tomorrow);
    console.log(`✅ Found ${busySlots.length} busy slots`);

    if (busySlots.length > 0) {
      console.log("\n   Sample busy slot:");
      const slot = busySlots[0];
      console.log(`   - Start: ${slot.startTime.toISOString()}`);
      console.log(`   - End: ${slot.endTime.toISOString()}`);
      console.log(`   - Duration: ${slot.duration} minutes`);
    }

    // Step 5: Test Getting Available Slots
    console.log("\n5️⃣  Testing getAvailableSlots()...");
    const nextWeek = addDays(now, 7);
    const availableSlots = await calendarService.getAvailableSlots(
      now,
      nextWeek,
      30 // 30-minute slots
    );
    console.log(`✅ Found ${availableSlots.length} available 30-minute slots`);

    if (availableSlots.length > 0) {
      console.log("\n   First 5 available slots:");
      availableSlots.slice(0, 5).forEach((slot, index) => {
        console.log(
          `   ${
            index + 1
          }. ${slot.startTime.toISOString()} - ${slot.endTime.toISOString()}`
        );
      });
    }

    // Step 6: Test Slot Availability Check
    console.log("\n6️⃣  Testing isSlotAvailable()...");

    // Test a slot that should be available (tomorrow at 10 AM)
    const testSlot = setMinutes(setHours(addDays(now, 1), 10), 0);
    const isAvailable = await calendarService.isSlotAvailable(testSlot, 30);
    console.log(
      `✅ Slot at ${testSlot.toISOString()} is ${
        isAvailable ? "AVAILABLE" : "BUSY"
      }`
    );

    // Step 7: Test Creating a Test Event (optional - commented out to avoid creating real events)
    console.log("\n7️⃣  Test Event Creation (skipped - uncomment to test)");
    console.log("   To test event creation, uncomment the code in this script");

    /*
    console.log("\n7️⃣  Testing createEvent()...");
    const testEventStart = addHours(now, 2);
    const testEventEnd = addHours(testEventStart, 0.5); // 30 minutes
    
    const testEvent = await calendarClient.createEvent({
      summary: "TEST - Calendar Integration Test",
      description: "This is a test event created by the calendar integration test script. Safe to delete.",
      startTime: testEventStart,
      endTime: testEventEnd,
      attendees: ["test@example.com"],
      timeZone: "Europe/London"
    });
    
    console.log(`✅ Test event created with ID: ${testEvent.id}`);
    
    // Clean up - delete the test event
    console.log("\n8️⃣  Cleaning up test event...");
    await calendarClient.deleteEvent(testEvent.id);
    console.log("✅ Test event deleted");
    */

    // Step 8: Get Business Hours
    console.log("\n8️⃣  Business Hours Configuration:");
    const businessHours = calendarService.getBusinessHours();
    console.log(
      `   - Days: ${businessHours.daysOfWeek.join(", ")} (0=Sun, 1=Mon, etc.)`
    );
    console.log(
      `   - Hours: ${businessHours.startHour}:00 - ${businessHours.endHour}:00`
    );
    console.log(`   - Timezone: ${businessHours.timeZone}`);
    console.log(`   - Buffer: ${businessHours.bufferMinutes} minutes`);
    console.log(`   - Min Advance: ${businessHours.minAdvanceHours} hours`);
    console.log(`   - Max Advance: ${businessHours.maxAdvanceHours} hours`);

    // Step 9: Circuit Breaker Stats
    console.log("\n9️⃣  Circuit Breaker Statistics:");
    const stats = calendarClient.getCircuitBreakerStats();
    console.log(`   - State: ${stats.state}`);
    console.log(`   - Failure Count: ${stats.failureCount}`);
    console.log(`   - Success Count: ${stats.successCount}`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("\n✅ All Calendar Integration Tests Passed!\n");
    console.log("Your Google Calendar integration is working correctly.");
    console.log("\nNext steps:");
    console.log("1. Test creating a booking via API: POST /api/bookings");
    console.log("2. Verify event appears in Google Calendar");
    console.log("3. Test cancelling booking and verify event is removed");
    console.log("\n");
  } catch (error) {
    console.error("\n❌ Calendar Integration Test Failed:");
    console.error(error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }

    console.log("\n💡 Troubleshooting:");
    console.log("1. Check GOOGLE_CALENDAR_ENABLED=true in backend/.env");
    console.log("2. Verify service account key file exists");
    console.log("3. Ensure calendar is shared with service account email");
    console.log(
      "4. Check service account has 'Make changes to events' permission"
    );
    process.exit(1);
  }
}

// Run the test
testCalendarIntegration();
