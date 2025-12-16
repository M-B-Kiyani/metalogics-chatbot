#!/usr/bin/env tsx
/**
 * Update ngrok URL in .env file
 * Run this after starting a new ngrok tunnel
 */

import fs from "fs";
import path from "path";
import readline from "readline";

const envPath = path.join(__dirname, "../.env");

async function updateNgrokUrl() {
  console.log("\n🔄 Update ngrok URL Configuration\n");

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  try {
    console.log("📋 Instructions:");
    console.log("   1. Make sure ngrok is running: ngrok http 3000");
    console.log("   2. Copy the HTTPS forwarding URL from ngrok");
    console.log("   3. Paste it below (e.g., https://abc123.ngrok-free.app)\n");

    const ngrokUrl = await question("Enter your ngrok URL: ");

    if (!ngrokUrl || !ngrokUrl.startsWith("https://")) {
      console.error("\n❌ Invalid URL. Must start with https://");
      process.exit(1);
    }

    // Remove trailing slash
    const cleanUrl = ngrokUrl.replace(/\/$/, "");

    // Read .env file
    if (!fs.existsSync(envPath)) {
      console.error("\n❌ .env file not found");
      process.exit(1);
    }

    let envContent = fs.readFileSync(envPath, "utf-8");

    // Update URLs
    envContent = envContent.replace(
      /Custom_LLM_URL=.*/,
      `Custom_LLM_URL=${cleanUrl}/api/retell/llm`
    );
    envContent = envContent.replace(
      /Agent_Level_Webhook_URL=.*/,
      `Agent_Level_Webhook_URL=${cleanUrl}/api/retell/webhook`
    );

    // Write back
    fs.writeFileSync(envPath, envContent);

    console.log("\n✅ Configuration updated successfully!\n");
    console.log("📋 New URLs:");
    console.log(`   LLM: ${cleanUrl}/api/retell/llm`);
    console.log(`   Webhook: ${cleanUrl}/api/retell/webhook\n`);

    console.log("📋 Next steps:");
    console.log("   1. Restart your backend server");
    console.log(
      "   2. Go to Retell Dashboard: https://beta.retellai.com/dashboard"
    );
    console.log("   3. Select agent: Metalogics Assistant");
    console.log("   4. Update LLM Websocket URL to:");
    console.log(
      `      wss://${cleanUrl.replace("https://", "")}/api/retell/llm`
    );
    console.log("   5. Update Agent Webhook URL to:");
    console.log(`      ${cleanUrl}/api/retell/webhook`);
    console.log("   6. Save and test!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

updateNgrokUrl();
