/**
 * Test a single booking and monitor integration status
 */

import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { config } from "../src/config";

const API_BASE_URL = "http://localhost:3000";
const API_KEY = config.auth.apiKey;
const prisma = new PrismaClient();

async function testBooking() {
  console.log("=".repeat(80));
  console.log("SINGLE BOOKING DEBUG TEST");
  console.log("=".repeat(80));
  console.log();

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  try {
    // 1. Get available slots
    console.log("1️⃣  Getting available slots...");
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
      console.error("   ❌ No available slots found");
      process.exit(1);
    }

    console.log(`   ✅ Found ${slots.length} available slots`);
    console.log();

    // 2. Create booking (try multiple slots if needed)
    console.log("2️⃣  Creating booking...");
    let bookingResponse: any;
    let bookingId: string | undefined;

    for (let i = 0; i < Math.min(5, slots.length); i++) {
      try {
        console.log(
          `   Trying slot ${i + 1}: ${new Date(
            slots[i].startTime
          ).toLocaleString()}`
        );

        const bookingData = {
          name: "Debug Test User",
          company: "Debug Test Company",
          email: `debug-test-${Date.now()}@metalogics.io`,
          phone: "+1234567890",
          inquiry: "Debug test booking - checking integrations",
          timeSlot: {
            startTime: slots[i].startTime,
            duration: 30,
          },
        };

        bookingResponse = await apiClient.post("/api/bookings", bookingData);
        bookingId = bookingResponse.data.data.id;
        console.log(`   ✅ Booking created: ${bookingId}`);
        console.log(`   Email: ${bookingData.email}`);
        break;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          console.log(`   ⚠️  Slot ${i + 1} already booked, trying next...`);
          continue;
        }
        throw error;
      }
    }

    if (!bookingId) {
      console.error("   ❌ Could not find an available slot");
      await prisma.$disconnect();
      process.exit(1);
    }
    console.log();

    // 3. Monitor integration status
    console.log("3️⃣  Monitoring integration status...");
    console.log("   (Checking every second for 30 seconds)");
    console.log();

    for (let i = 1; i <= 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check via API
      const apiResponse = await apiClient.get(`/api/bookings/${bookingId}`);
      const apiBooking = apiResponse.data.data;

      console.log(`   [${i}/30] Status:`);
      console.log(
        `      Confirmation Email: ${
          apiBooking.confirmationSent ? "✅ Sent" : "⏳ Pending"
        }`
      );
      console.log(
        `      Calendar Event:     ${
          apiBooking.calendarEventId
            ? `✅ Created (${apiBooking.calendarEventId})`
            : apiBooking.requiresManualCalendarSync
            ? "❌ Failed"
            : "⏳ Pending"
        }`
      );
      console.log(
        `      HubSpot Contact:    ${
          apiBooking.crmContactId
            ? `✅ Created (${apiBooking.crmContactId})`
            : apiBooking.requiresManualCrmSync
            ? "❌ Failed"
            : "⏳ Pending"
        }`
      );

      // Check if all done
      const calendarDone =
        apiBooking.calendarSynced || !config.googleCalendar.enabled;
      const crmDone = apiBooking.crmSynced || !config.hubspot.enabled;
      const emailDone = apiBooking.confirmationSent;

      if (calendarDone && crmDone && emailDone) {
        console.log();
        console.log("   ✅ All integrations completed successfully!");
        console.log();
        break;
      }

      // Check for failures
      if (apiBooking.requiresManualCalendarSync) {
        console.log();
        console.log("   ❌ Calendar sync failed!");
        console.log("   Check backend logs for error details");
        console.log();
        break;
      }

      if (apiBooking.requiresManualCrmSync) {
        console.log();
        console.log("   ❌ HubSpot sync failed!");
        console.log("   Check backend logs for error details");
        console.log();
        break;
      }

      if (i === 30) {
        console.log();
        console.log(
          "   ⚠️  Timeout: Integrations did not complete in 30 seconds"
        );
        console.log();
      }
    }

    // 4. Final status check
    console.log("4️⃣  Final Status:");
    const finalBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    console.log();
    console.log("   Database Record:");
    console.log(`   - ID: ${finalBooking?.id}`);
    console.log(`   - Name: ${finalBooking?.name}`);
    console.log(`   - Email: ${finalBooking?.email}`);
    console.log(`   - Status: ${finalBooking?.status}`);
    console.log(
      `   - Confirmation Sent: ${finalBooking?.confirmationSent ? "✅" : "❌"}`
    );
    console.log(
      `   - Calendar Event ID: ${finalBooking?.calendarEventId || "❌ null"}`
    );
    console.log(
      `   - Calendar Synced: ${finalBooking?.calendarSynced ? "✅" : "❌"}`
    );
    console.log(
      `   - Requires Manual Calendar Sync: ${
        finalBooking?.requiresManualCalendarSync ? "⚠️  YES" : "✅ NO"
      }`
    );
    console.log(
      `   - CRM Contact ID: ${finalBooking?.crmContactId || "❌ null"}`
    );
    console.log(`   - CRM Synced: ${finalBooking?.crmSynced ? "✅" : "❌"}`);
    console.log(
      `   - Requires Manual CRM Sync: ${
        finalBooking?.requiresManualCrmSync ? "⚠️  YES" : "✅ NO"
      }`
    );
    console.log();

    // 5. Cleanup
    console.log("5️⃣  Cleaning up...");
    await apiClient.delete(`/api/bookings/${bookingId}`);
    console.log("   ✅ Test booking cancelled");
    console.log();

    console.log("=".repeat(80));
    console.log("TEST COMPLETE");
    console.log("=".repeat(80));

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:");
    if (axios.isAxiosError(error)) {
      console.error("   Status:", error.response?.status);
      console.error("   Data:", JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error("   Error:", error);
    }

    await prisma.$disconnect();
    process.exit(1);
  }
}

testBooking();
