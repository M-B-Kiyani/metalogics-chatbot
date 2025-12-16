/**
 * Detailed test to verify Google service account key is properly loaded
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "../src/config";
import { google } from "googleapis";
import { JWT } from "google-auth-library";

async function testServiceAccountKey() {
  console.log("\n🔐 Testing Google Service Account Key Loading\n");
  console.log("=".repeat(60));

  // Step 1: Check environment variable
  console.log("\n📋 Step 1: Environment Variable Check");
  console.log("-".repeat(60));

  const keyPath = config.googleCalendar.serviceAccountKeyPath;
  console.log(`Key Path from Config: ${keyPath}`);

  if (!keyPath) {
    console.log("❌ GOOGLE_SERVICE_ACCOUNT_KEY_PATH is not set!");
    process.exit(1);
  }
  console.log("✓ Environment variable is set");

  // Step 2: Resolve full path
  console.log("\n📂 Step 2: File Path Resolution");
  console.log("-".repeat(60));

  const fullPath = path.resolve(process.cwd(), keyPath);
  console.log(`Working Directory: ${process.cwd()}`);
  console.log(`Relative Path: ${keyPath}`);
  console.log(`Full Path: ${fullPath}`);

  // Step 3: Check file exists
  console.log("\n📄 Step 3: File Existence Check");
  console.log("-".repeat(60));

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found at: ${fullPath}`);
    process.exit(1);
  }
  console.log("✓ File exists");

  // Step 4: Read and parse file
  console.log("\n📖 Step 4: Reading Key File");
  console.log("-".repeat(60));

  let keyData: any;
  try {
    const fileContent = fs.readFileSync(fullPath, "utf8");
    console.log(`File Size: ${fileContent.length} bytes`);

    keyData = JSON.parse(fileContent);
    console.log("✓ File successfully parsed as JSON");
  } catch (error) {
    console.log(`❌ Failed to read/parse file: ${error}`);
    process.exit(1);
  }

  // Step 5: Validate key structure
  console.log("\n🔍 Step 5: Key Structure Validation");
  console.log("-".repeat(60));

  const requiredFields = {
    type: "Type",
    project_id: "Project ID",
    private_key_id: "Private Key ID",
    private_key: "Private Key",
    client_email: "Client Email",
    client_id: "Client ID",
    auth_uri: "Auth URI",
    token_uri: "Token URI",
  };

  let allFieldsPresent = true;
  for (const [field, label] of Object.entries(requiredFields)) {
    if (keyData[field]) {
      const value =
        field === "private_key"
          ? `[${keyData[field].length} characters]`
          : keyData[field];
      console.log(`✓ ${label}: ${value}`);
    } else {
      console.log(`❌ ${label}: MISSING`);
      allFieldsPresent = false;
    }
  }

  if (!allFieldsPresent) {
    console.log("\n❌ Key file is missing required fields");
    process.exit(1);
  }

  // Step 6: Validate private key format
  console.log("\n🔑 Step 6: Private Key Format Validation");
  console.log("-".repeat(60));

  const privateKey = keyData.private_key;

  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    console.log("❌ Private key missing BEGIN marker");
    process.exit(1);
  }
  console.log("✓ Private key has BEGIN marker");

  if (!privateKey.includes("-----END PRIVATE KEY-----")) {
    console.log("❌ Private key missing END marker");
    process.exit(1);
  }
  console.log("✓ Private key has END marker");

  const keyLines = privateKey
    .split("\n")
    .filter(
      (line: string) => line && !line.includes("BEGIN") && !line.includes("END")
    );
  console.log(`✓ Private key has ${keyLines.length} data lines`);

  // Step 7: Test JWT creation
  console.log("\n🔐 Step 7: JWT Authentication Object Creation");
  console.log("-".repeat(60));

  let jwtClient: JWT;
  try {
    jwtClient = new google.auth.JWT({
      email: keyData.client_email,
      key: keyData.private_key,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });
    console.log("✓ JWT client created successfully");
    console.log(`  Email: ${keyData.client_email}`);
    console.log(`  Scopes: calendar, calendar.events`);
  } catch (error) {
    console.log(`❌ Failed to create JWT client: ${error}`);
    process.exit(1);
  }

  // Step 8: Test authentication
  console.log("\n🌐 Step 8: Google Authentication Test");
  console.log("-".repeat(60));

  try {
    console.log("Attempting to authorize with Google...");
    const tokens = await jwtClient.authorize();
    console.log("✓ Successfully authenticated with Google!");
    console.log(`  Token Type: ${tokens.token_type}`);
    console.log(`  Access Token: ${tokens.access_token?.substring(0, 20)}...`);
    console.log(
      `  Expires In: ${
        tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : "N/A"
      }`
    );
  } catch (error) {
    console.log(`❌ Authentication failed: ${error}`);
    process.exit(1);
  }

  // Step 9: Test Calendar API access
  console.log("\n📅 Step 9: Calendar API Access Test");
  console.log("-".repeat(60));

  try {
    const calendar = google.calendar({ version: "v3", auth: jwtClient });

    const calendarId = config.googleCalendar.calendarId;
    console.log(`Testing access to calendar: ${calendarId}`);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: now.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    console.log("✓ Successfully accessed Google Calendar API!");
    console.log(`  Events found: ${response.data.items?.length || 0}`);
    console.log(`  Calendar ID: ${calendarId}`);
  } catch (error: any) {
    console.log(`❌ Calendar API access failed: ${error.message}`);
    if (error.code) {
      console.log(`  Error Code: ${error.code}`);
    }
    process.exit(1);
  }

  // Step 10: Verify config matches key file
  console.log("\n✅ Step 10: Configuration Consistency Check");
  console.log("-".repeat(60));

  const configEmail = config.googleCalendar.serviceAccountEmail;
  const keyEmail = keyData.client_email;

  if (configEmail === keyEmail) {
    console.log(`✓ Service account email matches`);
    console.log(`  Config: ${configEmail}`);
    console.log(`  Key File: ${keyEmail}`);
  } else {
    console.log(`⚠️  Email mismatch detected!`);
    console.log(`  Config (.env): ${configEmail}`);
    console.log(`  Key File: ${keyEmail}`);
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL TESTS PASSED!");
  console.log("=".repeat(60));
  console.log("\nYour Google service account key is:");
  console.log("  ✓ Properly loaded from file");
  console.log("  ✓ Valid JSON format");
  console.log("  ✓ Contains all required fields");
  console.log("  ✓ Private key format is correct");
  console.log("  ✓ Successfully authenticates with Google");
  console.log("  ✓ Can access Google Calendar API");
  console.log("\n🎉 Your service account is fully operational!\n");
}

// Run the test
testServiceAccountKey()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
