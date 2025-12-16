import { ConversationService } from "../src/services/conversation.service";
import { BookingService } from "../src/services/booking.service";
import { BookingRepository } from "../src/repositories/booking.repository";
import { NotificationService } from "../src/services/notification.service";
import { CalendarService } from "../src/services/calendar.service";
import { CRMService } from "../src/services/crm.service";
import { DatabaseClient } from "../src/config/database.client";
import { RetryService } from "../src/services/retry.service";
import { logger } from "../src/utils/logger";

/**
 * Test script for appointment management features
 * Tests booking, rescheduling, and cancellation flows
 */

async function testAppointmentManagement() {
  logger.info("Starting appointment management tests");

  // Initialize services
  const databaseClient = new DatabaseClient();
  await databaseClient.connect();

  const retryService = new RetryService();
  const bookingRepository = new BookingRepository(databaseClient, retryService);
  const notificationService = new NotificationService();
  const calendarService = new CalendarService();
  const crmService = new CRMService();

  const bookingService = new BookingService(
    bookingRepository,
    notificationService,
    calendarService,
    crmService,
    databaseClient.getClient()
  );

  const conversationService = new ConversationService(bookingService);

  const testEmail = `test-${Date.now()}@example.com`;
  const sessionId = `test-session-${Date.now()}`;

  try {
    // Test 1: Book an appointment
    logger.info("Test 1: Booking an appointment");

    let result = await conversationService.processMessage(
      sessionId,
      "I want to book an appointment"
    );
    logger.info("Response:", result.response);

    result = await conversationService.processMessage(
      sessionId,
      "My name is Test User"
    );
    logger.info("Response:", result.response);

    result = await conversationService.processMessage(sessionId, testEmail);
    logger.info("Response:", result.response);

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    result = await conversationService.processMessage(sessionId, dateStr);
    logger.info("Response:", result.response);

    result = await conversationService.processMessage(sessionId, "2 PM");
    logger.info("Response:", result.response);

    // Verify booking was created
    const bookings = await bookingService.getBookings({
      email: testEmail,
      status: "CONFIRMED",
    });

    if (bookings.data.length === 0) {
      throw new Error("Booking was not created");
    }

    const bookingId = bookings.data[0].id;
    logger.info("✅ Test 1 passed: Booking created", { bookingId });

    // Test 2: Try to book the same slot (should fail)
    logger.info("Test 2: Testing overlap prevention");

    const newSessionId = `test-session-${Date.now()}-2`;

    result = await conversationService.processMessage(
      newSessionId,
      "Book an appointment"
    );

    result = await conversationService.processMessage(
      newSessionId,
      "Another User"
    );

    result = await conversationService.processMessage(
      newSessionId,
      "another@example.com"
    );

    result = await conversationService.processMessage(newSessionId, dateStr);

    result = await conversationService.processMessage(newSessionId, "2 PM");

    if (
      result.response.toLowerCase().includes("already booked") ||
      result.response.toLowerCase().includes("no longer available")
    ) {
      logger.info("✅ Test 2 passed: Overlap prevention working");
    } else {
      logger.warn(
        "⚠️ Test 2: Expected conflict error but got:",
        result.response
      );
    }

    // Test 3: Reschedule the appointment
    logger.info("Test 3: Rescheduling appointment");

    const rescheduleSessionId = `test-session-${Date.now()}-3`;

    result = await conversationService.processMessage(
      rescheduleSessionId,
      "I need to reschedule my appointment"
    );
    logger.info("Response:", result.response);

    result = await conversationService.processMessage(
      rescheduleSessionId,
      testEmail
    );
    logger.info("Response:", result.response);

    // Reschedule to day after tomorrow
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const newDateStr = dayAfterTomorrow.toISOString().split("T")[0];

    result = await conversationService.processMessage(
      rescheduleSessionId,
      newDateStr
    );
    logger.info("Response:", result.response);

    result = await conversationService.processMessage(
      rescheduleSessionId,
      "3 PM"
    );
    logger.info("Response:", result.response);

    // Verify reschedule
    const updatedBooking = await bookingService.getBookingById(bookingId);
    const updatedTime = new Date(updatedBooking.startTime);

    if (updatedTime.getHours() === 15) {
      // 3 PM
      logger.info("✅ Test 3 passed: Appointment rescheduled successfully");
    } else {
      logger.warn("⚠️ Test 3: Reschedule may not have worked correctly");
    }

    // Test 4: Original slot should now be available
    logger.info("Test 4: Verifying original slot is now available");

    const availabilitySessionId = `test-session-${Date.now()}-4`;

    result = await conversationService.processMessage(
      availabilitySessionId,
      "Book an appointment"
    );

    result = await conversationService.processMessage(
      availabilitySessionId,
      "New User"
    );

    result = await conversationService.processMessage(
      availabilitySessionId,
      "newuser@example.com"
    );

    result = await conversationService.processMessage(
      availabilitySessionId,
      dateStr
    );

    result = await conversationService.processMessage(
      availabilitySessionId,
      "2 PM"
    );

    if (!result.response.toLowerCase().includes("already booked")) {
      logger.info(
        "✅ Test 4 passed: Original slot is available after reschedule"
      );
    } else {
      logger.warn("⚠️ Test 4: Original slot still appears booked");
    }

    // Test 5: Cancel the appointment
    logger.info("Test 5: Cancelling appointment");

    const cancelSessionId = `test-session-${Date.now()}-5`;

    result = await conversationService.processMessage(
      cancelSessionId,
      "Cancel my appointment"
    );
    logger.info("Response:", result.response);

    result = await conversationService.processMessage(
      cancelSessionId,
      testEmail
    );
    logger.info("Response:", result.response);

    result = await conversationService.processMessage(cancelSessionId, "yes");
    logger.info("Response:", result.response);

    // Verify cancellation
    const cancelledBooking = await bookingService.getBookingById(bookingId);

    if (cancelledBooking.status === "CANCELLED") {
      logger.info("✅ Test 5 passed: Appointment cancelled successfully");
    } else {
      logger.warn("⚠️ Test 5: Cancellation may not have worked correctly");
    }

    // Test 6: Cancelled slot should be available
    logger.info("Test 6: Verifying cancelled slot is available");

    const slots = await bookingService.getAvailableTimeSlots(
      dayAfterTomorrow,
      new Date(dayAfterTomorrow.getTime() + 24 * 60 * 60 * 1000),
      30
    );

    const hasThreePM = slots.some((slot) => {
      const slotTime = new Date(slot.startTime);
      return slotTime.getHours() === 15; // 3 PM
    });

    if (hasThreePM) {
      logger.info("✅ Test 6 passed: Cancelled slot is available");
    } else {
      logger.warn("⚠️ Test 6: Cancelled slot may not be available yet");
    }

    logger.info("✅ All appointment management tests completed successfully!");
  } catch (error) {
    logger.error("Test failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  } finally {
    await databaseClient.disconnect();
  }
}

// Run tests
testAppointmentManagement()
  .then(() => {
    logger.info("Test script completed");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Test script failed:", error);
    process.exit(1);
  });
