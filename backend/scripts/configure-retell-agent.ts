#!/usr/bin/env tsx
/**
 * Configure Retell AI Agent
 * Updates the agent with proper LLM and webhook configuration
 */

import { config } from "../src/config/index.js";
import { RetellService } from "../src/services/retell.service.js";
import { logger } from "../src/utils/logger.js";

async function configureAgent() {
  console.log("\n🔧 Configuring Retell AI Agent...\n");

  if (!config.retell.apiKey || !config.retell.agentId) {
    console.error("❌ RETELL_API_KEY or RETELL_AGENT_ID not configured");
    process.exit(1);
  }

  try {
    const retellService = new RetellService();

    // Get current agent configuration
    console.log("📋 Current agent configuration:");
    const currentAgent = await retellService.getAgent(config.retell.agentId);
    console.log(`   Name: ${currentAgent.agent_name}`);
    console.log(
      `   LLM Websocket URL: ${currentAgent.llm_websocket_url || "Not set"}`
    );
    console.log(
      `   Webhook URL: ${currentAgent.agent_webhook_url || "Not set"}`
    );
    console.log(
      `   General Prompt: ${currentAgent.general_prompt ? "Set" : "Not set"}\n`
    );

    // Prepare updates
    const updates: any = {};

    // Option 1: Use custom LLM (recommended for integration with your backend)
    if (config.retell.customLlmUrl) {
      console.log("🔗 Configuring custom LLM...");
      updates.llm_websocket_url = config.retell.customLlmUrl;
      console.log(`   URL: ${config.retell.customLlmUrl}`);
    } else {
      // Option 2: Use general prompt (simpler, but less flexible)
      console.log("📝 Configuring general prompt...");
      updates.general_prompt = `You are a helpful AI assistant for Metalogics, a technology consulting company.

Your role is to:
1. Answer questions about Metalogics services
2. Help users book consultations
3. Provide information about our expertise in AI, cloud computing, and software development

Be friendly, professional, and concise in your responses. If a user wants to book a consultation, collect their:
- Name
- Company
- Email
- Phone number
- Preferred time

Always confirm the details before finalizing a booking.`;

      updates.general_tools = [
        {
          type: "end_call",
          name: "end_call",
          description:
            "End the call when the user is done or requests to end the conversation",
        },
      ];
    }

    // Configure webhook if provided
    if (config.retell.webhookUrl) {
      console.log("🪝 Configuring webhook...");
      updates.agent_webhook_url = config.retell.webhookUrl;
      console.log(`   URL: ${config.retell.webhookUrl}`);
    }

    // Apply updates
    console.log("\n🚀 Applying configuration...");
    const updatedAgent = await retellService.updateAgent(
      config.retell.agentId,
      updates
    );

    console.log("\n✅ Agent configured successfully!");
    console.log("\n📋 Updated configuration:");
    console.log(`   Name: ${updatedAgent.agent_name}`);
    console.log(
      `   LLM Websocket URL: ${updatedAgent.llm_websocket_url || "Not set"}`
    );
    console.log(
      `   Webhook URL: ${updatedAgent.agent_webhook_url || "Not set"}`
    );
    console.log(
      `   General Prompt: ${updatedAgent.general_prompt ? "Set" : "Not set"}`
    );
    console.log(`   Voice ID: ${updatedAgent.voice_id}`);
    console.log(`   Language: ${updatedAgent.language}\n`);

    console.log(
      "✅ Configuration complete! You can now test the voice integration.\n"
    );
  } catch (error) {
    console.error("\n❌ Configuration failed:");
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    } else {
      console.error(`   ${String(error)}`);
    }
    console.error("");
    process.exit(1);
  }
}

// Run the configuration
configureAgent().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
