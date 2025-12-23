#!/usr/bin/env node

/**
 * Debug Railway database connection issues
 */

const https = require("https");

const BASE_URL = "https://metalogics-chatbot-production.up.railway.app";

async function testEndpoint(path, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${timeout}ms`));
    }, timeout);

    const req = https.get(`${BASE_URL}${path}`, (res) => {
      clearTimeout(timer);
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: parsed,
            success: res.statusCode === 200,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            success: res.statusCode === 200,
          });
        }
      });
    });

    req.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function debugDatabase() {
  console.log("🔍 Debugging Railway Database Connection...\n");

  // Test 1: Basic health (no database required)
  try {
    console.log("1️⃣ Testing basic health endpoint...");
    const health = await testEndpoint("/health", 5000);
    console.log(`   ✅ Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return; // If basic health fails, no point continuing
  }

  // Test 2: API health (requires database)
  try {
    console.log("\n2️⃣ Testing API health endpoint (requires database)...");
    const apiHealth = await testEndpoint("/api/health", 20000);
    console.log(`   ✅ Status: ${apiHealth.status}`);
    console.log(`   Response: ${JSON.stringify(apiHealth.data, null, 2)}`);

    if (apiHealth.success) {
      console.log("\n🎉 Database connection is working!");

      // Test 3: Available slots if database works
      console.log("\n3️⃣ Testing available slots...");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const slotsPath = `/api/bookings/available-slots?startDate=${tomorrow.toISOString()}&endDate=${nextWeek.toISOString()}&duration=30`;
      const slots = await testEndpoint(slotsPath, 20000);

      if (slots.success) {
        console.log(`   ✅ Available slots working!`);
        console.log(
          `   Found ${slots.data.data?.slots?.length || 0} available slots`
        );
        if (slots.data.data?.slots?.length > 0) {
          console.log(
            `   Sample slot: ${JSON.stringify(
              slots.data.data.slots[0],
              null,
              2
            )}`
          );
        }
      } else {
        console.log(`   ❌ Available slots failed: ${slots.status}`);
        console.log(`   Error: ${JSON.stringify(slots.data, null, 2)}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ API health failed: ${error.message}`);
    console.log("\n🔧 Database connection issues detected!");

    console.log("\n📋 Troubleshooting steps:");
    console.log("   1. Check Railway backend service logs for database errors");
    console.log(
      "   2. Verify DATABASE_URL is set to ${{ Postgres.DATABASE_URL }}"
    );
    console.log(
      "   3. Ensure PostgreSQL service is connected to backend service"
    );
    console.log("   4. Check if database migrations need to run");
    console.log("   5. Try redeploying the backend service");
  }

  console.log("\n🔍 Next steps:");
  console.log("   - Check Railway deployment logs in the backend service");
  console.log("   - Look for database connection errors or timeouts");
  console.log("   - Verify environment variables are properly set");
}

debugDatabase().catch(console.error);
