/**
 * Quick ngrok Status Checker
 * Checks if ngrok is running and shows the current URL
 */

const http = require("http");

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

async function checkNgrokDashboard() {
  return new Promise((resolve) => {
    const req = http.request("http://127.0.0.1:4040/api/tunnels", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const tunnels = JSON.parse(data);
          resolve(tunnels);
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

async function main() {
  log(
    "\n╔════════════════════════════════════════════════════════╗",
    colors.blue
  );
  log("║              NGROK STATUS CHECKER                     ║", colors.blue);
  log(
    "╚════════════════════════════════════════════════════════╝\n",
    colors.blue
  );

  log("Checking if ngrok is running...", colors.yellow);

  const tunnels = await checkNgrokDashboard();

  if (!tunnels || !tunnels.tunnels || tunnels.tunnels.length === 0) {
    log("\n❌ ngrok is NOT running!", colors.red);
    log("\nTo start ngrok:", colors.yellow);
    log("  1. Open a new terminal", colors.reset);
    log("  2. Run: ngrok http 3000", colors.green);
    log("  3. Keep that terminal open", colors.reset);
    log("\nDownload ngrok: https://ngrok.com/download\n", colors.blue);
    return;
  }

  log("\n✅ ngrok is running!\n", colors.green);

  tunnels.tunnels.forEach((tunnel, index) => {
    if (tunnel.proto === "https") {
      log(`${colors.bold}Tunnel ${index + 1}:${colors.reset}`, colors.blue);
      log(`  Public URL:  ${colors.green}${tunnel.public_url}${colors.reset}`);
      log(`  Forwarding:  ${tunnel.config.addr}`);
      log(`  Protocol:    ${tunnel.proto}`);

      // Show WebSocket URL
      const wsUrl = tunnel.public_url.replace("https://", "wss://");
      log(
        `\n  ${colors.bold}WebSocket URL for Retell:${colors.reset}`,
        colors.yellow
      );
      log(`  ${colors.green}${wsUrl}/api/retell/llm${colors.reset}\n`);

      // Show what to update
      log(
        `  ${colors.bold}Update these in backend/.env:${colors.reset}`,
        colors.yellow
      );
      log(
        `  ${colors.blue}RETELL_CUSTOM_LLM_WEBSOCKET_URL=${wsUrl}/api/retell/llm${colors.reset}`
      );
      log(
        `  ${colors.blue}RETELL_AGENT_WEBHOOK_URL=${tunnel.public_url}/api/retell/webhook${colors.reset}\n`
      );

      log(
        `  ${colors.bold}Then update Retell agent at:${colors.reset}`,
        colors.yellow
      );
      log(`  ${colors.blue}https://dashboard.retellai.com${colors.reset}\n`);
    }
  });

  log("View ngrok dashboard: http://127.0.0.1:4040\n", colors.blue);
}

main().catch((error) => {
  log(`\nError: ${error.message}`, colors.red);
});
