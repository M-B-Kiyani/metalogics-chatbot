import { ConversationService } from "../src/services/conversation.service";
import { BookingService } from "../src/services/booking.service";
import { logger } from "../src/utils/logger";

/**
 * Test script to diagnose booking flow issues
 */
async function testBookingFlow() {
  console.log("🧪 Testing Booking Flow...\n");

  try {
    // Initialize services
    const bookingService = new BookingService();
    const conversationService = new ConversationService(bookingService);

    const sessionId = `test-${Date.now()}`;

    // Test 1: Initial booking request
    console.log("📝 Test 1: Initial booking request");
    const step1 = await conversationService.processMessage(
      sessionId,
      "I want to book an appointment"
    );
    console.log("Response:", step1.response);
    console.log("Intent:", step1.context.currentIntent);
    console.log("Booking Data:", step1.context.bookingData);
    console.log("");

    // Test 2: Provide name
    console.log("📝 Test 2: Provide name");
    const step2 = await conversationService.processMessage(
      sessionId,
      "My name is John Smith"
    );
    console.log("Response:", step2.response);
    console.log("Booking Data:", step2.context.bookingData);
    console.log("");

    // Test 3: Provide email
    console.log("📝 Test 3: Provide email");
    const step3 = await conversationService.processMessage(
      sessionId,
      "john.smith@example.com"
    );
    console.log("Response:", step3.response);
    console.log("Booking Data:", step3.context.bookingData);
    console.log("");

    // Test 4: Provide date
    console.log("📝 Test 4: Provide date");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const step4 = await conversationService.processMessage(
      sessionId,
      `Tomorrow (${dateStr})`
    );
    console.log("Response:", step4.response);
    console.log("Booking Data:", step4.context.bookingData);
    console.log("");

    // Test 5: Provide time
    console.log("📝 Test 5: Provide time");
    const step5 = await conversationService.processMessage(
      sessionId,
      "2:00 PM"
    );
    console.log("Response:", step5.response);
    console.log("Booking Data:", step5.context.bookingData);
    console.log("Intent after completion:", step5.context.currentIntent);
    console.log("");

    // Test 6: Quick booking (all info at once)
    console.log("📝 Test 6: Quick booking (all info at once)");
    const sessionId2 = `test-quick-${Date.now()}`;
    const tomorrow2 = new Date();
    tomorrow2.setDate(tomorrow2.getDate() + 2);
    const dateStr2 = tomorrow2.toISOString().split("T")[0];

    const quickBooking = await conversationService.processMessage(
      sessionId2,
      `Book me for ${dateStr2} at 3 PM, my name is Jane Doe, email jane@example.com`
    );
    console.log("Response:", quickBooking.response);
    console.log("Booking Data:", quickBooking.context.bookingData);
    console.log("Intent:", quickBooking.context.currentIntent);
    console.log("");

    console.log("✅ All tests completed!");
    console.log("\n📊 Summary:");
    console.log("- Step-by-step booking: Check if all fields were collected");
    console.log("- Quick booking: Check if all fields were extracted");
    console.log("- If booking didn't complete, check which fields are missing");
  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }

  process.exit(0);
}

// Run the test
testBookingFlow();
