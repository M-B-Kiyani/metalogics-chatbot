import Retell from "retell-sdk";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * Retell AI Service
 * Handles all interactions with Retell AI SDK
 */
export class RetellService {
  private client: Retell;

  constructor() {
    if (!config.retell.apiKey) {
      throw new Error("RETELL_API_KEY is not configured");
    }

    // Initialize Retell SDK
    this.client = new Retell({
      apiKey: config.retell.apiKey,
    });

    logger.info("Retell SDK initialized successfully");
  }

  /**
   * Create a new web call
   */
  async createWebCall(agentId: string, metadata?: Record<string, any>) {
    try {
      const response = await this.client.call.createWebCall({
        agent_id: agentId,
        metadata,
      });

      logger.info("Web call created", {
        callId: response.call_id,
        agentId,
      });

      return response;
    } catch (error) {
      logger.error("Failed to create web call", {
        error: error instanceof Error ? error.message : String(error),
        agentId,
      });
      throw error;
    }
  }

  /**
   * Create a phone call
   */
  async createPhoneCall(params: {
    fromNumber: string;
    toNumber: string;
    agentId: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await this.client.call.createPhoneCall({
        from_number: params.fromNumber,
        to_number: params.toNumber,
        override_agent_id: params.agentId,
        metadata: params.metadata,
      });

      logger.info("Phone call created", {
        callId: response.call_id,
        agentId: params.agentId,
        toNumber: params.toNumber,
      });

      return response;
    } catch (error) {
      logger.error("Failed to create phone call", {
        error: error instanceof Error ? error.message : String(error),
        agentId: params.agentId,
        toNumber: params.toNumber,
      });
      throw error;
    }
  }

  /**
   * Get call details
   */
  async getCall(callId: string) {
    try {
      const call = await this.client.call.retrieve(callId);
      return call;
    } catch (error) {
      logger.error("Failed to retrieve call", {
        error: error instanceof Error ? error.message : String(error),
        callId,
      });
      throw error;
    }
  }

  /**
   * List all calls
   */
  async listCalls(limit?: number) {
    try {
      const calls = await this.client.call.list({
        limit: limit || 100,
      });
      return calls;
    } catch (error) {
      logger.error("Failed to list calls", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get agent details
   */
  async getAgent(agentId: string) {
    try {
      const agent = await this.client.agent.retrieve(agentId);
      return agent;
    } catch (error) {
      logger.error("Failed to retrieve agent", {
        error: error instanceof Error ? error.message : String(error),
        agentId,
      });
      throw error;
    }
  }

  /**
   * Update agent configuration
   */
  async updateAgent(agentId: string, updates: any) {
    try {
      const agent = await this.client.agent.update(agentId, updates);
      logger.info("Agent updated", { agentId });
      return agent;
    } catch (error) {
      logger.error("Failed to update agent", {
        error: error instanceof Error ? error.message : String(error),
        agentId,
      });
      throw error;
    }
  }

  /**
   * Get the Retell client instance for advanced usage
   */
  getClient(): Retell {
    return this.client;
  }
}
