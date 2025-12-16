#!/usr/bin/env tsx
/**
 * Configure Retell Agent with Custom LLM
 * Updates the agent to use your backend's custom LLM endpoint
 */

import { config } from "../src/config/index.js";
import Retell from "retell-sdk";

async function configureAgent() {
  console.log("\n🔧 Configuring Retell Agent with Custom LLM...\n");

  if (!config.retell.apiKey || !config.retell.agentId) {
    console.error("❌ RETELL_API_KEY or RETELL_AGENT_ID not configured");
    process.exit(1);
  }

  if (!config.retell.customLlmUrl) {
    console.error("❌ Custom_LLM_URL not configured in .env");
    process.exit(1);
  }

  try {
    const client = new Retell({ apiKey: config.retell.apiKey });

    // Get current agent
    console.log("📋 Current agent configuration:");
    const currentAgent = await client.agent.retrieve(config.retell.agentId);
    console.log(`   Name: ${currentAgent.agent_name}`);
    console.log(`   Voice: ${currentAgent.voice_id}`);
    console.log(`   LLM URL: ${currentAgent.llm_websocket_url || "Not set"}\n`);

    // Convert HTTP URL to WebSocket URL
    const wsUrl = config.retell.customLlmUrl
      .replace("https://", "wss://")
      .replace("http://", "ws://");

    console.log("🚀 Updating agent with custom LLM...");
    console.log(`   WebSocket URL: ${wsUrl}\n`);

    // Update agent
    const updatedAgent = await client.agent.update(config.retell.agentId, {
      llm_websocket_url: wsUrl,
      agent_name: "Metalogics Assistant",
      voice_id: "11labs-Nico",
      language: "en-US",
      response_latency: 1,
      interruption_sensitivity: 1,
      enable_backchannel: true,
      backchannel_frequency: 0.9,
      backchannel_words: ["yeah", "uh-huh", "mm-hmm"],
      reminder_trigger_ms: 10000,
      reminder_max_count: 2,
      ambient_sound: "coffee-shop",
      ambient_sound_volume: 0.3,
    });

    console.log("✅ Agent configured successfully!\n");
    console.log("📋 Updated configuration:");
    console.log(`   Name: ${updatedAgent.agent_name}`);
    console.log(`   Voice: ${updatedAgent.voice_id}`);
    console.log(`   Language: ${updatedAgent.language}`);
    console.log(
      `   LLM WebSocket URL: ${updatedAgent.llm_websocket_url || "Not set"}\n`
    );

    if (config.retell.webhookUrl) {
      console.log(
        "ℹ️  Note: Webhook URL should be configured in Retell Dashboard:"
      );
      console.log(`   ${config.retell.webhookUrl}\n`);
    }

    console.log("✅ Configuration complete!");
    console.log("\n📋 Next steps:");
    console.log("   1. Refresh your browser (http://localhost:5173)");
    console.log("   2. Click the green microphone button");
    console.log("   3. Allow microphone access");
    console.log("   4. Start talking!\n");
  } catch (error: any) {
    console.error("\n❌ Configuration failed:");
    console.error(`   ${error.message || String(error)}`);

    if (error.message?.includes("llm_websocket_url")) {
      console.error(
        "\n💡 Tip: The LLM WebSocket URL might need to be configured manually in the Retell Dashboard"
      );
      console.error("   Go to: https://beta.retellai.com/dashboard");
      console.error(
        `   Set LLM WebSocket URL to: ${config.retell.customLlmUrl.replace(
          "https://",
          "wss://"
        )}\n`
      );
    }

    process.exit(1);
  }
}

configureAgent();
