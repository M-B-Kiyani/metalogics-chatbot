#!/usr/bin/env node

/**
 * Check if Railway deployment is ready
 */

const https = require("https");

const BACKEND_URL = "https://metalogics-chatbot-production.up.railway.app";

async function checkDeployment() {
  console.log("🔍 Checking Railway deployment status...\n");

  // Test basic health
  console.log("1️⃣ Testing basic health endpoint...");
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log("   ✅ Health endpoint working:", data.status);
    } else {
      console.log("   ❌ Health endpoint failed:", response.status);
      return;
    }
  } catch (error) {
    console.log("   ❌ Health endpoint error:", error.message);
    return;
  }

  // Test available slots with short timeout
  console.log("\n2️⃣ Testing available slots endpoint (quick test)...");
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(
      `${BACKEND_URL}/api/bookings/available-slots?startDate=2025-12-24T00:00:00Z&endDate=2025-12-25T00:00:00Z&duration=30`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    console.log(`   Response time: ${duration}ms`);
    console.log(`   Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(
        `   ✅ Available slots working! Found ${
          data.data?.slots?.length || 0
        } slots`
      );
      console.log(
        "\n🎉 Deployment is ready! Frontend should now work properly."
      );
    } else {
      const errorText = await response.text();
      console.log(
        `   ⚠️ Available slots returned ${response.status}:`,
        errorText.substring(0, 100)
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    if (error.name === "AbortError") {
      console.log(
        `   ⏱️ Still timing out after ${duration}ms - deployment may still be in progress`
      );
    } else {
      console.log(`   ❌ Error after ${duration}ms:`, error.message);
    }
  }
}

// Use node-fetch polyfill for older Node versions
if (typeof fetch === "undefined") {
  global.fetch = require("node-fetch");
}

checkDeployment().catch(console.error);
