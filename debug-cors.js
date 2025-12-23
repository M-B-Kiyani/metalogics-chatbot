#!/usr/bin/env node

/**
 * CORS Debug Script
 * Tests CORS configuration and API connectivity
 */

const https = require("https");

const BACKEND_URL = "https://metalogics-chatbot-production.up.railway.app";
const FRONTEND_URL = "https://frontend-production-metabot.up.railway.app";

console.log("🔍 CORS Debug Script\n");

// Test 1: Basic health check (no CORS)
async function testBasicHealth() {
  console.log("1️⃣ Testing basic health endpoint (no CORS)...");

  return new Promise((resolve) => {
    const req = https.request(
      `${BACKEND_URL}/api/health`,
      {
        method: "GET",
      },
      (res) => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            console.log("   ✅ Basic health check passed");
          } else {
            console.log("   ❌ Basic health check failed");
          }
          resolve();
        });
      }
    );

    req.on("error", (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

// Test 2: CORS preflight request
async function testCORSPreflight() {
  console.log("\n2️⃣ Testing CORS preflight request...");

  return new Promise((resolve) => {
    const req = https.request(
      `${BACKEND_URL}/api/bookings`,
      {
        method: "OPTIONS",
        headers: {
          Origin: FRONTEND_URL,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type,Authorization",
        },
      },
      (res) => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   CORS Headers:`);
        console.log(
          `     Access-Control-Allow-Origin: ${res.headers["access-control-allow-origin"]}`
        );
        console.log(
          `     Access-Control-Allow-Methods: ${res.headers["access-control-allow-methods"]}`
        );
        console.log(
          `     Access-Control-Allow-Headers: ${res.headers["access-control-allow-headers"]}`
        );
        console.log(
          `     Access-Control-Allow-Credentials: ${res.headers["access-control-allow-credentials"]}`
        );

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200 || res.statusCode === 204) {
            console.log("   ✅ CORS preflight passed");
          } else {
            console.log("   ❌ CORS preflight failed");
            console.log(`   Response: ${data}`);
          }
          resolve();
        });
      }
    );

    req.on("error", (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

// Test 3: Simple GET with Origin header
async function testCORSGet() {
  console.log("\n3️⃣ Testing GET request with Origin header...");

  return new Promise((resolve) => {
    const req = https.request(
      `${BACKEND_URL}/api/health`,
      {
        method: "GET",
        headers: {
          Origin: FRONTEND_URL,
        },
      },
      (res) => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(
          `   Access-Control-Allow-Origin: ${res.headers["access-control-allow-origin"]}`
        );

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            console.log("   ✅ CORS GET request passed");
          } else {
            console.log("   ❌ CORS GET request failed");
            console.log(`   Response: ${data}`);
          }
          resolve();
        });
      }
    );

    req.on("error", (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

// Test 4: Test available slots endpoint
async function testAvailableSlots() {
  console.log("\n4️⃣ Testing available slots endpoint...");

  return new Promise((resolve) => {
    const req = https.request(
      `${BACKEND_URL}/api/bookings/available-slots`,
      {
        method: "GET",
        headers: {
          Origin: FRONTEND_URL,
        },
      },
      (res) => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(
          `   Access-Control-Allow-Origin: ${res.headers["access-control-allow-origin"]}`
        );

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            console.log("   ✅ Available slots endpoint passed");
          } else {
            console.log("   ❌ Available slots endpoint failed");
            console.log(`   Response: ${data}`);
          }
          resolve();
        });
      }
    );

    req.on("error", (err) => {
      console.log(`   ❌ Error: ${err.message}`);
      resolve();
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}\n`);

  await testBasicHealth();
  await testCORSPreflight();
  await testCORSGet();
  await testAvailableSlots();

  console.log("\n📋 Debug Summary:");
  console.log("If all tests pass, CORS should be working correctly.");
  console.log("If tests fail, check Railway logs for detailed error messages.");
  console.log("\n💡 Next steps:");
  console.log("1. Wait for Railway deployment to complete (~2-3 minutes)");
  console.log("2. Run this script again to verify fixes");
  console.log("3. Test the frontend application");
}

runTests().catch(console.error);
