import Retell from "retell-sdk";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * Retell AI Service
 * Handles all interactions with Retell AI SDK
 */
export class RetellService {
  private client: Retell | null = null;
  private isConfigured: boolean = false;

  constructor() {
    try {
      if (!config.retell.apiKey || !config.retell.enabled) {
        logger.warn("Retell integration is disabled or not configured", {
          enabled: config.retell.enabled,
          hasApiKey: !!config.retell.apiKey,
        });
        return;
      }

      // Initialize Retell SDK
      this.client = new Retell({
        apiKey: config.retell.apiKey,
      });

      this.isConfigured = true;
      logger.info("Retell SDK initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Retell SDK", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if Retell is properly configured
   */
  private ensureConfigured(): void {
    if (!this.isConfigured || !this.client) {
      throw new Error("Retell integration is not configured or disabled");
    }
  }

  /**
   * Create a new web call
   */
  async createWebCall(agentId: string, metadata?: Record<string, any>) {
    this.ensureConfigured();

    try {
      const response = await this.client!.call.createWebCall({
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
    this.ensureConfigured();

    try {
      const response = await this.client!.call.createPhoneCall({
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
    this.ensureConfigured();

    try {
      const call = await this.client!.call.retrieve(callId);
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
    this.ensureConfigured();

    try {
      const calls = await this.client!.call.list({
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
    this.ensureConfigured();

    try {
      const agent = await this.client!.agent.retrieve(agentId);
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
    this.ensureConfigured();

    try {
      const agent = await this.client!.agent.update(agentId, updates);
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
  getClient(): Retell | null {
    return this.client;
  }
}
