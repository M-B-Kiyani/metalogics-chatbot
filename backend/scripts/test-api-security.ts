/**
 * Test script for API security configuration
 *
 * This script verifies that:
 * 1. API key is properly configured
 * 2. Protected endpoints require authentication
 * 3. Public endpoints work without authentication
 * 4. Invalid API keys are rejected
 *
 * Usage: npm run test:security
 */

import axios from "axios";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY;

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

/**
 * Test 1: Verify API key is configured
 */
async function testApiKeyConfigured(): Promise<TestResult> {
  const name = "API Key Configuration";

  if (!API_KEY) {
    return {
      name,
      passed: false,
      message: "API_KEY not found in environment variables",
    };
  }

  if (API_KEY === "your-secure-api-key-min-32-characters-long") {
    return {
      name,
      passed: false,
      message: "API_KEY is still using placeholder value",
    };
  }

  if (API_KEY.length < 32) {
    return {
      name,
      passed: false,
      message: `API_KEY is too short (${API_KEY.length} chars, minimum 32 required)`,
    };
  }

  return {
    name,
    passed: true,
    message: `API_KEY configured (${API_KEY.length} characters)`,
    details: { length: API_KEY.length },
  };
}

/**
 * Test 2: Public endpoint works without authentication
 */
async function testPublicEndpoint(): Promise<TestResult> {
  const name = "Public Endpoint Access";

  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`, {
      timeout: 5000,
    });

    if (response.status === 200) {
      return {
        name,
        passed: true,
        message: "Health endpoint accessible without authentication",
        details: response.data,
      };
    }

    return {
      name,
      passed: false,
      message: `Unexpected status code: ${response.status}`,
    };
  } catch (error: any) {
    return {
      name,
      passed: false,
      message: `Failed to access public endpoint: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test 3: Protected endpoint rejects requests without API key
 */
async function testProtectedEndpointWithoutAuth(): Promise<TestResult> {
  const name = "Protected Endpoint Without Auth";

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/bookings`,
      {
        name: "Test User",
        email: "test@example.com",
        phone: "+1234567890",
        date: "2024-12-01",
        time: "10:00",
        inquiry: "Test booking",
      },
      {
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status
      }
    );

    if (response.status === 401) {
      return {
        name,
        passed: true,
        message:
          "Protected endpoint correctly rejects unauthenticated requests",
        details: { status: response.status },
      };
    }

    return {
      name,
      passed: false,
      message: `Expected 401 Unauthorized, got ${response.status}`,
      details: { status: response.status, data: response.data },
    };
  } catch (error: any) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test 4: Protected endpoint rejects invalid API key
 */
async function testProtectedEndpointWithInvalidAuth(): Promise<TestResult> {
  const name = "Protected Endpoint With Invalid Auth";

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/bookings`,
      {
        name: "Test User",
        email: "test@example.com",
        phone: "+1234567890",
        date: "2024-12-01",
        time: "10:00",
        inquiry: "Test booking",
      },
      {
        headers: {
          Authorization: "Bearer invalid-api-key-12345",
        },
        timeout: 5000,
        validateStatus: () => true,
      }
    );

    if (response.status === 401) {
      return {
        name,
        passed: true,
        message: "Protected endpoint correctly rejects invalid API key",
        details: { status: response.status },
      };
    }

    return {
      name,
      passed: false,
      message: `Expected 401 Unauthorized, got ${response.status}`,
      details: { status: response.status, data: response.data },
    };
  } catch (error: any) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test 5: Protected endpoint accepts valid API key
 */
async function testProtectedEndpointWithValidAuth(): Promise<TestResult> {
  const name = "Protected Endpoint With Valid Auth";

  if (!API_KEY) {
    return {
      name,
      passed: false,
      message: "Cannot test - API_KEY not configured",
    };
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/bookings`,
      {
        name: "Security Test User",
        email: "security-test@example.com",
        phone: "+1234567890",
        date: "2024-12-15",
        time: "14:00",
        inquiry: "Security test booking - can be deleted",
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        timeout: 5000,
        validateStatus: () => true,
      }
    );

    // Accept 201 (created) or 400 (validation error) or 409 (conflict)
    // We're just testing authentication, not full booking logic
    if (
      response.status === 201 ||
      response.status === 400 ||
      response.status === 409
    ) {
      return {
        name,
        passed: true,
        message: "Protected endpoint accepts valid API key",
        details: {
          status: response.status,
          note:
            response.status === 201
              ? "Booking created"
              : "Authentication passed (booking validation failed as expected)",
        },
      };
    }

    if (response.status === 401) {
      return {
        name,
        passed: false,
        message: "Valid API key was rejected",
        details: { status: response.status, data: response.data },
      };
    }

    return {
      name,
      passed: false,
      message: `Unexpected status code: ${response.status}`,
      details: { status: response.status, data: response.data },
    };
  } catch (error: any) {
    return {
      name,
      passed: false,
      message: `Request failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Test 6: CORS headers are present
 */
async function testCorsHeaders(): Promise<TestResult> {
  const name = "CORS Configuration";

  try {
    const response = await axios.options(`${API_BASE_URL}/api/health`, {
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
      },
      timeout: 5000,
    });

    const corsHeaders = {
      "access-control-allow-origin":
        response.headers["access-control-allow-origin"],
      "access-control-allow-methods":
        response.headers["access-control-allow-methods"],
      "access-control-allow-headers":
        response.headers["access-control-allow-headers"],
    };

    if (corsHeaders["access-control-allow-origin"]) {
      return {
        name,
        passed: true,
        message: "CORS headers configured correctly",
        details: corsHeaders,
      };
    }

    return {
      name,
      passed: false,
      message: "CORS headers not found in response",
      details: { headers: response.headers },
    };
  } catch (error: any) {
    return {
      name,
      passed: false,
      message: `CORS test failed: ${error.message}`,
      details: { error: error.message },
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("🔐 API Security Test Suite\n");
  console.log(`Testing API at: ${API_BASE_URL}\n`);
  console.log("═".repeat(60));

  // Run tests
  results.push(await testApiKeyConfigured());
  results.push(await testPublicEndpoint());
  results.push(await testProtectedEndpointWithoutAuth());
  results.push(await testProtectedEndpointWithInvalidAuth());
  results.push(await testProtectedEndpointWithValidAuth());
  results.push(await testCorsHeaders());

  // Print results
  console.log("\n📊 Test Results:\n");

  let passedCount = 0;
  let failedCount = 0;

  results.forEach((result, index) => {
    const icon = result.passed ? "✅" : "❌";
    const status = result.passed ? "PASS" : "FAIL";

    console.log(`${icon} Test ${index + 1}: ${result.name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Message: ${result.message}`);

    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }

    console.log("");

    if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
  });

  console.log("═".repeat(60));
  console.log(`\n📈 Summary: ${passedCount}/${results.length} tests passed\n`);

  if (failedCount > 0) {
    console.log("❌ Some tests failed. Please review the configuration.\n");
    console.log("📖 See API_SECURITY_SETUP.md for troubleshooting help.\n");
    process.exit(1);
  } else {
    console.log("✅ All security tests passed!\n");
    console.log("🎉 Your API security is properly configured.\n");
    process.exit(0);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  });
}

export { runTests, testApiKeyConfigured, testPublicEndpoint };
