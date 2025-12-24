#!/usr/bin/env ts-node

/**
 * Simple Email Integration Test
 */

import { EmailClient } from "../src/integrations/email.client";

async function testEmailIntegration() {
  console.log("📧 Testing Email Integration");
  console.log("============================================================");

  try {
    const emailClient = new EmailClient();

    console.log("🔍 Testing SMTP connection...");
    const isConnected = await emailClient.verifyConnection();

    if (isConnected) {
      console.log("✅ SMTP connection verified successfully");
      console.log("📧 Email integration is working properly");
    } else {
      console.log("❌ SMTP connection failed");
    }

    await emailClient.close();
  } catch (error) {
    console.error(
      "❌ Email test failed:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

testEmailIntegration();
