/**
 * Quick test script for available slots endpoint
 * Tests the Express 5.x query parameter fix
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:3000";

async function testAvailableSlots() {
  console.log("🧪 Testing Available Slots Endpoint...\n");

  try {
    // Calculate date range (today to 7 days from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration: 30,
    };

    console.log("📅 Request Parameters:");
    console.log(`   Start Date: ${params.startDate}`);
    console.log(`   End Date: ${params.endDate}`);
    console.log(`   Duration: ${params.duration} minutes\n`);

    console.log("🚀 Making request...");
    const response = await axios.get(
      `${API_BASE_URL}/api/bookings/available-slots`,
      {
        params,
        timeout: 10000,
      }
    );

    console.log("✅ SUCCESS!\n");
    console.log("📊 Response:");
    console.log(`   Status: ${response.status}`);
    console.log(`   Slots Found: ${response.data.data.slots.length}`);

    if (response.data.data.slots.length > 0) {
      console.log("\n📅 First 3 Available Slots:");
      response.data.data.slots
        .slice(0, 3)
        .forEach((slot: any, index: number) => {
          const start = new Date(slot.startTime);
          const end = new Date(slot.endTime);
          console.log(
            `   ${
              index + 1
            }. ${start.toLocaleString()} - ${end.toLocaleTimeString()}`
          );
        });
    }

    console.log("\n🎉 Test PASSED - Query parameters work correctly!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ FAILED!\n");

    if (error.response) {
      console.error("📛 Server Error:");
      console.error(`   Status: ${error.response.status}`);
      console.error(
        `   Message: ${error.response.data?.error?.message || error.message}`
      );

      if (
        error.response.data?.error?.message?.includes(
          "Cannot set property query"
        )
      ) {
        console.error(
          "\n⚠️  The Express 5.x query parameter issue still exists!"
        );
        console.error("   Make sure to:");
        console.error("   1. Stop the backend server");
        console.error("   2. Rebuild with: npm run build");
        console.error("   3. Restart with: start-server.bat");
      }
    } else if (error.code === "ECONNREFUSED") {
      console.error("📛 Connection Error:");
      console.error("   Backend server is not running!");
      console.error("   Start it with: cd backend && start-server.bat");
    } else {
      console.error("📛 Error:", error.message);
    }

    process.exit(1);
  }
}

// Run the test
testAvailableSlots();
