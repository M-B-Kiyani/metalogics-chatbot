/**
 * Configuration verification script
 * Tests that the configuration system loads and validates correctly
 */

import { config, printConfigSummary } from "../config";

console.log("=== Configuration System Verification ===\n");

try {
  // Print configuration summary
  printConfigSummary();

  // Verify all configuration sections are loaded
  console.log("✓ Configuration loaded successfully\n");

  console.log("Detailed Configuration:");
  console.log("─".repeat(50));

  console.log("\n📡 Server Configuration:");
  console.log(`   Environment: ${config.server.nodeEnv}`);
  console.log(`   Port: ${config.server.port}`);
  console.log(`   API Base URL: ${config.server.apiBaseUrl}`);
  console.log(`   Request Timeout: ${config.server.requestTimeout}ms`);

  console.log("\n💾 Database Configuration:");
  console.log(`   URL: ${config.database.url.replace(/:[^:@]+@/, ":****@")}`); // Hide password
  console.log(`   Pool Size: ${config.database.poolSize}`);
  console.log(`   Connection Timeout: ${config.database.connectionTimeout}ms`);
  console.log(`   Query Timeout: ${config.database.queryTimeout}ms`);

  console.log("\n📧 Email Configuration:");
  console.log(`   SMTP Host: ${config.email.smtpHost}`);
  console.log(`   SMTP Port: ${config.email.smtpPort}`);
  console.log(`   SMTP User: ${config.email.smtpUser}`);
  console.log(`   Admin Email: ${config.email.adminEmail}`);
  console.log(`   From Email: ${config.email.fromEmail}`);
  console.log(`   From Name: ${config.email.fromName}`);
  console.log(`   Retry Attempts: ${config.email.retryAttempts}`);
  console.log(`   Retry Delay: ${config.email.retryDelay}ms`);

  console.log("\n🔐 Authentication Configuration:");
  console.log(`   API Key: ${config.auth.apiKey.substring(0, 8)}...`); // Show only first 8 chars
  console.log(`   API Key Header: ${config.auth.apiKeyHeader}`);

  console.log("\n📝 Logging Configuration:");
  console.log(`   Level: ${config.logging.level}`);
  console.log(`   File Path: ${config.logging.filePath || "not configured"}`);
  console.log(`   Console Enabled: ${config.logging.enableConsole}`);
  console.log(`   File Enabled: ${config.logging.enableFile}`);
  console.log(`   Max File Size: ${config.logging.maxFileSize}`);
  console.log(`   Max Files: ${config.logging.maxFiles}`);

  console.log("\n⏱️  Rate Limiting Configuration:");
  console.log(
    `   Window: ${config.rateLimit.windowMs}ms (${
      config.rateLimit.windowMs / 1000
    }s)`
  );
  console.log(`   Max Requests: ${config.rateLimit.maxRequests}`);
  console.log(`   Skip Successful: ${config.rateLimit.skipSuccessfulRequests}`);

  console.log("\n🌐 CORS Configuration:");
  console.log(`   Allowed Origins: ${config.cors.allowedOrigins.join(", ")}`);
  console.log(`   Allowed Methods: ${config.cors.allowedMethods.join(", ")}`);
  console.log(`   Allowed Headers: ${config.cors.allowedHeaders.join(", ")}`);
  console.log(`   Credentials: ${config.cors.credentials}`);
  console.log(`   Max Age: ${config.cors.maxAge}s`);

  console.log("\n" + "─".repeat(50));
  console.log("\n✅ All configuration sections verified successfully!");
  console.log("\n💡 Tips:");
  console.log("   - Update .env file to customize configuration");
  console.log("   - See .env.example for all available options");
  console.log("   - Configuration is validated on startup");
  console.log("");

  process.exit(0);
} catch (error) {
  console.error("\n❌ Configuration verification failed:");
  console.error(error instanceof Error ? error.message : String(error));
  console.error(
    "\n💡 Check your .env file and ensure all required variables are set."
  );
  console.error("   Refer to .env.example for the complete list.\n");
  process.exit(1);
}
