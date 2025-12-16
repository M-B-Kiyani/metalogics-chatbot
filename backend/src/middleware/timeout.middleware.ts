import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import { logger } from "../utils/logger";
import { config } from "../config";

/**
 * Request timeout middleware
 * Ensures that all requests complete within a specified time limit
 *
 * Configuration from environment variables:
 * - REQUEST_TIMEOUT_MS: Timeout in milliseconds (default: 30000 = 30 seconds)
 */
export const requestTimeout = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get timeout configuration from config module
  const timeoutMs = config.server.requestTimeout;

  // Set a timeout for the request
  const timeoutId = setTimeout(() => {
    // Check if the response has already been sent
    if (res.headersSent) {
      return;
    }

    logger.error("Request timeout", {
      method: req.method,
      path: req.path,
      timeout: timeoutMs,
      ip: req.ip,
    });

    // Create a timeout error
    const error = new AppError(
      504,
      `Request timeout after ${timeoutMs}ms`,
      "REQUEST_TIMEOUT",
      true
    );

    // Send the error response
    res.status(504).json({
      success: false,
      error: {
        statusCode: 504,
        message: error.message,
        errorCode: error.errorCode,
        timestamp: error.timestamp,
      },
    });
  }, timeoutMs);

  // Clear the timeout when the response finishes
  res.on("finish", () => {
    clearTimeout(timeoutId);
  });

  // Clear the timeout if the connection is closed
  res.on("close", () => {
    clearTimeout(timeoutId);
  });

  next();
};
