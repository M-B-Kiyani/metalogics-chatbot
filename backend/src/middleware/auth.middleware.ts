import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import { logger } from "../utils/logger";
import { config } from "../config";

/**
 * Authentication middleware that validates API key from Authorization header
 * Protects write operations (POST, PUT, PATCH, DELETE) from unauthorized access
 *
 * Expected header format: Authorization: Bearer <API_KEY>
 */
export const validateApiKey = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    // Check if Authorization header is present
    if (!authHeader) {
      logger.warn("Missing Authorization header", {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });

      throw new AppError(
        401,
        "Missing Authorization header",
        "MISSING_AUTH_HEADER",
        true
      );
    }

    // Extract the API key from the Bearer token format
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      logger.warn("Invalid Authorization header format", {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });

      throw new AppError(
        401,
        "Invalid Authorization header format. Expected: Bearer <API_KEY>",
        "INVALID_AUTH_FORMAT",
        true
      );
    }

    const providedApiKey = parts[1];

    // Get the expected API key from configuration
    const expectedApiKey = config.auth.apiKey;

    // Validate the API key
    if (providedApiKey !== expectedApiKey) {
      logger.warn("Invalid API key provided", {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });

      throw new AppError(401, "Invalid API key", "INVALID_API_KEY", true);
    }

    // API key is valid, proceed to next middleware
    logger.debug("API key validated successfully", {
      method: req.method,
      path: req.path,
    });

    next();
  } catch (error) {
    next(error);
  }
};
