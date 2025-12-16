/**
 * Quick test to create a single booking and verify calendar integration
 */

import axios from "axios";
import { config } from "../src/config";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY || config.auth.apiKey;

async function testSingleBooking() {
  console.log("🧪 Testing Single Booking with Calendar Integration\n");

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  try {
    // Get available slots
    console.log("1️⃣ Getting available slots...");
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
    console.log(`✅ Found ${slots.length} available slots\n`);

    if (slots.length === 0) {
      console.error("❌ No available slots found");
      process.exit(1);
    }

    // Create booking - try multiple slots if needed
    console.log("2️⃣ Creating booking...");
    let bookingResponse;
    let bookingId;
    let bookingData;

    for (let i = 0; i < Math.min(5, slots.length); i++) {
      bookingData = {
        name: "Calendar Test User",
        company: "Calendar Test Company",
        email: `calendar-test-${Date.now()}@metalogics.io`,
        phone: "+1234567890",
        inquiry: "Testing calendar integration fix",
        timeSlot: {
          startTime: slots[i].startTime,
          duration: 30,
        },
      };

      try {
        bookingResponse = await apiClient.post("/api/bookings", bookingData);
        bookingId = bookingResponse.data.data.id;
        console.log(`✅ Booking created: ${bookingId}`);
        console.log(`   Email: ${bookingData.email}\n`);
        break;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          console.log(`   Slot ${i + 1} already booked, trying next...`);
          continue;
        }
        throw error;
      }
    }

    if (!bookingId) {
      console.error("❌ Could not create booking - all slots tried are booked");
      process.exit(1);
    }

    // Wait for async operations
    console.log("3️⃣ Waiting for async integrations (20 seconds)...");
    for (let i = 1; i <= 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      process.stdout.write(`\r   [${i}/20] Checking... `);

      const checkResponse = await apiClient.get(`/api/bookings/${bookingId}`);
      const booking = checkResponse.data.data;

      // Check if calendar synced
      if (booking.calendarSynced && booking.calendarEventId) {
        console.log("\n");
        console.log("✅ Calendar event created successfully!");
        console.log(`   Event ID: ${booking.calendarEventId}`);
        console.log(`   Synced in: ${i} seconds\n`);

        // Check CRM
        if (booking.crmSynced && booking.crmContactId) {
          console.log("✅ HubSpot contact created successfully!");
          console.log(`   Contact ID: ${booking.crmContactId}\n`);
        } else if (booking.requiresManualCrmSync) {
          console.log("⚠️  HubSpot sync failed (requires manual sync)\n");
        } else {
          console.log("⏳ HubSpot sync still in progress...\n");
        }

        // Cleanup
        console.log("4️⃣ Cleaning up...");
        await apiClient.delete(`/api/bookings/${bookingId}`);
        console.log("✅ Test booking cancelled\n");

        console.log("=".repeat(60));
        console.log("✅ TEST PASSED - Calendar integration working!");
        console.log("=".repeat(60));
        process.exit(0);
      }

      // Check if failed
      if (booking.requiresManualCalendarSync) {
        console.log("\n");
        console.log("❌ Calendar sync failed");
        console.log("   Check backend logs for detailed error\n");

        // Cleanup
        await apiClient.delete(`/api/bookings/${bookingId}`);
        process.exit(1);
      }
    }

    console.log("\n");
    console.log("⚠️  Calendar sync did not complete in 20 seconds");
    console.log("   This may indicate a performance issue\n");

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

testSingleBooking();
