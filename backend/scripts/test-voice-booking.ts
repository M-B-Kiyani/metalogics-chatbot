/**
 * Test script for voice-based appointment booking
 * Simulates voice conversation flow for booking appointments
 */

import { ConversationService } from "../src/services/conversation.service";
import { BookingService } from "../src/services/booking.service";
import { BookingRepository } from "../src/repositories/booking.repository";
import { NotificationService } from "../src/services/notification.service";
import { CalendarService } from "../src/services/calendar.service";
import { CRMService } from "../src/services/crm.service";
import { EmailClient } from "../src/integrations/email.client";
import { CalendarClient } from "../src/integrations/calendar.client";
import { HubSpotClient } from "../src/integrations/hubspot.client";
import { databaseClient } from "../src/config/database.client";
import { logger } from "../src/utils/logger";

async function testVoiceBooking() {
  console.log("🎤 Testing Voice-Based Appointment Booking\n");

  try {
    // Initialize database
    console.log("📦 Connecting to database...");
    await databaseClient.connect();
    console.log("✅ Database connected\n");

    // Initialize services
    const prismaClient = databaseClient.getClient();
    const bookingRepository = new BookingRepository(databaseClient);
    const emailClient = new EmailClient();
    const notificationService = new NotificationService(emailClient);
    const calendarClient = new CalendarClient();
    const calendarService = new CalendarService(calendarClient);
    const hubspotClient = new HubSpotClient();
    const crmService = new CRMService(hubspotClient);

    const bookingService = new BookingService(
      bookingRepository,
      notificationService,
      calendarService,
      crmService,
      prismaClient
    );

    const conversationService = new ConversationService(bookingService);

    console.log("✅ Services initialized\n");

    // Simulate voice conversation
    const sessionId = `voice-test-${Date.now()}`;
    console.log(`📞 Starting voice session: ${sessionId}\n`);

    // Test 1: Initial booking request
    console.log("👤 User: 'I'd like to book an appointment'\n");
    let result = await conversationService.processMessage(
      sessionId,
      "I'd like to book an appointment"
    );
    console.log(`🤖 AI: ${result.response}\n`);
    console.log(`📊 Intent: ${result.context.currentIntent}\n`);

    // Test 2: Provide name
    console.log("👤 User: 'My name is John Smith'\n");
    result = await conversationService.processMessage(
      sessionId,
      "My name is John Smith"
    );
    console.log(`🤖 AI: ${result.response}\n`);

    // Test 3: Provide email
    console.log("👤 User: 'john.smith@example.com'\n");
    result = await conversationService.processMessage(
      sessionId,
      "john.smith@example.com"
    );
    console.log(`🤖 AI: ${result.response}\n`);

    // Test 4: Provide date
    console.log("👤 User: 'Tomorrow'\n");
    result = await conversationService.processMessage(sessionId, "Tomorrow");
    console.log(`🤖 AI: ${result.response}\n`);

    // Test 5: Provide time
    console.log("👤 User: '2:00 PM'\n");
    result = await conversationService.processMessage(sessionId, "2:00 PM");
    console.log(`🤖 AI: ${result.response}\n`);

    // Check booking data
    if (result.context.bookingData) {
      console.log("📋 Collected Booking Data:");
      console.log(JSON.stringify(result.context.bookingData, null, 2));
      console.log();
    }

    // Test 6: Check availability
    console.log("\n--- Testing Availability Check ---\n");
    const availSessionId = `avail-test-${Date.now()}`;
    console.log("👤 User: 'What times are available tomorrow?'\n");
    result = await conversationService.processMessage(
      availSessionId,
      "What times are available tomorrow?"
    );
    console.log(`🤖 AI: ${result.response}\n`);

    // Test 7: Quick booking with all info
    console.log("\n--- Testing Quick Booking ---\n");
    const quickSessionId = `quick-test-${Date.now()}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    console.log(
      `👤 User: 'Book a meeting for ${dateStr} at 3 PM, my name is Sarah Johnson, email sarah.j@test.com'\n`
    );
    result = await conversationService.processMessage(
      quickSessionId,
      `Book a meeting for ${dateStr} at 3 PM, my name is Sarah Johnson, email sarah.j@test.com`
    );
    console.log(`🤖 AI: ${result.response}\n`);

    if (result.context.bookingData) {
      console.log("📋 Quick Booking Data:");
      console.log(JSON.stringify(result.context.bookingData, null, 2));
      console.log();
    }

    console.log("✅ Voice booking tests completed successfully!\n");

    // Cleanup
    conversationService.clearSession(sessionId);
    conversationService.clearSession(availSessionId);
    conversationService.clearSession(quickSessionId);

    console.log("🧹 Sessions cleaned up");
  } catch (error) {
    console.error("❌ Test failed:", error);
    logger.error("Voice booking test failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  } finally {
    // Disconnect database
    await databaseClient.disconnect();
    console.log("👋 Database disconnected");
  }
}

// Run the test
testVoiceBooking()
  .then(() => {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  });
