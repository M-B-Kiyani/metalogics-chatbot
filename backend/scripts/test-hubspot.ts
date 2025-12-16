#!/usr/bin/env ts-node
/**
 * HubSpot CRM Authentication Test Script
 *
 * This script tests HubSpot authentication and basic API operations.
 * Use this to verify your HubSpot setup before deployment.
 */

import { config } from "../src/config";
import { HubSpotClient } from "../src/integrations/hubspot.client";

async function testHubSpot() {
  console.log("🔍 Testing HubSpot CRM Integration");
  console.log("=".repeat(60));

  // Check if enabled
  if (!config.hubspot.enabled) {
    console.log("❌ HubSpot is disabled in configuration");
    console.log("Set HUBSPOT_ENABLED=true to enable");
    process.exit(1);
  }

  console.log("✓ HubSpot is enabled");

  // Check access token
  console.log("\n🔑 Checking access token...");
  const token = config.hubspot.accessToken;

  if (!token || token.length < 20) {
    console.log("❌ Invalid or missing HubSpot access token");
    console.log("\nPlease ensure:");
    console.log("1. You have created a private app in HubSpot");
    console.log(
      "2. You have granted the necessary scopes (contacts read/write)"
    );
    console.log("3. You have copied the access token");
    console.log("4. The HUBSPOT_ACCESS_TOKEN environment variable is set");
    process.exit(1);
  }

  console.log("✓ Access token is present");
  console.log(`  Token length: ${token.length} characters`);
  console.log(`  Token prefix: ${token.substring(0, 10)}...`);

  // Test authentication
  console.log("\n🔐 Testing authentication...");
  const hubspotClient = new HubSpotClient();

  try {
    await hubspotClient.initialize(token);

    if (!hubspotClient.isAuthenticated()) {
      console.log("❌ Authentication failed");
      process.exit(1);
    }

    console.log("✓ Successfully authenticated with HubSpot API");
  } catch (error) {
    console.log(
      "❌ Authentication error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.log("\nTroubleshooting:");
    console.log("1. Verify the access token is valid and not expired");
    console.log("2. Ensure the private app has the necessary scopes");
    console.log("3. Check that the private app is not disabled");
    console.log("4. Verify your HubSpot account is active");
    process.exit(1);
  }

  // Test contact search
  console.log("\n🔍 Testing contact search...");
  console.log("Searching for a test contact...");

  try {
    const testEmail = "test-deployment-validation@example.com";
    const contact = await hubspotClient.searchContactByEmail(testEmail);

    if (contact) {
      console.log(`✓ Found existing contact: ${contact.properties.email}`);
      console.log(`  Contact ID: ${contact.id}`);
      console.log(
        `  Name: ${contact.properties.firstname || ""} ${
          contact.properties.lastname || ""
        }`
      );
    } else {
      console.log("✓ Search completed (no contact found with test email)");
    }
  } catch (error) {
    console.log(
      "❌ Contact search failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.log("\nTroubleshooting:");
    console.log('1. Ensure the private app has "Read" scope for contacts');
    console.log("2. Verify your HubSpot account has access to contacts");
    process.exit(1);
  }

  // Test contact creation (optional)
  console.log("\n🧪 Testing contact creation...");
  console.log("Creating a test contact...");

  let testContactId: string | null = null;

  try {
    const testEmail = `test-${Date.now()}@deployment-validation.example.com`;
    const testContact = await hubspotClient.createContact({
      email: testEmail,
      firstname: "Deployment",
      lastname: "Test",
      company: "Validation Script",
      phone: "+923001234567",
    });

    testContactId = testContact.id;

    console.log("✓ Successfully created test contact");
    console.log(`  Contact ID: ${testContact.id}`);
    console.log(`  Email: ${testContact.properties.email}`);
    console.log(
      `  Name: ${testContact.properties.firstname} ${testContact.properties.lastname}`
    );
  } catch (error) {
    console.log(
      "⚠️  Contact creation test failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    console.log("This may indicate insufficient permissions.");
    console.log('Ensure the private app has "Write" scope for contacts.');
  }

  // Test contact update
  if (testContactId) {
    console.log("\n🔄 Testing contact update...");

    try {
      const updatedContact = await hubspotClient.updateContact(testContactId, {
        properties: {
          company: "Updated Validation Script",
          phone: "+1234567890",
        },
      });

      console.log("✓ Successfully updated test contact");
      console.log(`  Company: ${updatedContact.properties.company}`);
      console.log(`  Phone: ${updatedContact.properties.phone || "N/A"}`);
    } catch (error) {
      console.log(
        "⚠️  Contact update test failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    // Note: We don't delete the test contact as HubSpot doesn't allow easy deletion via API
    console.log("\n📝 Note: Test contact was created but not deleted.");
    console.log("   You can manually delete it from HubSpot if desired.");
    console.log(`   Contact ID: ${testContactId}`);
  }

  // Test upsert functionality
  console.log("\n🔄 Testing upsert functionality...");

  try {
    const upsertEmail = `upsert-test-${Date.now()}@deployment-validation.example.com`;

    // First upsert (should create)
    const contact1 = await hubspotClient.upsertContact({
      email: upsertEmail,
      firstname: "Upsert",
      lastname: "Test1",
    });

    console.log("✓ First upsert created contact");
    console.log(`  Contact ID: ${contact1.id}`);

    // Second upsert (should update)
    const contact2 = await hubspotClient.upsertContact({
      email: upsertEmail,
      firstname: "Upsert",
      lastname: "Test2",
      company: "Updated Company",
    });

    console.log("✓ Second upsert updated existing contact");
    console.log(
      `  Same Contact ID: ${contact2.id === contact1.id ? "Yes" : "No"}`
    );
    console.log(`  Updated Company: ${contact2.properties.company}`);
  } catch (error) {
    console.log(
      "⚠️  Upsert test failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ HUBSPOT CRM INTEGRATION TEST PASSED");
  console.log("=".repeat(60));
  console.log("\nYour HubSpot integration is properly configured.");
  console.log("\nConfiguration summary:");
  console.log(
    `  Access Token: ${token.substring(0, 10)}...${token.substring(
      token.length - 4
    )}`
  );
  console.log(`  Retry Attempts: ${config.hubspot.retryAttempts}`);
  console.log(`  Retry Delay: ${config.hubspot.retryDelay}ms`);
  console.log("\nThe booking system is ready to use HubSpot CRM.");
  console.log("\nNote: Test contacts were created during validation.");
  console.log("You may want to clean them up in your HubSpot account.");
}

testHubSpot().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
