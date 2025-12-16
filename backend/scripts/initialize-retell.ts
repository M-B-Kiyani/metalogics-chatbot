import { config } from "../src/config";
import { RetellService } from "../src/services/retell.service";
import { logger } from "../src/utils/logger";

/**
 * Initialize and verify Retell SDK setup
 * This script will:
 * 1. Initialize the Retell SDK
 * 2. Verify API key is valid
 * 3. Get agent details
 * 4. Optionally update agent with webhook URLs
 */
async function initializeRetell() {
  try {
    logger.info("Starting Retell SDK initialization...");

    // Check if Retell is enabled
    if (!config.retell.enabled) {
      logger.warn("Retell integration is disabled in configuration");
      return;
    }

    // Check if API key is configured
    if (!config.retell.apiKey) {
      logger.error("RETELL_API_KEY is not configured");
      return;
    }

    // Initialize Retell service
    const retellService = new RetellService();
    logger.info("✓ Retell SDK initialized successfully");

    // Get agent details
    if (config.retell.agentId) {
      logger.info(`Fetching agent details for: ${config.retell.agentId}`);
      const agent = await retellService.getAgent(config.retell.agentId);

      logger.info("✓ Agent details retrieved:", {
        agentId: agent.agent_id,
      });

      // Update agent with webhook URLs if configured
      if (config.retell.customLlmUrl || config.retell.webhookUrl) {
        logger.info("Updating agent with webhook URLs...");

        const updates: any = {};

        if (config.retell.customLlmUrl) {
          updates.llm_websocket_url = config.retell.customLlmUrl;
          logger.info(`  Custom LLM URL: ${config.retell.customLlmUrl}`);
        }

        if (config.retell.webhookUrl) {
          updates.agent_webhook_url = config.retell.webhookUrl;
          logger.info(`  Webhook URL: ${config.retell.webhookUrl}`);
        }

        await retellService.updateAgent(config.retell.agentId, updates);
        logger.info("✓ Agent updated successfully");
      } else {
        logger.info("✓ No webhook URLs configured to update");
      }
    } else {
      logger.warn(
        "RETELL_AGENT_ID is not configured, skipping agent verification"
      );
    }

    // List recent calls
    logger.info("Fetching recent calls...");
    const calls = await retellService.listCalls(5);
    logger.info(`✓ Found ${calls.length} recent calls`);

    logger.info("\n=== Retell SDK Initialization Complete ===");
    logger.info("Configuration:");
    logger.info(`  API Key: ${config.retell.apiKey.substring(0, 10)}...`);
    logger.info(`  Agent ID: ${config.retell.agentId}`);
    logger.info(`  Enabled: ${config.retell.enabled}`);
    logger.info(
      `  Custom LLM URL: ${config.retell.customLlmUrl || "Not configured"}`
    );
    logger.info(
      `  Webhook URL: ${config.retell.webhookUrl || "Not configured"}`
    );
    logger.info("==========================================\n");
  } catch (error) {
    logger.error("Failed to initialize Retell SDK:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Run the initialization
initializeRetell()
  .then(() => {
    logger.info("Retell initialization completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Retell initialization failed:", error);
    process.exit(1);
  });
