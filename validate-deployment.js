#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Validates that all three services are properly deployed and working
 */

const https = require("https");
const http = require("http");

// Configuration
const BACKEND_URL =
  process.env.BACKEND_URL || "https://latest-chatbot-production.up.railway.app";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://frontend-service.up.railway.app";
const WIDGET_URL =
  process.env.WIDGET_URL || "https://widget-service.up.railway.app";
const WIDGET_API_KEY = process.env.WIDGET_API_KEY || "test-widget-key";

console.log("🚀 Validating Railway Deployment...\n");

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    const req = client.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test functions
async function testBackendHealth() {
  console.log("1️⃣ Testing Backend Health...");

  try {
    const response = await makeRequest(`${BACKEND_URL}/health`);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      console.log("   ✅ Backend health check passed");
      console.log(`   📊 Status: ${data.status}`);
      console.log(`   ⏱️  Uptime: ${data.uptime}s`);
      return true;
    } else {
      console.log(`   ❌ Backend health check failed (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Backend health check error: ${error.message}`);
    return false;
  }
}

async function testBackendAPI() {
  console.log("2️⃣ Testing Backend API...");

  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health`);

    if (response.statusCode === 200) {
      console.log("   ✅ Backend API accessible");
      return true;
    } else {
      console.log(`   ❌ Backend API failed (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Backend API error: ${error.message}`);
    return false;
  }
}

async function testWidgetEndpoint() {
  console.log("3️⃣ Testing Widget API Endpoint...");

  try {
    const response = await makeRequest(`${BACKEND_URL}/api/widget/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": WIDGET_API_KEY,
      },
      body: JSON.stringify({
        message: "Hello, this is a test message",
        sessionId: "test-session",
      }),
    });

    if (response.statusCode === 200 || response.statusCode === 401) {
      console.log("   ✅ Widget endpoint accessible");
      if (response.statusCode === 401) {
        console.log("   ⚠️  Authentication required (expected)");
      }
      return true;
    } else {
      console.log(`   ❌ Widget endpoint failed (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Widget endpoint error: ${error.message}`);
    return false;
  }
}

async function testFrontend() {
  console.log("4️⃣ Testing Frontend...");

  try {
    const response = await makeRequest(FRONTEND_URL);

    if (response.statusCode === 200 && response.data.includes("html")) {
      console.log("   ✅ Frontend accessible");
      return true;
    } else {
      console.log(`   ❌ Frontend failed (${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Frontend error: ${error.message}`);
    return false;
  }
}

async function testWidgetFiles() {
  console.log("5️⃣ Testing Widget Files...");

  try {
    // Test JS file
    const jsResponse = await makeRequest(
      `${WIDGET_URL}/metalogics-chatbot.iife.js`
    );
    const jsOk =
      jsResponse.statusCode === 200 &&
      jsResponse.data.includes("MetalogicsChatbot");

    // Test CSS file
    const cssResponse = await makeRequest(
      `${WIDGET_URL}/metalogics-chatbot.css`
    );
    const cssOk = cssResponse.statusCode === 200;

    if (jsOk && cssOk) {
      console.log("   ✅ Widget files accessible");
      console.log("   📄 JavaScript file loaded");
      console.log("   🎨 CSS file loaded");
      return true;
    } else {
      console.log("   ❌ Widget files failed");
      if (!jsOk) console.log("   📄 JavaScript file missing or invalid");
      if (!cssOk) console.log("   🎨 CSS file missing");
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Widget files error: ${error.message}`);
    return false;
  }
}

async function testCORS() {
  console.log("6️⃣ Testing CORS Configuration...");

  try {
    const response = await makeRequest(`${BACKEND_URL}/api/widget/chat`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type,x-api-key",
      },
    });

    const corsHeaders = response.headers["access-control-allow-origin"];
    const allowedMethods = response.headers["access-control-allow-methods"];
    const allowedHeaders = response.headers["access-control-allow-headers"];

    if (corsHeaders && allowedMethods && allowedHeaders) {
      console.log("   ✅ CORS properly configured");
      console.log(`   🌐 Allowed origins: ${corsHeaders}`);
      console.log(`   📝 Allowed methods: ${allowedMethods}`);
      console.log(`   📋 Allowed headers: ${allowedHeaders}`);
      return true;
    } else {
      console.log("   ❌ CORS configuration incomplete");
      return false;
    }
  } catch (error) {
    console.log(`   ❌ CORS test error: ${error.message}`);
    return false;
  }
}

// Main validation function
async function validateDeployment() {
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Widget URL: ${WIDGET_URL}\n`);

  const tests = [
    testBackendHealth,
    testBackendAPI,
    testWidgetEndpoint,
    testFrontend,
    testWidgetFiles,
    testCORS,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log(""); // Empty line between tests
  }

  // Summary
  console.log("📊 Validation Summary:");
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(
    `   📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%\n`
  );

  if (failed === 0) {
    console.log("🎉 All services are properly deployed and working!");
    console.log("\n📋 Next Steps:");
    console.log(
      "   1. Update your widget integration code with the correct URLs"
    );
    console.log("   2. Test the widget on your target website");
    console.log("   3. Monitor the services for any issues");
    console.log("   4. Set up custom domains if needed");
  } else {
    console.log("⚠️  Some tests failed. Please check the issues above.");
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Check Railway service logs");
    console.log("   2. Verify environment variables");
    console.log("   3. Ensure all services are deployed");
    console.log("   4. Check network connectivity");
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Run validation
validateDeployment().catch((error) => {
  console.error("💥 Validation script error:", error);
  process.exit(1);
});
