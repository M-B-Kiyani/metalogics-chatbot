import { Request, Response } from "express";
import { DatabaseClient } from "../config/database.client";
import { logger } from "../utils/logger";
import { CalendarClient } from "../integrations/calendar.client";
import { HubSpotClient } from "../integrations/hubspot.client";
import { config } from "../config";
import { cacheService } from "../utils/cache.service";

/**
 * HealthController handles health check endpoints
 * Provides service status and database connectivity information
 */
export class HealthController {
  private startTime: number;
  private version: string;

  constructor(
    private databaseClient: DatabaseClient,
    private calendarClient?: CalendarClient,
    private hubspotClient?: HubSpotClient
  ) {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || "1.0.0";
  }

  /**
   * Check overall service health
   * GET /api/health
   * Returns service status, uptime, version, and cache statistics
   */
  public checkHealth = async (
    _req: Request,
    res: Response
  ): Promise<Response> => {
    const startTime = Date.now();

    try {
      const uptime = Math.floor((Date.now() - this.startTime) / 1000); // uptime in seconds

      // Get cache statistics
      const cacheStats = cacheService.getStats();

      const healthResponse = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime,
        version: this.version,
        cache: cacheStats,
      };

      const responseTime = Date.now() - startTime;

      logger.debug("Health check completed", {
        responseTime,
        uptime,
        cacheStats,
      });

      // Ensure response is within 500ms requirement
      if (responseTime > 500) {
        logger.warn("Health check exceeded 500ms threshold", {
          responseTime,
        });
      }

      return res.status(200).json(healthResponse);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Health check failed", {
        error: errorMessage,
      });

      return res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: errorMessage,
      });
    }
  };

  /**
   * Check database health and connectivity
   * GET /api/health/db
   * Returns database status, response time, and connection pool stats
   */
  public checkDatabaseHealth = async (
    _req: Request,
    res: Response
  ): Promise<Response> => {
    const startTime = Date.now();

    try {
      const dbHealth = await this.databaseClient.getHealth();

      const responseTime = Date.now() - startTime;

      logger.debug("Database health check completed", {
        status: dbHealth.status,
        responseTime: dbHealth.responseTime,
      });

      // Ensure response is within 500ms requirement
      if (responseTime > 500) {
        logger.warn("Database health check exceeded 500ms threshold", {
          responseTime,
        });
      }

      const statusCode = dbHealth.status === "healthy" ? 200 : 503;

      return res.status(statusCode).json({
        status: dbHealth.status,
        responseTime: dbHealth.responseTime,
        connections: dbHealth.connections,
        ...(dbHealth.error && { error: dbHealth.error }),
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Database health check failed", {
        error: errorMessage,
        responseTime,
      });

      return res.status(503).json({
        status: "unhealthy",
        responseTime,
        error: errorMessage,
      });
    }
  };

  /**
   * Check Google Calendar integration health
   * GET /api/health/calendar
   * Returns calendar service status, authentication status, and response time
   */
  public checkCalendarHealth = async (
    _req: Request,
    res: Response
  ): Promise<Response> => {
    const startTime = Date.now();

    try {
      // Check if calendar integration is enabled
      if (!config.googleCalendar.enabled) {
        logger.debug("Calendar integration is disabled");
        return res.status(200).json({
          status: "disabled",
          message: "Google Calendar integration is not enabled",
          responseTime: Date.now() - startTime,
        });
      }

      // Check if calendar client is available
      if (!this.calendarClient) {
        logger.warn("Calendar client not initialized");
        return res.status(503).json({
          status: "unavailable",
          error: "Calendar client not initialized",
          responseTime: Date.now() - startTime,
        });
      }

      // Check authentication status
      const isAuthenticated = this.calendarClient.isAuthenticated();

      if (!isAuthenticated) {
        logger.warn("Calendar client not authenticated");
        return res.status(503).json({
          status: "unhealthy",
          error: "Calendar client not authenticated",
          responseTime: Date.now() - startTime,
        });
      }

      // Test basic connectivity by fetching events for a small time window
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await this.calendarClient.getEvents(now, tomorrow);

      const responseTime = Date.now() - startTime;

      // Get circuit breaker stats
      const circuitBreakerStats = this.calendarClient.getCircuitBreakerStats();

      logger.debug("Calendar health check completed", {
        status: "healthy",
        responseTime,
        circuitBreakerState: circuitBreakerStats.state,
      });

      return res.status(200).json({
        status: "healthy",
        authenticated: true,
        responseTime,
        calendarId: config.googleCalendar.calendarId,
        circuitBreaker: circuitBreakerStats,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Calendar health check failed", {
        error: errorMessage,
        responseTime,
      });

      return res.status(503).json({
        status: "unhealthy",
        authenticated: this.calendarClient?.isAuthenticated() || false,
        responseTime,
        error: errorMessage,
      });
    }
  };

  /**
   * Check HubSpot CRM integration health
   * GET /api/health/crm
   * Returns CRM service status, authentication status, and response time
   */
  public checkCRMHealth = async (
    _req: Request,
    res: Response
  ): Promise<Response> => {
    const startTime = Date.now();

    try {
      // Check if HubSpot integration is enabled
      if (!config.hubspot.enabled) {
        logger.debug("HubSpot integration is disabled");
        return res.status(200).json({
          status: "disabled",
          message: "HubSpot CRM integration is not enabled",
          responseTime: Date.now() - startTime,
        });
      }

      // Check if HubSpot client is available
      if (!this.hubspotClient) {
        logger.warn("HubSpot client not initialized");
        return res.status(503).json({
          status: "unavailable",
          error: "HubSpot client not initialized",
          responseTime: Date.now() - startTime,
        });
      }

      // Check authentication status
      const isAuthenticated = this.hubspotClient.isAuthenticated();

      if (!isAuthenticated) {
        logger.warn("HubSpot client not authenticated");
        return res.status(503).json({
          status: "unhealthy",
          error: "HubSpot client not authenticated",
          responseTime: Date.now() - startTime,
        });
      }

      // Test basic connectivity by searching for a non-existent contact
      // This verifies API access without creating any data
      const testEmail = `health-check-${Date.now()}@test.invalid`;
      await this.hubspotClient.searchContactByEmail(testEmail);

      const responseTime = Date.now() - startTime;

      // Get circuit breaker stats
      const circuitBreakerStats = this.hubspotClient.getCircuitBreakerStats();

      logger.debug("CRM health check completed", {
        status: "healthy",
        responseTime,
        circuitBreakerState: circuitBreakerStats.state,
      });

      return res.status(200).json({
        status: "healthy",
        authenticated: true,
        responseTime,
        circuitBreaker: circuitBreakerStats,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("CRM health check failed", {
        error: errorMessage,
        responseTime,
      });

      return res.status(503).json({
        status: "unhealthy",
        authenticated: this.hubspotClient?.isAuthenticated() || false,
        responseTime,
        error: errorMessage,
      });
    }
  };
}
