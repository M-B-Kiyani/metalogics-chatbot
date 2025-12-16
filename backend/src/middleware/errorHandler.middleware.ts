import { Request, Response, NextFunction } from "express";
import {
  AppError,
  CalendarError,
  CalendarAuthError,
  CRMError,
  CRMAuthError,
  FrequencyLimitError,
} from "../errors";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * Error response interface
 * Defines the structure of error responses sent to clients
 */
export interface ErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string;
    errorCode: string;
    timestamp: string;
    details?: any;
  };
}

/**
 * Centralized error handler middleware
 * Catches all errors thrown in the application and formats them consistently
 * Should be registered as the last middleware in the Express app
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred";
  let timestamp = new Date().toISOString();
  let details: any = undefined;

  // If it's an operational AppError, use its properties
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    timestamp = err.timestamp;

    // Include details if available (e.g., validation errors)
    if ("details" in err && err.details) {
      details = err.details;
    }

    // Log integration errors with additional context
    if (err instanceof CalendarError || err instanceof CalendarAuthError) {
      logger.error("Google Calendar integration error", {
        errorCode: err.errorCode,
        message: err.message,
        originalError:
          "originalError" in err ? err.originalError?.message : undefined,
      });
    } else if (err instanceof CRMError || err instanceof CRMAuthError) {
      logger.error("HubSpot CRM integration error", {
        errorCode: err.errorCode,
        message: err.message,
        originalError:
          "originalError" in err ? err.originalError?.message : undefined,
      });
    } else if (err instanceof FrequencyLimitError) {
      logger.warn("Booking frequency limit exceeded", {
        errorCode: err.errorCode,
        message: err.message,
      });
    }
  } else {
    // For non-operational errors, log the full error for debugging
    logger.error("Non-operational error", {
      error: err.message,
      stack: err.stack,
    });

    // In production, don't expose internal error details
    if (config.server.nodeEnv === "production") {
      message = "An unexpected error occurred";
    } else {
      // In development, include the error message for debugging
      message = err.message || message;
    }
  }

  // Construct the error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      statusCode,
      message,
      errorCode,
      timestamp,
      ...(details && { details }),
    },
  };

  // Send the error response
  res.status(statusCode).json(errorResponse);
};
