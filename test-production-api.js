#!/usr/bin/env node

/**
 * Test Production API Health and Available Slots
 */

const https = require("https");

const BASE_URL = "https://metalogics-chatbot-production.up.railway.app";

function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on("error", reject);
  });
}

async function testAPI() {
  console.log("🔍 Testing Production API...\n");

  // Test 1: Health check
  console.log("1️⃣ Testing health endpoint...");
  try {
    const health = await makeRequest(`${BASE_URL}/health`, 5000);
    console.log(`✅ Health check: ${health.status}`);
    if (health.data) {
      console.log(`   Response: ${JSON.stringify(health.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }

  console.log("");

  // Test 2: API Health
  console.log("2️⃣ Testing API health endpoint...");
  try {
    const apiHealth = await makeRequest(`${BASE_URL}/api/health`, 5000);
    console.log(`✅ API health: ${apiHealth.status}`);
    if (apiHealth.data) {
      console.log(`   Response: ${JSON.stringify(apiHealth.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ API health failed: ${error.message}`);
  }

  console.log("");

  // Test 3: Available slots (3 days)
  console.log("3️⃣ Testing available slots (3 days)...");
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 3);

  const slotsUrl = `${BASE_URL}/api/bookings/available-slots?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&duration=30`;

  try {
    console.log(`   URL: ${slotsUrl}`);
    const slots = await makeRequest(slotsUrl, 20000); // 20 second timeout
    console.log(`✅ Available slots: ${slots.status}`);
    if (slots.data && slots.data.data) {
      console.log(`   Slots found: ${slots.data.data.slots.length}`);
      if (slots.data.data.slots.length > 0) {
        console.log(`   First slot: ${slots.data.data.slots[0].startTime}`);
      }
    }
  } catch (error) {
    console.log(`❌ Available slots failed: ${error.message}`);
  }

  console.log("");

  // Test 4: Available slots (1 day - should be faster)
  console.log("4️⃣ Testing available slots (1 day)...");
  const oneDayEnd = new Date();
  oneDayEnd.setDate(oneDayEnd.getDate() + 1);

  const oneDayUrl = `${BASE_URL}/api/bookings/available-slots?startDate=${startDate.toISOString()}&endDate=${oneDayEnd.toISOString()}&duration=30`;

  try {
    console.log(`   URL: ${oneDayUrl}`);
    const oneDay = await makeRequest(oneDayUrl, 15000); // 15 second timeout
    console.log(`✅ One day slots: ${oneDay.status}`);
    if (oneDay.data && oneDay.data.data) {
      console.log(`   Slots found: ${oneDay.data.data.slots.length}`);
    }
  } catch (error) {
    console.log(`❌ One day slots failed: ${error.message}`);
  }

  console.log("\n🏁 Test completed!");
}

testAPI().catch(console.error);
