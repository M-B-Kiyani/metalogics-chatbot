#!/usr/bin/env tsx
/**
 * Verify Retell Setup
 * Checks all components are ready for voice integration
 */

import { config } from "../src/config/index.js";
import fetch from "node-fetch";

async function verifySetup() {
  console.log("\n🔍 Verifying Retell Setup...\n");

  let allGood = true;

  // 1. Check environment variables
  console.log("1️⃣ Checking environment variables...");
  if (!config.retell.apiKey) {
    console.log("   ❌ RETELL_API_KEY not set");
    allGood = false;
  } else {
    console.log("   ✅ RETELL_API_KEY configured");
  }

  if (!config.retell.agentId) {
    console.log("   ❌ RETELL_AGENT_ID not set");
    allGood = false;
  } else {
    console.log(`   ✅ RETELL_AGENT_ID: ${config.retell.agentId}`);
  }

  if (!config.retell.customLlmUrl) {
    console.log("   ⚠️  Custom_LLM_URL not set (will use general prompt)");
  } else {
    console.log(`   ✅ Custom_LLM_URL: ${config.retell.customLlmUrl}`);
  }

  // 2. Check backend server
  console.log("\n2️⃣ Checking backend server...");
  try {
    const response = await fetch("http://localhost:3000/api/retell/health", {
      method: "GET",
    });
    if (response.ok) {
      console.log("   ✅ Backend server is running on http://localhost:3000");
    } else {
      console.log(`   ❌ Backend server returned status ${response.status}`);
      allGood = false;
    }
  } catch (error) {
    console.log("   ❌ Backend server is not running");
    console.log("   💡 Start it with: cd backend && npm run dev");
    allGood = false;
  }

  // 3. Check ngrok tunnel
  if (config.retell.customLlmUrl) {
    console.log("\n3️⃣ Checking ngrok tunnel...");
    try {
      const ngrokUrl = config.retell.customLlmUrl.replace(
        "/api/retell/llm",
        "/api/retell/health"
      );
      const response = await fetch(ngrokUrl, {
        method: "GET",
      });
      if (response.ok) {
        console.log(
          `   ✅ ngrok tunnel is active: ${ngrokUrl.replace(
            "/api/retell/health",
            ""
          )}`
        );
      } else {
        console.log(`   ❌ ngrok tunnel returned status ${response.status}`);
        allGood = false;
      }
    } catch (error) {
      console.log("   ❌ ngrok tunnel is not accessible");
      console.log("   💡 Start it with: ngrok http 3000");
      allGood = false;
    }
  }

  // 4. Check Retell API connection
  console.log("\n4️⃣ Checking Retell API connection...");
  try {
    const Retell = (await import("retell-sdk")).default;
    const client = new Retell({ apiKey: config.retell.apiKey });
    const agent = await client.agent.retrieve(config.retell.agentId);
    console.log("   ✅ Successfully connected to Retell API");
    console.log(`   ✅ Agent found: ${agent.agent_name}`);
    console.log(`   ✅ Voice: ${agent.voice_id}`);

    if ((agent as any).llm_websocket_url) {
      console.log(
        `   ✅ LLM WebSocket URL configured: ${
          (agent as any).llm_websocket_url
        }`
      );
    } else if ((agent as any).general_prompt) {
      console.log("   ✅ General prompt configured");
    } else {
      console.log("   ⚠️  No LLM configuration found on agent");
      console.log(
        "   💡 Configure in Retell Dashboard: https://beta.retellai.com/dashboard"
      );
      allGood = false;
    }
  } catch (error: any) {
    console.log("   ❌ Failed to connect to Retell API");
    console.log(`   Error: ${error.message}`);
    allGood = false;
  }

  // 5. Summary
  console.log("\n" + "=".repeat(60));
  if (allGood) {
    console.log("✅ All checks passed! Your setup is ready.");
    console.log("\n📋 Next steps:");
    console.log("   1. Open browser: http://localhost:5173");
    console.log("   2. Click the green microphone button");
    console.log("   3. Allow microphone access");
    console.log("   4. Start talking!");
  } else {
    console.log("⚠️  Some checks failed. Please fix the issues above.");
    console.log("\n📋 Common fixes:");
    console.log("   • Start backend: cd backend && npm run dev");
    console.log("   • Start ngrok: ngrok http 3000");
    console.log("   • Configure agent: See CONFIGURE_RETELL_DASHBOARD.md");
  }
  console.log("=".repeat(60) + "\n");
}

verifySetup().catch((error) => {
  console.error("\n❌ Verification failed:", error);
  process.exit(1);
});
