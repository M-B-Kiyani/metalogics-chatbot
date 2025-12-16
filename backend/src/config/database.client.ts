import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { AppError } from "../errors/AppError";
import { config } from "./index";

/**
 * Interface for database health check response
 */
export interface DatabaseHealth {
  status: "healthy" | "unhealthy";
  responseTime: number;
  connections?: {
    active: number;
    idle: number;
    total: number;
  };
  error?: string;
}

/**
 * DatabaseClient class manages the Prisma client instance and connection lifecycle
 * Implements connection pooling, health checks, and graceful shutdown
 */
export class DatabaseClient {
  private static instance: DatabaseClient;
  private prisma: PrismaClient | null = null;
  private isConnected: boolean = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of DatabaseClient
   */
  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  /**
   * Initialize and connect to the database
   * Configures connection pooling based on environment variables
   */
  public async connect(): Promise<void> {
    if (this.isConnected && this.prisma) {
      logger.warn("Database is already connected");
      return;
    }

    try {
      const poolSize = config.database.poolSize;

      logger.info("Initializing database connection", {
        poolSize,
        environment: config.server.nodeEnv,
      });

      // Initialize Prisma client with connection pooling configuration
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: config.database.url,
          },
        },
        log:
          config.server.nodeEnv === "development"
            ? ["query", "info", "warn", "error"]
            : ["error"],
      });

      // Test the connection
      await this.prisma.$connect();

      this.isConnected = true;

      logger.info("Database connected successfully", {
        poolSize,
      });
    } catch (error) {
      this.isConnected = false;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Failed to connect to database", {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new AppError(
        503,
        `Database connection failed: ${errorMessage}`,
        "DATABASE_CONNECTION_ERROR",
        true
      );
    }
  }

  /**
   * Disconnect from the database and cleanup resources
   * Should be called during graceful shutdown
   */
  public async disconnect(): Promise<void> {
    if (!this.prisma) {
      logger.warn("No database connection to disconnect");
      return;
    }

    try {
      logger.info("Disconnecting from database");

      await this.prisma.$disconnect();

      this.isConnected = false;
      this.prisma = null;

      logger.info("Database disconnected successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Error disconnecting from database", {
        error: errorMessage,
      });

      throw new AppError(
        500,
        `Database disconnection failed: ${errorMessage}`,
        "DATABASE_DISCONNECTION_ERROR",
        true
      );
    }
  }

  /**
   * Get the Prisma client instance
   * Throws an error if the database is not connected
   */
  public getClient(): PrismaClient {
    if (!this.prisma || !this.isConnected) {
      throw new AppError(
        503,
        "Database is not connected",
        "DATABASE_NOT_CONNECTED",
        true
      );
    }

    return this.prisma;
  }

  /**
   * Check database health and return connection statistics
   * Used for health check endpoints
   */
  public async getHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();

    if (!this.prisma || !this.isConnected) {
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        error: "Database is not connected",
      };
    }

    try {
      // Execute a simple query to test connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;

      // Get connection pool metrics
      const poolSize = config.database.poolSize;

      // Note: Prisma doesn't expose detailed pool metrics directly
      // These are estimated values based on configuration
      const connections = {
        active: 0, // Would need custom implementation to track
        idle: poolSize,
        total: poolSize,
      };

      logger.debug("Database health check successful", {
        responseTime,
        connections,
      });

      return {
        status: "healthy",
        responseTime,
        connections,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Database health check failed", {
        error: errorMessage,
        responseTime,
      });

      return {
        status: "unhealthy",
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if the database is currently connected
   */
  public isHealthy(): boolean {
    return this.isConnected && this.prisma !== null;
  }
}

// Export a singleton instance for convenience
export const databaseClient = DatabaseClient.getInstance();
