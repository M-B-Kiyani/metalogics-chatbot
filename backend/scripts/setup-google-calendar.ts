#!/usr/bin/env ts-node
/**
 * Google Calendar Setup Helper Script
 *
 * This script helps you configure Google Calendar integration by:
 * 1. Checking for the service account key file
 * 2. Extracting credentials from the JSON key
 * 3. Updating the .env file with the correct values
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupGoogleCalendar() {
  console.log("🔧 Google Calendar Setup Helper");
  console.log("=".repeat(60));
  console.log();

  // Step 1: Get the path to the service account key file
  console.log("Step 1: Locate your Google Service Account Key File");
  console.log("-".repeat(60));
  console.log(
    "This is the JSON file you downloaded from Google Cloud Console."
  );
  console.log();

  const keyPath = await question(
    "Enter the path to your service account key file: "
  );

  if (!fs.existsSync(keyPath)) {
    console.log(`\n❌ File not found: ${keyPath}`);
    console.log("\nPlease ensure:");
    console.log("1. The file path is correct");
    console.log("2. The file exists in the specified location");
    console.log(
      '3. Use absolute path or relative path from backend directory (e.g., "./google-credentials.json")'
    );
    rl.close();
    process.exit(1);
  }

  console.log("✓ File found");

  // Step 2: Parse the key file
  console.log("\nStep 2: Parsing Service Account Key");
  console.log("-".repeat(60));

  let keyData: any;
  try {
    const keyContent = fs.readFileSync(keyPath, "utf-8");
    keyData = JSON.parse(keyContent);

    if (keyData.type !== "service_account") {
      console.log("❌ Invalid key file: not a service account key");
      rl.close();
      process.exit(1);
    }

    console.log("✓ Valid service account key file");
    console.log(`  Service Account Email: ${keyData.client_email}`);
    console.log(`  Project ID: ${keyData.project_id || "N/A"}`);
  } catch (error) {
    console.log(
      "❌ Failed to parse key file:",
      error instanceof Error ? error.message : "Unknown error"
    );
    rl.close();
    process.exit(1);
  }

  // Step 3: Get calendar ID
  console.log("\nStep 3: Calendar Configuration");
  console.log("-".repeat(60));
  console.log(
    'Enter the Calendar ID (press Enter to use "primary" for your main calendar):'
  );
  const calendarId =
    (await question("Calendar ID [primary]: ")).trim() || "primary";

  // Step 4: Get timezone
  console.log('\nEnter your timezone (press Enter to use "Europe/London"):');
  console.log(
    "Examples: Europe/London (UK), Asia/Karachi (Pakistan), America/New_York"
  );
  const timeZone =
    (await question("Timezone [Europe/London]: ")).trim() || "Europe/London";

  // Step 5: Copy key file to backend directory (optional)
  console.log("\nStep 4: Key File Location");
  console.log("-".repeat(60));
  const backendDir = path.resolve(__dirname, "..");
  const targetKeyPath = path.join(backendDir, "google-credentials.json");

  if (path.resolve(keyPath) !== targetKeyPath) {
    const copyFile = await question(
      `Copy key file to ${targetKeyPath}? (y/n) [y]: `
    );
    if (copyFile.toLowerCase() !== "n") {
      fs.copyFileSync(keyPath, targetKeyPath);
      console.log(`✓ Key file copied to: ${targetKeyPath}`);
      console.log(
        "  Note: This file is already in .gitignore and won't be committed"
      );
    }
  }

  // Step 6: Update .env file
  console.log("\nStep 5: Updating .env File");
  console.log("-".repeat(60));

  const envPath = path.join(backendDir, ".env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  // Remove existing Google Calendar configuration
  const lines = envContent.split("\n");
  const filteredLines = lines.filter(
    (line) =>
      !line.startsWith("GOOGLE_CALENDAR_") &&
      !line.startsWith("GOOGLE_SERVICE_ACCOUNT_")
  );

  // Add new configuration
  const googleCalendarConfig = `
# ============================================
# GOOGLE CALENDAR CONFIGURATION
# ============================================
GOOGLE_CALENDAR_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_EMAIL=${keyData.client_email}
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./google-credentials.json
GOOGLE_CALENDAR_ID=${calendarId}
GOOGLE_CALENDAR_TIMEZONE=${timeZone}
GOOGLE_CALENDAR_RETRY_ATTEMPTS=3
GOOGLE_CALENDAR_RETRY_DELAY=1000
`;

  const newEnvContent = filteredLines.join("\n") + "\n" + googleCalendarConfig;

  fs.writeFileSync(envPath, newEnvContent);
  console.log("✓ .env file updated");

  // Step 7: Update .gitignore
  console.log("\nStep 6: Updating .gitignore");
  console.log("-".repeat(60));

  const gitignorePath = path.join(backendDir, ".gitignore");
  let gitignoreContent = "";

  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
  }

  if (!gitignoreContent.includes("google-credentials.json")) {
    gitignoreContent +=
      "\n# Google Calendar credentials\ngoogle-credentials.json\n";
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log("✓ .gitignore updated");
  } else {
    console.log("✓ .gitignore already configured");
  }

  // Step 8: Next steps
  console.log("\n" + "=".repeat(60));
  console.log("✅ GOOGLE CALENDAR SETUP COMPLETE");
  console.log("=".repeat(60));
  console.log("\n📋 Next Steps:");
  console.log("\n1. Share your Google Calendar with the service account:");
  console.log(`   Email: ${keyData.client_email}`);
  console.log("   Permission: Make changes to events");
  console.log("\n   Instructions:");
  console.log("   a. Open Google Calendar: https://calendar.google.com");
  console.log(
    "   b. Go to Settings → Settings for my calendars → [Your Calendar]"
  );
  console.log('   c. Scroll to "Share with specific people"');
  console.log('   d. Click "Add people"');
  console.log("   e. Add the service account email above");
  console.log('   f. Set permission to "Make changes to events"');
  console.log('   g. Click "Send"');
  console.log("\n2. Test the integration:");
  console.log("   npm run test:google-calendar");
  console.log("\n3. If the test passes, you're ready to use Google Calendar!");

  rl.close();
}

setupGoogleCalendar().catch((error) => {
  console.error("\n❌ Setup failed:", error);
  rl.close();
  process.exit(1);
});
