import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import { logger } from "../utils/logger";
import { config } from "../config";

/**
 * Interface for tracking request counts per IP address
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limiting
 * Maps IP addresses to their request counts and reset times
 */
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();

  /**
   * Increment the request count for an IP address
   * Returns the current count and whether the limit is exceeded
   */
  public increment(
    ip: string,
    windowMs: number,
    maxRequests: number
  ): {
    count: number;
    exceeded: boolean;
    resetTime: number;
  } {
    const now = Date.now();
    const entry = this.store.get(ip);

    // If no entry exists or the window has expired, create a new entry
    if (!entry || now >= entry.resetTime) {
      const resetTime = now + windowMs;
      this.store.set(ip, { count: 1, resetTime });
      return { count: 1, exceeded: false, resetTime };
    }

    // Increment the count
    entry.count++;
    this.store.set(ip, entry);

    const exceeded = entry.count > maxRequests;
    return { count: entry.count, exceeded, resetTime: entry.resetTime };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   * Should be called periodically
   */
  public cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [ip, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        expiredKeys.push(ip);
      }
    }

    for (const key of expiredKeys) {
      this.store.delete(key);
    }

    if (expiredKeys.length > 0) {
      logger.debug("Rate limit store cleanup", {
        expiredEntries: expiredKeys.length,
        remainingEntries: this.store.size,
      });
    }
  }

  /**
   * Get the current size of the store
   */
  public size(): number {
    return this.store.size;
  }
}

// Create a singleton instance of the rate limit store
const rateLimitStore = new RateLimitStore();

// Run cleanup every minute to prevent memory leaks
setInterval(() => {
  rateLimitStore.cleanup();
}, 60000);

/**
 * Rate limiting middleware
 * Limits requests to a specified number per time window per IP address
 *
 * Configuration from environment variables:
 * - RATE_LIMIT_WINDOW_MS: Time window in milliseconds (default: 60000 = 1 minute)
 * - RATE_LIMIT_MAX_REQUESTS: Maximum requests per window (default: 100)
 */
export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get configuration from config module
    const windowMs = config.rateLimit.windowMs;
    const maxRequests = config.rateLimit.maxRequests;

    // Get the client IP address
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    // Increment the request count for this IP
    const { count, exceeded, resetTime } = rateLimitStore.increment(
      ip,
      windowMs,
      maxRequests
    );

    // Add rate limit headers to the response
    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - count).toString()
    );
    res.setHeader("X-RateLimit-Reset", new Date(resetTime).toISOString());

    // If the limit is exceeded, return 429 Too Many Requests
    if (exceeded) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());

      logger.warn("Rate limit exceeded", {
        ip,
        count,
        maxRequests,
        path: req.path,
        method: req.method,
      });

      throw new AppError(
        429,
        `Too many requests. Please try again in ${retryAfter} seconds.`,
        "RATE_LIMIT_EXCEEDED",
        true
      );
    }

    // Log rate limit info for monitoring
    if (count > maxRequests * 0.8) {
      logger.info("Rate limit warning", {
        ip,
        count,
        maxRequests,
        remaining: maxRequests - count,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Export the store for testing purposes
 */
export { rateLimitStore };
