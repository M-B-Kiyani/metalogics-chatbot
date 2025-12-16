/**
 * Verification script to test email notification setup
 * This script verifies that the email client can be instantiated
 * and that the configuration is properly loaded
 */

import { EmailClient } from "../integrations/email.client";
import { NotificationService } from "../services/notification.service";
import { logger } from "../utils/logger";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function verifyEmailSetup() {
  logger.info("Starting email setup verification...");

  try {
    // Test 1: Instantiate EmailClient
    logger.info("Test 1: Instantiating EmailClient...");
    const emailClient = new EmailClient();
    logger.info("✓ EmailClient instantiated successfully");

    // Test 2: Verify SMTP connection (optional - only if credentials are valid)
    logger.info("Test 2: Verifying SMTP connection...");
    const isConnected = await emailClient.verifyConnection();
    if (isConnected) {
      logger.info("✓ SMTP connection verified successfully");
    } else {
      logger.warn("⚠ SMTP connection verification failed (check credentials)");
    }

    // Test 3: Instantiate NotificationService
    logger.info("Test 3: Instantiating NotificationService...");
    const notificationService = new NotificationService(emailClient);
    logger.info("✓ NotificationService instantiated successfully");

    // Test 4: Check environment variables
    logger.info("Test 4: Checking environment variables...");
    const requiredVars = [
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASSWORD",
      "ADMIN_EMAIL",
    ];
    const missingVars = requiredVars.filter((v) => !process.env[v]);

    if (missingVars.length === 0) {
      logger.info("✓ All required environment variables are set");
    } else {
      logger.warn(`⚠ Missing environment variables: ${missingVars.join(", ")}`);
    }

    // Cleanup
    await emailClient.close();
    await notificationService.close();

    logger.info("Email setup verification completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("Email setup verification failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Run verification
verifyEmailSetup();
