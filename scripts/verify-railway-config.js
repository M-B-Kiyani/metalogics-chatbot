#!/usr/bin/env node

/**
 * Railway Configuration Verification Script
 * Tests if the deployed services have proper configuration
 */

const https = require("https");
const http = require("http");

// Configuration
const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://metalogics-chatbot-production.up.railway.app";
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "https://frontend-production-metabot.up.railway.app";

console.log("🔍 Railway Configuration Verification");
console.log("=====================================\n");

/**
 * Make HTTP request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

/**
 * Test backend health
 */
async function testBackendHealth() {
  console.log("🔧 Testing Backend Health...");

  try {
    const result = await makeRequest(`${BACKEND_URL}/api/health`);

    if (result.status === 200) {
      console.log("✅ Backend health check passed");

      if (result.data && typeof result.data === "object") {
        const dbStatus = result.data.database?.status;
        const dbResponseTime = result.data.database?.responseTime;

        console.log(`   Database: ${dbStatus || "unknown"}`);
        if (dbResponseTime) {
          console.log(`   DB Response Time: ${dbResponseTime}ms`);
        }

        if (dbStatus === "healthy") {
          console.log("✅ Database connection is working");
        } else if (dbStatus === "unhealthy") {
          console.log("❌ Database connection issues detected");
          console.log("   Check Railway PostgreSQL service and DATABASE_URL");
        }

        console.log(
          `   Calendar: ${result.data.calendar?.status || "unknown"}`
        );
        console.log(`   CRM: ${result.data.crm?.status || "unknown"}`);
      }
    } else {
      console.log(`❌ Backend health check failed (${result.status})`);
      if (result.status === 500) {
        console.log("   This might indicate database connection issues");
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Backend health check error: ${error.message}`);
    console.log(
      "   Check if backend is deployed and DATABASE_URL is configured"
    );
    return false;
  }

  return true;
}

/**
 * Test Retell configuration
 */
async function testRetellConfig() {
  console.log("\n🎙️ Testing Retell Configuration...");

  try {
    const result = await makeRequest(`${BACKEND_URL}/api/retell/health`);

    if (result.status === 200) {
      const configured = result.data?.configured;
      if (configured) {
        console.log("✅ Retell AI is configured and available");
      } else {
        console.log(
          "⚠️  Retell AI is not configured (voice features disabled)"
        );
      }
    } else {
      console.log(`❌ Retell health check failed (${result.status})`);
    }
  } catch (error) {
    console.log(`⚠️  Retell health check error: ${error.message}`);
  }
}

/**
 * Test chat functionality
 */
async function testChatFunctionality() {
  console.log("\n💬 Testing Chat Functionality...");

  try {
    const result = await makeRequest(`${BACKEND_URL}/api/conversation`);

    // Even if endpoint doesn't exist, we should get a proper HTTP response
    if (result.status < 500) {
      console.log("✅ Backend is responding to API requests");
    } else {
      console.log(`❌ Backend API error (${result.status})`);
      console.log("   This might indicate missing GEMINI_API_KEY");
    }
  } catch (error) {
    console.log(`❌ Chat functionality test error: ${error.message}`);
  }
}

/**
 * Test frontend accessibility
 */
async function testFrontendAccess() {
  console.log("\n🌐 Testing Frontend Access...");

  try {
    const result = await makeRequest(FRONTEND_URL);

    if (result.status === 200) {
      console.log("✅ Frontend is accessible");
    } else {
      console.log(`❌ Frontend access failed (${result.status})`);
    }
  } catch (error) {
    console.log(`❌ Frontend access error: ${error.message}`);
  }
}

/**
 * Test CORS configuration
 */
async function testCORS() {
  console.log("\n🔒 Testing CORS Configuration...");

  // This is a simplified test - in a real scenario, CORS is tested by browsers
  try {
    const result = await makeRequest(`${BACKEND_URL}/api/health`);

    if (result.status === 200) {
      console.log("✅ Backend accepts requests (CORS likely configured)");
    } else {
      console.log(`⚠️  Backend CORS might need attention (${result.status})`);
    }
  } catch (error) {
    console.log(`❌ CORS test error: ${error.message}`);
  }
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}\n`);

  const backendHealthy = await testBackendHealth();
  await testRetellConfig();
  await testChatFunctionality();
  await testFrontendAccess();
  await testCORS();

  console.log("\n📋 Summary");
  console.log("===========");

  if (backendHealthy) {
    console.log("✅ Backend is healthy and responding");
    console.log("✅ Configuration fixes appear to be working");
    console.log("\n🎯 Next Steps:");
    console.log("   1. Test chat functionality in the browser");
    console.log("   2. Check for any console errors");
    console.log("   3. Test voice features (if configured)");
  } else {
    console.log("❌ Backend has issues - check Railway logs");
    console.log("\n🔧 Troubleshooting:");
    console.log("   1. Verify GEMINI_API_KEY is set in Railway backend");
    console.log("   2. Check Railway deployment logs for errors");
    console.log("   3. Ensure DATABASE_URL is properly configured");
  }

  console.log("\n📚 For detailed troubleshooting, see:");
  console.log("   docs/RAILWAY_DEPLOYMENT_FIX.md");
}

// Run verification
runVerification().catch((error) => {
  console.error("❌ Verification script failed:", error.message);
  process.exit(1);
});
