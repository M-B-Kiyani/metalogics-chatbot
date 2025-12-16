/**
 * Quick integration test to verify Calendar and HubSpot are working
 */

import axios from "axios";
import { config } from "../src/config";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY || config.auth.apiKey;

async function testIntegrations() {
  console.log("Testing Integrations...\n");

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  try {
    // Get available slots (look ahead 7 days to ensure we find slots)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const slotsResponse = await apiClient.get("/api/bookings/available-slots", {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        duration: 30,
      },
    });

    const slots = slotsResponse.data.data.slots;
    if (slots.length === 0) {
      console.error("❌ No available slots found");
      process.exit(1);
    }

    console.log(`✅ Found ${slots.length} available slots\n`);

    // Create a test booking
    const bookingData = {
      name: "Integration Test User",
      company: "Integration Test Company",
      email: `integration-test-${Date.now()}@metalogics.io`,
      phone: "+1234567890",
      inquiry: "Integration test booking",
      timeSlot: {
        startTime: slots[0].startTime,
        duration: 30,
      },
    };

    console.log("Creating test booking...");
    const bookingResponse = await apiClient.post("/api/bookings", bookingData);
    const bookingId = bookingResponse.data.data.id;
    console.log(`✅ Booking created: ${bookingId}\n`);

    // Poll for integration completion
    console.log("Waiting for integrations to complete...");
    for (let i = 1; i <= 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const checkResponse = await apiClient.get(`/api/bookings/${bookingId}`);
      const booking = checkResponse.data.data;

      process.stdout.write(`\r[${i}/20] Checking... `);

      const calendarDone =
        booking.calendarSynced || !config.googleCalendar.enabled;
      const crmDone = booking.crmSynced || !config.hubspot.enabled;

      if (calendarDone && crmDone) {
        console.log("\n");
        console.log("✅ All integrations completed!");
        console.log(
          `   Calendar: ${
            booking.calendarSynced ? "✅ Synced" : "⏭️  Disabled"
          } ${booking.calendarEventId ? `(${booking.calendarEventId})` : ""}`
        );
        console.log(
          `   HubSpot:  ${booking.crmSynced ? "✅ Synced" : "⏭️  Disabled"} ${
            booking.crmContactId ? `(${booking.crmContactId})` : ""
          }`
        );
        console.log(
          `   Email:    ${booking.confirmationSent ? "✅ Sent" : "❌ Not sent"}`
        );

        // Cleanup
        console.log("\nCleaning up...");
        await apiClient.delete(`/api/bookings/${bookingId}`);
        console.log("✅ Test booking cancelled\n");

        process.exit(0);
      }

      // Check for failures
      if (booking.requiresManualCalendarSync) {
        console.log("\n❌ Calendar sync failed");
        console.log("   Check backend logs for details");
      }
      if (booking.requiresManualCrmSync) {
        console.log("\n❌ CRM sync failed");
        console.log("   Check backend logs for details");
      }

      if (booking.requiresManualCalendarSync || booking.requiresManualCrmSync) {
        // Cleanup
        await apiClient.delete(`/api/bookings/${bookingId}`);
        process.exit(1);
      }
    }

    console.log("\n⚠️  Integrations did not complete in 20 seconds");
    console.log("   This may indicate a performance issue");

    // Cleanup
    await apiClient.delete(`/api/bookings/${bookingId}`);
    process.exit(1);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("\n❌ Test failed:", error.response?.data || error.message);
    } else {
      console.error("\n❌ Test failed:", error);
    }
    process.exit(1);
  }
}

testIntegrations();
