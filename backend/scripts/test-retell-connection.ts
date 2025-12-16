#!/usr/bin/env tsx
/**
 * Test Retell AI Connection
 * Verifies that the Retell API key and agent are properly configured
 */

import { config } from "../src/config/index.js";
import { RetellService } from "../src/services/retell.service.js";
import { logger } from "../src/utils/logger.js";

async function testRetellConnection() {
  console.log("\n🔍 Testing Retell AI Connection...\n");

  // Check configuration
  console.log("📋 Configuration:");
  console.log(`   API Key: ${config.retell.apiKey ? "✅ Set" : "❌ Missing"}`);
  console.log(`   Agent ID: ${config.retell.agentId || "❌ Missing"}`);
  console.log(`   Enabled: ${config.retell.enabled ? "✅ Yes" : "❌ No"}`);
  console.log(`   Custom LLM URL: ${config.retell.customLlmUrl || "Not set"}`);
  console.log(`   Webhook URL: ${config.retell.webhookUrl || "Not set"}\n`);

  if (!config.retell.apiKey) {
    console.error("❌ RETELL_API_KEY is not configured");
    process.exit(1);
  }

  if (!config.retell.agentId) {
    console.error("❌ RETELL_AGENT_ID is not configured");
    process.exit(1);
  }

  try {
    // Initialize Retell service
    const retellService = new RetellService();
    console.log("✅ Retell SDK initialized\n");

    // Test 1: Get agent details
    console.log("🧪 Test 1: Retrieving agent details...");
    const agent = await retellService.getAgent(config.retell.agentId);
    console.log("✅ Agent retrieved successfully:");
    console.log(`   Name: ${agent.agent_name || "N/A"}`);
    console.log(`   Voice ID: ${agent.voice_id || "N/A"}`);
    console.log(`   Language: ${agent.language || "N/A"}`);
    console.log(`   Response Latency: ${agent.response_latency || "N/A"}`);
    console.log(
      `   LLM Websocket URL: ${agent.llm_websocket_url || "Not set"}`
    );
    console.log(`   Webhook URL: ${agent.agent_webhook_url || "Not set"}\n`);

    // Test 2: Create a test web call
    console.log("🧪 Test 2: Creating test web call...");
    const call = await retellService.createWebCall(config.retell.agentId, {
      test: true,
      timestamp: new Date().toISOString(),
    });
    console.log("✅ Web call created successfully:");
    console.log(`   Call ID: ${call.call_id}`);
    console.log(`   Access Token: ${call.access_token.substring(0, 20)}...`);
    console.log(`   Sample Rate: ${call.sample_rate || "N/A"}\n`);

    // Test 3: List recent calls
    console.log("🧪 Test 3: Listing recent calls...");
    const calls = await retellService.listCalls(5);
    console.log(`✅ Found ${calls.length} recent calls\n`);

    console.log("✅ All tests passed! Retell AI is properly configured.\n");

    // Check for potential issues
    console.log("⚠️  Potential Issues to Check:");
    if (!agent.llm_websocket_url && !agent.general_prompt) {
      console.log(
        "   - Agent has no LLM configuration (no custom LLM or general prompt)"
      );
    }
    if (config.retell.customLlmUrl && !agent.llm_websocket_url) {
      console.log(
        "   - Custom LLM URL is set in .env but not configured on agent"
      );
      console.log(`     Expected: ${config.retell.customLlmUrl}`);
    }
    if (config.retell.webhookUrl && !agent.agent_webhook_url) {
      console.log(
        "   - Webhook URL is set in .env but not configured on agent"
      );
      console.log(`     Expected: ${config.retell.webhookUrl}`);
    }
    console.log("");
  } catch (error) {
    console.error("\n❌ Test failed:");
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        console.error("   → Check that your RETELL_API_KEY is correct");
      } else if (
        error.message.includes("404") ||
        error.message.includes("Not Found")
      ) {
        console.error("   → Check that your RETELL_AGENT_ID is correct");
      } else if (
        error.message.includes("network") ||
        error.message.includes("ENOTFOUND")
      ) {
        console.error("   → Check your internet connection");
      }
    } else {
      console.error(`   ${String(error)}`);
    }
    console.error("");
    process.exit(1);
  }
}

// Run the test
testRetellConnection().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
