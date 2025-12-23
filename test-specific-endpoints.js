#!/usr/bin/env node

/**
 * Test specific Railway endpoints to isolate the issue
 */

const https = require("https");

const BASE_URL = "https://metalogics-chatbot-production.up.railway.app";

async function testEndpoint(path, timeout = 8000) {
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

async function testSpecificEndpoints() {
  console.log("🔍 Testing Specific Railway Endpoints...\n");

  // Test 1: Root endpoint
  try {
    console.log("1️⃣ Testing root endpoint (/)...");
    const root = await testEndpoint("/", 5000);
    console.log(`   ✅ Status: ${root.status}`);
    console.log(`   Response: ${JSON.stringify(root.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 2: Basic health endpoint
  try {
    console.log("\n2️⃣ Testing basic health endpoint (/health)...");
    const health = await testEndpoint("/health", 5000);
    console.log(`   ✅ Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 3: API health endpoint (shorter timeout)
  try {
    console.log(
      "\n3️⃣ Testing API health endpoint (/api/health) - short timeout..."
    );
    const apiHealth = await testEndpoint("/api/health", 5000);
    console.log(`   ✅ Status: ${apiHealth.status}`);
    console.log(`   Response: ${JSON.stringify(apiHealth.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  // Test 4: Available slots with very short timeout
  try {
    console.log("\n4️⃣ Testing available slots endpoint - short timeout...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 3); // Shorter range

    const slotsPath = `/api/bookings/available-slots?startDate=${tomorrow.toISOString()}&endDate=${nextWeek.toISOString()}&duration=30`;
    console.log(`   URL: ${slotsPath}`);

    const slots = await testEndpoint(slotsPath, 5000);
    console.log(`   ✅ Status: ${slots.status}`);
    console.log(`   Response: ${JSON.stringify(slots.data, null, 2)}`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
  }

  console.log("\n📋 Analysis:");
  console.log("   - If root and /health work but /api/* endpoints timeout:");
  console.log(
    "     → Database query issue (tables might not exist or query is slow)"
  );
  console.log("   - If all endpoints timeout:");
  console.log("     → Server configuration issue");
  console.log("   - Check Railway logs for specific database errors");
}

testSpecificEndpoints().catch(console.error);
