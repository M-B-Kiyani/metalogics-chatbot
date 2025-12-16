/**
 * Check Retell Agent Configuration
 * Verifies the agent's WebSocket URL matches the current ngrok URL
 */

const https = require("https");

const RETELL_API_KEY = "your_retell_api_key_hereb4db";
const AGENT_ID = "your_retell_agent_id_heredb";

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
    req.end();
  });
}

async function main() {
  log(
    "\n╔════════════════════════════════════════════════════════╗",
    colors.blue
  );
  log("║         RETELL AGENT CONFIGURATION CHECK             ║", colors.blue);
  log(
    "╚════════════════════════════════════════════════════════╝\n",
    colors.blue
  );

  try {
    log("Fetching agent configuration...", colors.yellow);

    const response = await makeRequest(
      `https://api.retellai.com/get-agent/${AGENT_ID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      log(`\n❌ Failed to fetch agent: ${response.status}`, colors.red);
      log(`Response: ${JSON.stringify(response.body, null, 2)}`, colors.red);
      return;
    }

    const agent = response.body;

    log("\n✅ Agent found!\n", colors.green);
    log(`${colors.bold}Agent Details:${colors.reset}`);
    log(`  Agent ID:   ${agent.agent_id}`);
    log(`  Agent Name: ${agent.agent_name || "N/A"}`);

    if (agent.llm_websocket_url) {
      log(`\n${colors.bold}Custom LLM Configuration:${colors.reset}`);
      log(
        `  WebSocket URL: ${colors.blue}${agent.llm_websocket_url}${colors.reset}`
      );

      const expectedUrl =
        "wss://your-ngrok-url.ngrok-free.app/api/retell/llm";

      if (agent.llm_websocket_url === expectedUrl) {
        log(`\n  ✅ WebSocket URL is correct!`, colors.green);
      } else {
        log(`\n  ❌ WebSocket URL is INCORRECT!`, colors.red);
        log(`\n  Expected: ${colors.green}${expectedUrl}${colors.reset}`);
        log(
          `  Current:  ${colors.red}${agent.llm_websocket_url}${colors.reset}`
        );
        log(`\n  ${colors.bold}Action Required:${colors.reset}`, colors.yellow);
        log(`  1. Go to: https://dashboard.retellai.com`);
        log(`  2. Find agent: ${agent.agent_id}`);
        log(`  3. Update WebSocket URL to: ${expectedUrl}`);
        log(`  4. Save changes\n`);
      }
    } else {
      log(`\n  ⚠️  No custom LLM WebSocket URL configured`, colors.yellow);
      log(
        `  This agent is using Retell's default LLM, not your custom backend.`
      );
      log(`\n  ${colors.bold}Action Required:${colors.reset}`, colors.yellow);
      log(`  1. Go to: https://dashboard.retellai.com`);
      log(`  2. Find agent: ${agent.agent_id}`);
      log(`  3. Set LLM type to "Custom LLM"`);
      log(
        `  4. Set WebSocket URL to: wss://your-ngrok-url.ngrok-free.app/api/retell/llm`
      );
      log(`  5. Save changes\n`);
    }

    // Show other relevant config
    if (agent.voice_id) {
      log(`\n${colors.bold}Voice Configuration:${colors.reset}`);
      log(`  Voice ID: ${agent.voice_id}`);
    }

    if (agent.webhook_url) {
      log(`\n${colors.bold}Webhook Configuration:${colors.reset}`);
      log(`  Webhook URL: ${agent.webhook_url}`);
    }
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    log("\nMake sure:", colors.yellow);
    log("  1. RETELL_API_KEY is correct in backend/.env");
    log("  2. RETELL_AGENT_ID is correct in backend/.env");
    log("  3. You have internet connection\n");
  }
}

main();
