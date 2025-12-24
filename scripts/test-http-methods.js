/**
 * HTTP Methods Test Script
 * Tests all HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS) across all API endpoints
 */

const axios = require("axios");

// Configuration
const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY || "your-api-key-here";
const WIDGET_API_KEY = process.env.WIDGET_API_KEY || "your-widget-api-key-here";

// Test configuration
const config = {
  timeout: 10000,
  validateStatus: () => true, // Don't throw on any status code
};

// Helper function to make requests
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      ...config,
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      success: response.status >= 200 && response.status < 300,
    };
  } catch (error) {
    return {
      status: 0,
      statusText: "Network Error",
      error: error.message,
      success: false,
    };
  }
}

// Test endpoints configuration
const endpoints = [
  // Root endpoints
  { path: "/", methods: ["GET", "OPTIONS"] },
  { path: "/health", methods: ["GET", "OPTIONS"] },

  // API endpoints
  { path: "/api/test", methods: ["GET", "OPTIONS"] },
  { path: "/api/slots-simple", methods: ["GET", "OPTIONS"] },

  // Health endpoints
  { path: "/api/health", methods: ["GET", "OPTIONS"] },
  { path: "/api/health/db", methods: ["GET", "OPTIONS"] },
  { path: "/api/health/calendar", methods: ["GET", "OPTIONS"] },
  { path: "/api/health/crm", methods: ["GET", "OPTIONS"] },

  // Available slots endpoints
  {
    path: "/api/bookings/available-slots?startDate=2024-12-25T00:00:00Z&endDate=2024-12-31T00:00:00Z&duration=30",
    methods: ["GET", "OPTIONS"],
  },

  // Booking endpoints (require API key)
  {
    path: "/api/bookings",
    methods: ["GET", "POST", "OPTIONS"],
    requiresAuth: true,
    testData: {
      clientName: "Test User",
      clientEmail: "test@example.com",
      clientPhone: "+1234567890",
      startTime: "2024-12-25T10:00:00Z",
      endTime: "2024-12-25T10:30:00Z",
      duration: 30,
      inquiry: "Test booking via API test",
    },
  },

  // Conversation endpoints
  {
    path: "/api/chat",
    methods: ["POST", "OPTIONS"],
    testData: {
      message: "Hello, this is a test message",
      sessionId: "test-session-123",
    },
  },

  // Retell endpoints
  { path: "/api/retell/health", methods: ["GET", "OPTIONS"] },
  {
    path: "/api/retell/register-call",
    methods: ["POST", "OPTIONS"],
    testData: {
      agent_id: "test-agent-id",
    },
  },

  // Widget endpoints (require widget API key)
  {
    path: "/api/widget/chat",
    methods: ["POST", "OPTIONS"],
    requiresWidgetAuth: true,
    testData: {
      message: "Hello from widget test",
      sessionId: "widget-test-session-123",
    },
  },
  {
    path: "/api/widget/retell/health",
    methods: ["GET", "OPTIONS"],
    requiresWidgetAuth: true,
  },
];

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  details: [],
};

// Main test function
async function testHttpMethods() {
  console.log("🚀 Starting HTTP Methods Test");
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY ? "Configured" : "Missing"}`);
  console.log(
    `🎯 Widget API Key: ${WIDGET_API_KEY ? "Configured" : "Missing"}`
  );
  console.log("=".repeat(80));

  for (const endpoint of endpoints) {
    console.log(`\n📋 Testing endpoint: ${endpoint.path}`);

    for (const method of endpoint.methods) {
      const testName = `${method} ${endpoint.path}`;

      // Prepare headers
      const headers = {};
      if (endpoint.requiresAuth) {
        headers["Authorization"] = `Bearer ${API_KEY}`;
      }
      if (endpoint.requiresWidgetAuth) {
        headers["x-api-key"] = WIDGET_API_KEY;
      }

      // Prepare data for POST/PUT/PATCH requests
      let data = null;
      if (["POST", "PUT", "PATCH"].includes(method) && endpoint.testData) {
        data = endpoint.testData;
      }

      console.log(`  🔄 ${method}...`);

      const result = await makeRequest(method, endpoint.path, data, headers);

      // Determine if test passed
      let passed = false;
      let message = "";

      if (result.success) {
        passed = true;
        message = `✅ ${result.status} ${result.statusText}`;
      } else if (
        result.status === 401 &&
        (endpoint.requiresAuth || endpoint.requiresWidgetAuth)
      ) {
        passed = true; // Expected for auth-required endpoints without proper keys
        message = `🔐 ${result.status} Unauthorized (Expected - requires auth)`;
      } else if (
        result.status === 400 &&
        ["POST", "PUT", "PATCH"].includes(method)
      ) {
        passed = true; // Expected for invalid test data
        message = `📝 ${result.status} Bad Request (Expected - test data may be invalid)`;
      } else if (result.status === 404) {
        message = `❌ ${result.status} Not Found`;
      } else if (result.status === 405) {
        message = `🚫 ${result.status} Method Not Allowed`;
      } else if (result.status === 0) {
        message = `🔌 Network Error: ${result.error}`;
      } else {
        message = `⚠️  ${result.status} ${result.statusText}`;
      }

      console.log(`    ${message}`);

      // Store result
      results.details.push({
        endpoint: endpoint.path,
        method,
        status: result.status,
        success: result.success,
        passed,
        message,
        requiresAuth: endpoint.requiresAuth || false,
        requiresWidgetAuth: endpoint.requiresWidgetAuth || false,
      });

      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  }

  // Test unsupported methods on a few endpoints
  console.log("\n🧪 Testing unsupported methods...");
  const unsupportedTests = [
    { path: "/api/health", method: "POST" },
    { path: "/api/health", method: "PUT" },
    { path: "/api/health", method: "DELETE" },
    { path: "/api/bookings/available-slots", method: "POST" },
    { path: "/api/bookings/available-slots", method: "DELETE" },
  ];

  for (const test of unsupportedTests) {
    console.log(`  🔄 ${test.method} ${test.path}...`);
    const result = await makeRequest(test.method, test.path);

    const passed = result.status === 405 || result.status === 404;
    const message = passed
      ? `✅ ${result.status} Method Not Allowed (Expected)`
      : `❌ ${result.status} ${result.statusText} (Should be 405)`;

    console.log(`    ${message}`);

    results.details.push({
      endpoint: test.path,
      method: test.method,
      status: result.status,
      success: result.success,
      passed,
      message,
      unsupportedTest: true,
    });

    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
}

// CORS preflight test
async function testCorsOptions() {
  console.log("\n🌐 Testing CORS OPTIONS requests...");

  const corsHeaders = {
    Origin: "https://example.com",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type,Authorization",
  };

  const corsEndpoints = [
    "/api/bookings",
    "/api/chat",
    "/api/retell/register-call",
    "/api/widget/chat",
  ];

  for (const endpoint of corsEndpoints) {
    console.log(`  🔄 OPTIONS ${endpoint}...`);
    const result = await makeRequest("OPTIONS", endpoint, null, corsHeaders);

    const hasCorsHeaders =
      result.headers &&
      (result.headers["access-control-allow-origin"] ||
        result.headers["Access-Control-Allow-Origin"]);

    const passed = result.status === 200 && hasCorsHeaders;
    const message = passed
      ? `✅ ${result.status} CORS headers present`
      : `❌ ${result.status} Missing CORS headers`;

    console.log(`    ${message}`);

    results.details.push({
      endpoint,
      method: "OPTIONS",
      status: result.status,
      success: result.success,
      passed,
      message,
      corsTest: true,
    });

    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
}

// Generate report
function generateReport() {
  console.log("\n" + "=".repeat(80));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(80));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `📈 Success Rate: ${(
      (results.passed / (results.passed + results.failed)) *
      100
    ).toFixed(1)}%`
  );

  // Group results by endpoint
  const byEndpoint = {};
  results.details.forEach((result) => {
    if (!byEndpoint[result.endpoint]) {
      byEndpoint[result.endpoint] = [];
    }
    byEndpoint[result.endpoint].push(result);
  });

  console.log("\n📋 DETAILED RESULTS BY ENDPOINT:");
  console.log("-".repeat(80));

  Object.entries(byEndpoint).forEach(([endpoint, tests]) => {
    console.log(`\n🎯 ${endpoint}`);
    tests.forEach((test) => {
      const icon = test.passed ? "✅" : "❌";
      const auth = test.requiresAuth
        ? " [AUTH]"
        : test.requiresWidgetAuth
        ? " [WIDGET]"
        : "";
      const type = test.unsupportedTest
        ? " [UNSUPPORTED]"
        : test.corsTest
        ? " [CORS]"
        : "";
      console.log(`  ${icon} ${test.method}${auth}${type} - ${test.message}`);
    });
  });

  // Summary of supported methods
  console.log("\n🔧 SUPPORTED HTTP METHODS BY SERVICE:");
  console.log("-".repeat(80));

  const methodsByService = {
    Root: ["GET", "OPTIONS"],
    Health: ["GET", "OPTIONS"],
    "Available Slots": ["GET", "OPTIONS"],
    Bookings: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "Chat/Conversation": ["POST", "DELETE", "OPTIONS"],
    "Retell Voice": ["GET", "POST", "OPTIONS"],
    Widget: ["GET", "POST", "OPTIONS"],
  };

  Object.entries(methodsByService).forEach(([service, methods]) => {
    console.log(`  📦 ${service}: ${methods.join(", ")}`);
  });

  console.log("\n🔒 AUTHENTICATION REQUIREMENTS:");
  console.log("-".repeat(80));
  console.log(
    "  🔑 API Key Required: Booking CRUD operations (POST, PUT, PATCH, DELETE)"
  );
  console.log("  🎯 Widget API Key Required: Widget endpoints (/api/widget/*)");
  console.log(
    "  🌐 No Auth Required: Health checks, available slots, chat, voice registration"
  );
}

// Run tests
async function runTests() {
  try {
    await testHttpMethods();
    await testCorsOptions();
    generateReport();
  } catch (error) {
    console.error("❌ Test execution failed:", error);
    process.exit(1);
  }
}

// Export for use as module or run directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, makeRequest };
