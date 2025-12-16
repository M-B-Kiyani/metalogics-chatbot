/**
 * Fix Retell Agent Configuration - Proper Method
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
  log("║      FIX RETELL AGENT - USE CUSTOM LLM WEBSOCKET     ║", colors.blue);
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
    log("✅ Current configuration retrieved", colors.green);
    log(
      `   Current LLM type: ${currentAgent.response_engine.type}\n`,
      colors.blue
    );

    // Step 2: Update agent with custom LLM WebSocket
    log("Step 2: Updating agent to use custom LLM WebSocket...", colors.yellow);

    const updatePayload = {
      // Change response engine to custom-llm
      response_engine: {
        type: "custom-llm",
        llm_websocket_url: WEBSOCKET_URL,
      },

      // Keep all other settings
      agent_name: currentAgent.agent_name,
      voice_id: currentAgent.voice_id,
      language: currentAgent.language,
      webhook_url: currentAgent.webhook_url,
      voice_temperature: currentAgent.voice_temperature,
      voice_speed: currentAgent.voice_speed,
      enable_backchannel: currentAgent.enable_backchannel,
      backchannel_frequency: currentAgent.backchannel_frequency,
      backchannel_words: currentAgent.backchannel_words,
      reminder_trigger_ms: currentAgent.reminder_trigger_ms,
      reminder_max_count: currentAgent.reminder_max_count,
      interruption_sensitivity: currentAgent.interruption_sensitivity,
      responsiveness: currentAgent.responsiveness,
      ambient_sound_volume: currentAgent.ambient_sound_volume,
      normalize_for_speech: currentAgent.normalize_for_speech,
      boosted_keywords: currentAgent.boosted_keywords,
    };

    log(`\nChanging to Custom LLM with WebSocket:`, colors.blue);
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

      const updatedAgent = updateResponse.body;
      log(`${colors.bold}Configuration Details:${colors.reset}`);
      log(`  Agent ID: ${updatedAgent.agent_id}`);
      log(`  Agent Name: ${updatedAgent.agent_name}`);
      log(`  LLM Type: ${updatedAgent.response_engine.type}`);

      if (updatedAgent.response_engine.llm_websocket_url) {
        log(
          `  WebSocket URL: ${colors.green}${updatedAgent.response_engine.llm_websocket_url}${colors.reset}\n`
        );
        log("✅ Custom LLM WebSocket is now active!", colors.green);
      }

      log(`\n${colors.bold}What this means:${colors.reset}`, colors.yellow);
      log(`  ✓ Voice calls will now connect to YOUR backend`);
      log(`  ✓ Gemini AI will power the conversations`);
      log(`  ✓ Appointment booking will work through voice`);
      log(`  ✓ All your custom logic is now active\n`);

      log(`${colors.bold}Test it now:${colors.reset}`, colors.yellow);
      log(`  1. Open your browser: http://localhost:5173`);
      log(`  2. Click the "Call AI" button`);
      log(`  3. Allow microphone access`);
      log(`  4. Say: "Hello, I'd like to book an appointment"`);
      log(`  5. The AI should respond with your custom Gemini responses!\n`);
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
      log(`  3. In "Response Engine" section:`);
      log(`     - Change type to "Custom LLM"`);
      log(`     - Set WebSocket URL to: ${WEBSOCKET_URL}`);
      log(`  4. Save changes\n`);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    log(`Stack: ${error.stack}`, colors.red);
  }
}

main();
