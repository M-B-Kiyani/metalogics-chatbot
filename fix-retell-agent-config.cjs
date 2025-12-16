/**
 * Fix Retell Agent Configuration
 * Updates the agent to use custom LLM WebSocket
 */

const https = require("https");

const RETELL_API_KEY = "your_retell_api_key_hereb4db";
const AGENT_ID = "your_retell_agent_id_heredb";
const WEBSOCKET_URL =
  "wss://your-ngrok-url.ngrok-free.app/api/retell/llm";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode,
            body: data,
          });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function main() {
  log(
    "\n╔════════════════════════════════════════════════════════╗",
    colors.blue
  );
  log("║         FIX RETELL AGENT CONFIGURATION               ║", colors.blue);
  log(
    "╚════════════════════════════════════════════════════════╝\n",
    colors.blue
  );

  try {
    // Step 1: Get current agent config
    log("Step 1: Fetching current agent configuration...", colors.yellow);

    const getResponse = await makeRequest(
      `https://api.retellai.com/get-agent/${AGENT_ID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (getResponse.status !== 200) {
      log(`\n❌ Failed to fetch agent: ${getResponse.status}`, colors.red);
      return;
    }

    const currentAgent = getResponse.body;
    log("✅ Current configuration retrieved\n", colors.green);

    // Step 2: Update agent with custom LLM
    log("Step 2: Updating agent to use custom LLM...", colors.yellow);

    const updatePayload = {
      agent_name: currentAgent.agent_name,
      voice_id: currentAgent.voice_id,
      language: currentAgent.language || "en-US",

      // Set to custom LLM
      llm_websocket_url: WEBSOCKET_URL,

      // Keep existing webhook
      webhook_url: currentAgent.webhook_url,

      // Other settings
      response_engine: currentAgent.response_engine || {
        type: "retell-llm",
        llm_id: "your_retell_llm_id_here12cd",
      },

      // Voice settings
      voice_temperature: currentAgent.voice_temperature || 1,
      voice_speed: currentAgent.voice_speed || 1,
      responsiveness: currentAgent.responsiveness || 1,
      interruption_sensitivity: currentAgent.interruption_sensitivity || 1,

      // Enable features
      enable_backchannel: currentAgent.enable_backchannel !== false,
      backchannel_frequency: currentAgent.backchannel_frequency || 0.8,
      backchannel_words: currentAgent.backchannel_words || [
        "yeah",
        "uh-huh",
        "mm-hmm",
      ],

      reminder_trigger_ms: currentAgent.reminder_trigger_ms || 10000,
      reminder_max_count: currentAgent.reminder_max_count || 1,

      ambient_sound: currentAgent.ambient_sound,
      ambient_sound_volume: currentAgent.ambient_sound_volume || 1,

      // Pronunciation
      pronunciation_dictionary: currentAgent.pronunciation_dictionary || [],

      // Boosted keywords
      boosted_keywords: currentAgent.boosted_keywords || [],

      // Format settings
      opt_out_sensitive_data_storage:
        currentAgent.opt_out_sensitive_data_storage || false,
      normalize_for_speech: currentAgent.normalize_for_speech !== false,
    };

    log(`\nUpdating agent with WebSocket URL:`, colors.blue);
    log(`  ${WEBSOCKET_URL}\n`, colors.green);

    const updateResponse = await makeRequest(
      `https://api.retellai.com/update-agent/${AGENT_ID}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (updateResponse.status === 200) {
      log("✅ Agent configuration updated successfully!\n", colors.green);
      log(`${colors.bold}What changed:${colors.reset}`);
      log(`  ✓ LLM Type: Retell Default → Custom LLM (WebSocket)`);
      log(`  ✓ WebSocket URL: ${WEBSOCKET_URL}`);
      log(`  ✓ Agent will now use your Gemini-powered backend\n`);

      log(`${colors.bold}Next steps:${colors.reset}`, colors.yellow);
      log(`  1. Make sure backend is running: cd backend && npm run dev`);
      log(`  2. Make sure ngrok is running: ngrok http 3000`);
      log(`  3. Test the voice integration in your browser`);
      log(`  4. Click "Call AI" and speak to the assistant\n`);

      log("✅ Voice integration should now work!", colors.green);
    } else {
      log(`\n❌ Failed to update agent: ${updateResponse.status}`, colors.red);
      log(
        `Response: ${JSON.stringify(updateResponse.body, null, 2)}`,
        colors.red
      );

      log(
        `\n${colors.bold}Manual update required:${colors.reset}`,
        colors.yellow
      );
      log(`  1. Go to: https://dashboard.retellai.com`);
      log(`  2. Find agent: ${AGENT_ID}`);
      log(`  3. Change LLM type to "Custom LLM"`);
      log(`  4. Set WebSocket URL to: ${WEBSOCKET_URL}`);
      log(`  5. Save changes\n`);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    log("\nTroubleshooting:", colors.yellow);
    log("  1. Check RETELL_API_KEY in backend/.env");
    log("  2. Check internet connection");
    log("  3. Try manual update at https://dashboard.retellai.com\n");
  }
}

main();
