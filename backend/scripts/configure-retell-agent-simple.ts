#!/usr/bin/env tsx
/**
 * Configure Retell AI Agent with General Prompt
 * Simple configuration that works without ngrok
 */

import { config } from "../src/config/index.js";
import Retell from "retell-sdk";

async function configureAgent() {
  console.log("\n🔧 Configuring Retell AI Agent with General Prompt...\n");

  if (!config.retell.apiKey || !config.retell.agentId) {
    console.error("❌ RETELL_API_KEY or RETELL_AGENT_ID not configured");
    process.exit(1);
  }

  try {
    const client = new Retell({ apiKey: config.retell.apiKey });

    // Get current agent
    console.log("📋 Fetching current agent configuration...");
    const currentAgent = await client.agent.retrieve(config.retell.agentId);
    console.log(`   Name: ${currentAgent.agent_name}`);
    console.log(`   Voice: ${currentAgent.voice_id}\n`);

    // Update with general prompt
    console.log("🚀 Updating agent configuration...");
    const updatedAgent = await client.agent.update(config.retell.agentId, {
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
      general_prompt: `You are a helpful AI assistant for Metalogics, a technology consulting company.

Your role is to:
1. Answer questions about Metalogics services including AI solutions, cloud computing, and software development
2. Help users book consultations
3. Provide information about our expertise and past projects

Be friendly, professional, and concise in your responses. Keep your answers brief and conversational since this is a voice call.

If a user wants to book a consultation, collect their:
- Name
- Company
- Email
- Phone number
- Preferred date and time

Always confirm the details before finalizing a booking.`,
      general_tools: [
        {
          type: "end_call",
          name: "end_call",
          description:
            "End the call when the user is done or requests to end the conversation",
        },
      ],
    });

    console.log("\n✅ Agent configured successfully!\n");
    console.log("📋 Configuration:");
    console.log(`   Name: ${updatedAgent.agent_name}`);
    console.log(`   Voice: ${updatedAgent.voice_id}`);
    console.log(`   Language: ${updatedAgent.language}`);
    console.log(
      `   Prompt: ${updatedAgent.general_prompt ? "✅ Set" : "❌ Not set"}`
    );
    console.log(
      `   Tools: ${updatedAgent.general_tools?.length || 0} configured\n`
    );

    console.log("✅ You can now test the voice integration in your browser!\n");
  } catch (error: any) {
    console.error("\n❌ Configuration failed:");
    console.error(`   ${error.message || String(error)}\n`);
    process.exit(1);
  }
}

configureAgent();
