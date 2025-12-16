#!/usr/bin/env tsx
/**
 * Toggle Retell Mode
 * Quickly switch between custom LLM and general prompt mode
 */

import fs from "fs";
import path from "path";

const envPath = path.join(__dirname, "../.env");

function toggleMode() {
  console.log("\n🔄 Toggling Retell Configuration Mode...\n");

  if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found");
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");

  let customLlmLine = -1;
  let webhookLine = -1;
  let isCurrentlyEnabled = false;

  // Find the custom LLM and webhook lines
  lines.forEach((line, index) => {
    if (line.includes("Custom_LLM_URL=")) {
      customLlmLine = index;
      isCurrentlyEnabled = !line.trim().startsWith("#");
    }
    if (line.includes("Agent_Level_Webhook_URL=")) {
      webhookLine = index;
    }
  });

  if (customLlmLine === -1) {
    console.error("❌ Custom_LLM_URL not found in .env");
    process.exit(1);
  }

  // Toggle the configuration
  if (isCurrentlyEnabled) {
    // Disable custom LLM (comment out)
    console.log("📝 Disabling custom LLM mode...");
    lines[customLlmLine] = "# " + lines[customLlmLine];
    if (webhookLine !== -1) {
      lines[webhookLine] = "# " + lines[webhookLine];
    }
    console.log("\n✅ Custom LLM mode DISABLED");
    console.log("\n📋 Next steps:");
    console.log(
      "   1. Go to Retell Dashboard: https://beta.retellai.com/dashboard"
    );
    console.log("   2. Select your agent: Metalogics Assistant");
    console.log("   3. In LLM Configuration, select 'Use General Prompt'");
    console.log(
      "   4. Add a prompt (see VOICE_TROUBLESHOOTING.md for example)"
    );
    console.log("   5. Save and test in your browser\n");
  } else {
    // Enable custom LLM (uncomment)
    console.log("📝 Enabling custom LLM mode...");
    lines[customLlmLine] = lines[customLlmLine].replace(/^#\s*/, "");
    if (webhookLine !== -1) {
      lines[webhookLine] = lines[webhookLine].replace(/^#\s*/, "");
    }
    console.log("\n✅ Custom LLM mode ENABLED");
    console.log("\n⚠️  Warning: Make sure ngrok is running!");
    console.log("\n📋 Next steps:");
    console.log("   1. Start ngrok: ngrok http 3000");
    console.log("   2. Update Custom_LLM_URL with new ngrok URL");
    console.log("   3. Configure agent in Retell Dashboard with the ngrok URL");
    console.log("   4. Restart backend server\n");
  }

  // Write back to file
  fs.writeFileSync(envPath, lines.join("\n"));

  console.log("💾 Configuration saved to .env");
  console.log("🔄 Restart your backend server to apply changes\n");
}

toggleMode();
