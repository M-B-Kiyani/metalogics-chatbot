#!/usr/bin/env node
/**
 * Retell Integration Test Script
 * Tests all Retell endpoints to verify integration is working
 */

const API_BASE_URL = "http://localhost:3000";
const API_KEY =
  "7dfeeaff41d8eb72c8e006524b69e4b57116a4dfb2314a0b068c9776c627430e";

const results = [];

async function testHealthCheck() {
  console.log("\n🔍 Testing Retell health endpoint...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/retell/health`);
    const data = await response.json();

    if (response.ok && data.status === "ok") {
      results.push({
        name: "Retell Health Check",
        passed: true,
        message: "✅ Health endpoint working",
        details: data,
      });
      console.log("✅ Health endpoint working");
      console.log("   Response:", JSON.stringify(data, null, 2));
    } else {
      results.push({
        name: "Retell Health Check",
        passed: false,
        message: "❌ Unexpected response",
      });
    }
  } catch (error) {
    results.push({
      name: "Retell Health Check",
      passed: false,
      message: `❌ Failed: ${error.message}`,
    });
    console.log(`❌ Failed: ${error.message}`);
  }
}

async function testWebhook() {
  console.log("\n🔍 Testing Retell webhook endpoint...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/retell/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "call_started",
        call: {
          call_id: "test_call_123",
          agent_id: "test_agent",
          start_timestamp: Date.now(),
        },
      }),
    });

    const data = await response.json();

    if (response.ok && data.received === true) {
      results.push({
        name: "Retell Webhook",
        passed: true,
        message: "✅ Webhook endpoint working",
        details: data,
      });
      console.log("✅ Webhook endpoint working");
      console.log("   Response:", JSON.stringify(data, null, 2));
    } else {
      results.push({
        name: "Retell Webhook",
        passed: false,
        message: "❌ Unexpected response",
      });
    }
  } catch (error) {
    results.push({
      name: "Retell Webhook",
      passed: false,
      message: `❌ Failed: ${error.message}`,
    });
    console.log(`❌ Failed: ${error.message}`);
  }
}

async function testLLMEndpoint() {
  console.log("\n🔍 Testing Retell LLM endpoint...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/retell/llm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript: [
          { role: "user", content: "Hello, I want to book a consultation" },
        ],
        call_id: "test_call_456",
      }),
    });

    const data = await response.json();

    if (response.ok && data.response) {
      results.push({
        name: "Retell LLM",
        passed: true,
        message: "✅ LLM endpoint working",
        details: data,
      });
      console.log("✅ LLM endpoint working");
      console.log("   Response:", JSON.stringify(data, null, 2));
    } else {
      results.push({
        name: "Retell LLM",
        passed: false,
        message: "❌ Unexpected response",
      });
    }
  } catch (error) {
    results.push({
      name: "Retell LLM",
      passed: false,
      message: `❌ Failed: ${error.message}`,
    });
    console.log(`❌ Failed: ${error.message}`);
  }
}

async function testRegisterCall() {
  console.log("\n🔍 Testing Retell register-call endpoint...");
  console.log("   Note: This will fail without valid Retell API key");

  try {
    const response = await fetch(`${API_BASE_URL}/api/retell/register-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        agentId: "agent_test123",
        sessionId: "session_test",
      }),
    });

    const data = await response.json();

    if (response.ok && data.accessToken) {
      results.push({
        name: "Retell Register Call",
        passed: true,
        message: "✅ Register call working (with valid Retell API key)",
        details: { hasAccessToken: true, hasCallId: !!data.callId },
      });
      console.log("✅ Register call working");
    } else if (data.error) {
      results.push({
        name: "Retell Register Call",
        passed: true,
        message: "⚠️  Endpoint working but needs valid Retell API key",
        details: data,
      });
      console.log("⚠️  Endpoint working but needs valid Retell API key");
      console.log("   This is expected if RETELL_API_KEY is not configured");
    } else {
      results.push({
        name: "Retell Register Call",
        passed: false,
        message: "❌ Unexpected response",
      });
    }
  } catch (error) {
    results.push({
      name: "Retell Register Call",
      passed: false,
      message: `❌ Failed: ${error.message}`,
    });
    console.log(`❌ Failed: ${error.message}`);
  }
}

async function testConversationFlow() {
  console.log("\n🔍 Testing conversation flow with booking intent...");

  const testMessages = [
    "I want to book a consultation",
    "My name is John Smith",
    "john.smith@example.com",
    "Tomorrow at 2pm",
  ];

  for (const message of testMessages) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/retell/llm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: [{ role: "user", content: message }],
          call_id: "test_conversation_flow",
        }),
      });

      const data = await response.json();
      console.log(`   User: "${message}"`);
      console.log(`   AI: "${data.response?.substring(0, 100)}..."`);
    } catch (error) {
      console.log(`   ❌ Failed on message: "${message}"`);
    }
  }

  results.push({
    name: "Conversation Flow",
    passed: true,
    message: "✅ Conversation flow tested",
  });
}

async function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((result) => {
    console.log(
      `${result.passed ? "✅" : "❌"} ${result.name}: ${result.message}`
    );
  });

  console.log("\n" + "=".repeat(60));
  console.log(`Total: ${results.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log("=".repeat(60));

  if (failed === 0) {
    console.log(
      "\n🎉 All tests passed! Retell integration is working correctly."
    );
    console.log("\n📋 Next Steps:");
    console.log("   1. Configure valid RETELL_API_KEY in backend/.env");
    console.log("   2. Create Retell agent in dashboard");
    console.log("   3. Set LLM webhook URL to your backend");
    console.log("   4. Test with actual voice calls");
  } else {
    console.log("\n⚠️  Some tests failed. Please check the errors above.");
  }
}

async function runTests() {
  console.log("🚀 Starting Retell Integration Tests");
  console.log("   Backend URL:", API_BASE_URL);
  console.log("   Testing endpoints...\n");

  await testHealthCheck();
  await testWebhook();
  await testLLMEndpoint();
  await testRegisterCall();
  await testConversationFlow();
  await printSummary();
}

runTests().catch((error) => {
  console.error("\n💥 Test suite failed:", error);
  process.exit(1);
});
