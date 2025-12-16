/**
 * Test Configuration Validation Script
 * Demonstrates the configuration validation functionality
 */

import {
  validateAllConfig,
  printValidationResults,
  printDetailedConfigSummary,
} from "../utils/configValidator";
import { logger } from "../utils/logger";

/**
 * Main function to test configuration validation
 */
async function testConfigValidation(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 TESTING CONFIGURATION VALIDATION");
  console.log("=".repeat(60) + "\n");

  try {
    // Run validation
    logger.info("Running configuration validation...");
    const result = validateAllConfig();

    // Print results
    printValidationResults(result);

    // Print detailed summary
    printDetailedConfigSummary();

    // Exit with appropriate code
    if (result.valid) {
      console.log("✅ Configuration validation test completed successfully\n");
      process.exit(0);
    } else {
      console.log("❌ Configuration validation test found errors\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Configuration validation test failed:");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testConfigValidation();
