/**
 * Request logging middleware
 * Logs all incoming requests with correlation ID for request tracking
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { randomUUID } from "crypto";

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

/**
 * Generate a unique correlation ID for request tracking
 */
function generateRequestId(): string {
  return `req-${randomUUID()}`;
}

/**
 * Request logging middleware
 * Logs incoming requests and outgoing responses with timing information
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate and attach request ID
  req.requestId =
    (req.headers["x-request-id"] as string) || generateRequestId();
  req.startTime = Date.now();

  // Create child logger with request ID
  const requestLogger = logger.child({ requestId: req.requestId });

  // Log incoming request
  requestLogger.info("Incoming request", {
    context: {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    },
  });

  // Capture the original res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const duration = Date.now() - (req.startTime || Date.now());

    requestLogger.info("Outgoing response", {
      context: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
    });

    return originalJson(body);
  };

  // Log response on finish (for non-JSON responses)
  res.on("finish", () => {
    // Only log if json wasn't called (to avoid duplicate logs)
    if (
      !res.headersSent ||
      res.getHeader("content-type")?.toString().includes("json")
    ) {
      return;
    }

    const duration = Date.now() - (req.startTime || Date.now());

    requestLogger.info("Request completed", {
      context: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
    });
  });

  // Add request ID to response headers for client-side tracking
  res.setHeader("X-Request-ID", req.requestId);

  next();
}
