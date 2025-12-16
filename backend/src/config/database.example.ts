/**
 * Example usage of DatabaseClient
 * This file demonstrates how to use the DatabaseClient in your application
 */

import { databaseClient, DatabaseClient } from "./database.client";

/**
 * Example 1: Using the singleton instance
 */
async function exampleUsingSingleton() {
  try {
    // Connect to the database
    await databaseClient.connect();

    // Get the Prisma client for queries
    const prisma = databaseClient.getClient();

    // Use Prisma client for database operations
    const bookings = await prisma.booking.findMany({
      take: 10,
    });

    console.log(`Found ${bookings.length} bookings`);

    // Check database health
    const health = await databaseClient.getHealth();
    console.log("Database health:", health);

    // Disconnect when done (usually in graceful shutdown)
    await databaseClient.disconnect();
  } catch (error) {
    console.error("Database operation failed:", error);
  }
}

/**
 * Example 2: Using getInstance() method
 */
async function exampleUsingGetInstance() {
  const dbClient = DatabaseClient.getInstance();

  try {
    await dbClient.connect();

    // Check if database is healthy
    if (dbClient.isHealthy()) {
      console.log("Database is healthy");
    }

    const prisma = dbClient.getClient();
    // Perform database operations...
    await prisma.$queryRaw`SELECT 1`;

    await dbClient.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

/**
 * Example 3: Graceful shutdown handler
 */
async function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, closing database connection...`);

    try {
      await databaseClient.disconnect();
      console.log("Database connection closed");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

/**
 * Example 4: Health check endpoint usage
 */
async function healthCheckExample() {
  const health = await databaseClient.getHealth();

  if (health.status === "healthy") {
    console.log(
      `Database is healthy (response time: ${health.responseTime}ms)`
    );
    console.log("Connection pool:", health.connections);
  } else {
    console.error(`Database is unhealthy: ${health.error}`);
  }

  return health;
}

// Export examples for reference
export {
  exampleUsingSingleton,
  exampleUsingGetInstance,
  setupGracefulShutdown,
  healthCheckExample,
};
