#!/usr/bin/env node

/**
 * Test database connection after Railway PostgreSQL setup
 */

const https = require("https");

const BASE_URL = "https://metalogics-chatbot-production.up.railway.app";

async function testWithTimeout(path, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${timeout}ms`));
    }, timeout);

    const req = https.get(`${BASE_URL}${path}`, (res) => {
      clearTimeout(timer);
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          data: JSON.parse(data),
          success: res.statusCode === 200,
        });
      });
    });

    req.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function testDatabaseConnection() {
  console.log("🔍 Testing Railway Backend with PostgreSQL Connection...\n");

  // Test API Health (requires database)
  try {
    console.log("Testing /api/health (requires database connection)...");
    const result = await testWithTimeout("/api/health");

    if (result.success) {
      console.log("✅ Database connection working!");
      console.log("📊 Health Status:", JSON.stringify(result.data, null, 2));

      // If database works, test available slots
      console.log("\n🗓️ Testing available slots endpoint...");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const slotsPath = `/api/bookings/available-slots?startDate=${tomorrow.toISOString()}&endDate=${nextWeek.toISOString()}&duration=30`;
      const slotsResult = await testWithTimeout(slotsPath);

      if (slotsResult.success) {
        console.log("✅ Available slots endpoint working!");
        console.log(
          "📅 Sample slots:",
          JSON.stringify(slotsResult.data.slots?.slice(0, 3) || [], null, 2)
        );
      } else {
        console.log("❌ Available slots failed:", slotsResult.status);
      }
    } else {
      console.log("❌ API health failed with status:", result.status);
    }
  } catch (error) {
    console.log("❌ Database connection test failed:", error.message);
    console.log("\n🔧 This means:");
    console.log("   - Backend service needs to be redeployed");
    console.log("   - Or DATABASE_URL is not properly set");
    console.log("   - Or PostgreSQL service is not running");
  }

  console.log("\n📋 Next steps if still failing:");
  console.log("   1. Redeploy backend service in Railway Dashboard");
  console.log("   2. Check Railway deployment logs for errors");
  console.log(
    "   3. Verify DATABASE_URL is set to ${{ Postgres.DATABASE_URL }}"
  );
  console.log('   4. Ensure PostgreSQL service is "Active" status');
}

testDatabaseConnection().catch(console.error);
