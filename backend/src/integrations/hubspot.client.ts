import { Client } from "@hubspot/api-client";
import { logger } from "../utils/logger";
import { RetryService } from "../services/retry.service";
import { CRMError, CRMAuthError } from "../errors/CRMError";
import { config } from "../config";
import { CircuitBreaker } from "../utils/circuitBreaker";

/**
 * HubSpot contact structure
 */
export interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    phone?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Data required to create a contact
 */
export interface CreateContactData {
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  phone?: string;
  customProperties?: Record<string, string>;
}

/**
 * Data for updating an existing contact
 */
export interface UpdateContactData {
  properties: Record<string, string>;
}

/**
 * HubSpotClient handles HubSpot CRM API communication
 * Implements authentication, contact management, and retry logic
 */
export class HubSpotClient {
  private client: Client | null = null;
  private retryService: RetryService;
  private circuitBreaker: CircuitBreaker;
  private initialized: boolean = false;

  constructor() {
    // Configure retry service with HubSpot-specific settings from config
    this.retryService = new RetryService({
      maxAttempts: config.hubspot.retryAttempts,
      initialDelay: config.hubspot.retryDelay,
      maxDelay: config.hubspot.retryDelay * 4,
      backoffMultiplier: 2,
    });

    // Configure circuit breaker for HubSpot API
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5, // Open circuit after 5 failures
      resetTimeout: 60000, // Try again after 60 seconds
      monitoringPeriod: 120000, // Monitor failures over 2 minutes
      name: "HubSpotAPI",
    });

    logger.info("HubSpotClient instance created");
  }

  /**
   * Initialize the HubSpot client with private app access token
   *
   * @param accessToken - HubSpot private app access token
   * @throws CRMAuthError if authentication fails
   */
  async initialize(accessToken: string): Promise<void> {
    try {
      logger.info("Initializing HubSpotClient with access token");

      if (!accessToken || accessToken.trim().length === 0) {
        throw new CRMAuthError("HubSpot access token is required");
      }

      // Validate token format (HubSpot tokens typically start with "pat-")
      if (!accessToken.startsWith("pat-") && !accessToken.startsWith("test-")) {
        logger.warn("HubSpot access token does not match expected format");
      }

      // Initialize HubSpot client with access token
      this.client = new Client({ accessToken });

      // Verify authentication by making a test API call
      await this.verifyAuthentication();

      this.initialized = true;

      logger.info("HubSpotClient initialized successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to initialize HubSpotClient", {
        error: errorMessage,
      });

      if (error instanceof CRMAuthError) {
        throw error;
      }

      throw new CRMAuthError(
        `Failed to authenticate with HubSpot: ${errorMessage}`
      );
    }
  }

  /**
   * Initialize from configuration
   * Loads access token from config
   *
   * @throws CRMAuthError if access token is not configured
   */
  async initializeFromConfig(): Promise<void> {
    try {
      const accessToken = config.hubspot.accessToken;

      if (!accessToken) {
        throw new CRMAuthError("HubSpot access token not configured");
      }

      await this.initialize(accessToken);
    } catch (error) {
      if (error instanceof CRMAuthError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to load HubSpot credentials from config", {
        error: errorMessage,
      });

      throw new CRMAuthError(
        `Failed to load HubSpot credentials: ${errorMessage}`
      );
    }
  }

  /**
   * Verify authentication by making a test API call
   *
   * @throws CRMAuthError if authentication fails
   */
  private async verifyAuthentication(): Promise<void> {
    try {
      // Make a simple API call to verify authentication
      // Get account info to verify token is valid
      await this.client!.apiRequest({
        method: "GET",
        path: "/account-info/v3/api-usage/daily",
      });

      logger.info("HubSpot authentication verified successfully");
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("HubSpot authentication verification failed", {
        error: errorMessage,
        statusCode: error.statusCode,
      });

      if (error.statusCode === 401 || error.statusCode === 403) {
        throw new CRMAuthError(
          "Invalid HubSpot access token or insufficient permissions"
        );
      }

      throw new CRMAuthError(
        `Failed to verify HubSpot authentication: ${errorMessage}`
      );
    }
  }

  /**
   * Check if the client is authenticated and ready to use
   *
   * @returns true if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return this.initialized && this.client !== null;
  }

  /**
   * Ensure the client is initialized before making API calls
   *
   * @throws CRMAuthError if not initialized
   */
  private ensureInitialized(): void {
    if (!this.isAuthenticated()) {
      throw new CRMAuthError(
        "HubSpotClient not initialized. Call initialize() first."
      );
    }
  }

  /**
   * Search for a contact by email address
   *
   * @param email - Email address to search for
   * @returns HubSpot contact if found, null otherwise
   * @throws CRMError if API call fails
   */
  async searchContactByEmail(email: string): Promise<HubSpotContact | null> {
    this.ensureInitialized();

    try {
      logger.info("Searching for HubSpot contact by email", { email });

      // Use circuit breaker and retry service for API call
      const response = await this.circuitBreaker.execute(async () => {
        return await this.retryService.withRetry(async () => {
          return await this.client!.crm.contacts.searchApi.doSearch({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: "email",
                    operator: "EQ" as any,
                    value: email,
                  },
                ],
              },
            ],
            properties: ["email", "firstname", "lastname", "company", "phone"],
            limit: 1,
          });
        });
      });

      const contacts = response.results;

      if (!contacts || contacts.length === 0) {
        logger.info("No HubSpot contact found for email", { email });
        return null;
      }

      const contact = contacts[0];

      logger.info("Found HubSpot contact", {
        email,
        contactId: contact.id,
      });

      return {
        id: contact.id,
        properties: contact.properties as any,
        createdAt: (contact.createdAt as any) || new Date().toISOString(),
        updatedAt: (contact.updatedAt as any) || new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to search for HubSpot contact", {
        email,
        error: errorMessage,
        statusCode: error.statusCode,
      });

      throw new CRMError(
        `Failed to search for contact: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create a new contact in HubSpot
   *
   * @param contactData - Contact data
   * @returns Created HubSpot contact
   * @throws CRMError if API call fails
   */
  async createContact(contactData: CreateContactData): Promise<HubSpotContact> {
    this.ensureInitialized();

    try {
      logger.info("Creating HubSpot contact", {
        email: contactData.email,
      });

      // Prepare contact properties
      const properties: Record<string, string> = {
        email: contactData.email,
      };

      if (contactData.firstname) {
        properties.firstname = contactData.firstname;
      }

      if (contactData.lastname) {
        properties.lastname = contactData.lastname;
      }

      if (contactData.company) {
        properties.company = contactData.company;
      }

      if (contactData.phone) {
        properties.phone = contactData.phone;
      }

      // Add custom properties if provided
      if (contactData.customProperties) {
        Object.assign(properties, contactData.customProperties);
      }

      // Use circuit breaker and retry service for API call
      const response = await this.circuitBreaker.execute(async () => {
        return await this.retryService.withRetry(async () => {
          return await this.client!.crm.contacts.basicApi.create({
            properties,
            associations: [],
          });
        });
      });

      logger.info("Successfully created HubSpot contact", {
        email: contactData.email,
        contactId: response.id,
      });

      return {
        id: response.id,
        properties: response.properties as any,
        createdAt: (response.createdAt as any) || new Date().toISOString(),
        updatedAt: (response.updatedAt as any) || new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to create HubSpot contact", {
        email: contactData.email,
        error: errorMessage,
        statusCode: error.statusCode,
      });

      throw new CRMError(
        `Failed to create contact: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update an existing contact in HubSpot
   *
   * @param contactId - HubSpot contact ID
   * @param updates - Contact property updates
   * @returns Updated HubSpot contact
   * @throws CRMError if API call fails
   */
  async updateContact(
    contactId: string,
    updates: UpdateContactData
  ): Promise<HubSpotContact> {
    this.ensureInitialized();

    try {
      logger.info("Updating HubSpot contact", {
        contactId,
        properties: Object.keys(updates.properties),
      });

      // Use circuit breaker and retry service for API call
      const response = await this.circuitBreaker.execute(async () => {
        return await this.retryService.withRetry(async () => {
          return await this.client!.crm.contacts.basicApi.update(contactId, {
            properties: updates.properties,
          });
        });
      });

      logger.info("Successfully updated HubSpot contact", {
        contactId,
      });

      return {
        id: response.id,
        properties: response.properties as any,
        createdAt: (response.createdAt as any) || new Date().toISOString(),
        updatedAt: (response.updatedAt as any) || new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to update HubSpot contact", {
        contactId,
        error: errorMessage,
        statusCode: error.statusCode,
      });

      throw new CRMError(
        `Failed to update contact: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create or update a contact (upsert operation)
   * Checks if contact exists by email, then creates or updates accordingly
   *
   * @param contactData - Contact data
   * @returns Created or updated HubSpot contact
   * @throws CRMError if API call fails
   */
  async upsertContact(contactData: CreateContactData): Promise<HubSpotContact> {
    this.ensureInitialized();

    try {
      logger.info("Upserting HubSpot contact", {
        email: contactData.email,
      });

      // First, search for existing contact by email
      const existingContact = await this.searchContactByEmail(
        contactData.email
      );

      if (existingContact) {
        // Contact exists, update it
        logger.info("Contact exists, updating", {
          email: contactData.email,
          contactId: existingContact.id,
        });

        // Prepare update properties
        const updateProperties: Record<string, string> = {};

        if (contactData.firstname) {
          updateProperties.firstname = contactData.firstname;
        }

        if (contactData.lastname) {
          updateProperties.lastname = contactData.lastname;
        }

        if (contactData.company) {
          updateProperties.company = contactData.company;
        }

        if (contactData.phone) {
          updateProperties.phone = contactData.phone;
        }

        // Add custom properties if provided
        if (contactData.customProperties) {
          Object.assign(updateProperties, contactData.customProperties);
        }

        return await this.updateContact(existingContact.id, {
          properties: updateProperties,
        });
      } else {
        // Contact doesn't exist, create it
        logger.info("Contact does not exist, creating", {
          email: contactData.email,
        });

        return await this.createContact(contactData);
      }
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("Failed to upsert HubSpot contact", {
        email: contactData.email,
        error: errorMessage,
      });

      throw new CRMError(
        `Failed to upsert contact: ${errorMessage}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get circuit breaker statistics
   * Useful for monitoring and health checks
   *
   * @returns Circuit breaker statistics
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }
}
