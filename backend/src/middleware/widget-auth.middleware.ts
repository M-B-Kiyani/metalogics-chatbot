import { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * Widget authentication middleware
 * Validates widget API key for public widget endpoints
 */
export const widgetAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get API key from headers
    const apiKey =
      req.headers["x-api-key"] ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (!apiKey) {
      logger.warn("Widget API request missing API key", {
        path: req.path,
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        error: {
          statusCode: 401,
          message: "API key is required",
          errorCode: "MISSING_API_KEY",
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Check if it's the widget API key or main API key
    const isValidWidgetKey =
      config.auth.widgetApiKey && apiKey === config.auth.widgetApiKey;
    const isValidMainKey = apiKey === config.auth.apiKey;

    if (!isValidWidgetKey && !isValidMainKey) {
      logger.warn("Invalid widget API key", {
        path: req.path,
        ip: req.ip,
        keyPrefix: apiKey.substring(0, 8) + "...",
      });

      res.status(401).json({
        success: false,
        error: {
          statusCode: 401,
          message: "Invalid API key",
          errorCode: "INVALID_API_KEY",
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    logger.debug("Widget API key validated", {
      path: req.path,
      keyType: isValidWidgetKey ? "widget" : "main",
    });

    next();
  } catch (error) {
    logger.error("Widget auth middleware error", {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
    });

    res.status(500).json({
      success: false,
      error: {
        statusCode: 500,
        message: "Internal server error",
        errorCode: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
      },
    });
  }
};
