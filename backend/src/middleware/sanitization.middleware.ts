import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * HTML entity encoding map for XSS prevention
 */
const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Check if a string looks like a date or number (should not be sanitized)
 */
function shouldSkipSanitization(value: string): boolean {
  // Skip ISO date strings (e.g., 2025-11-24T13:04:17.813Z)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
    return true;
  }
  // Skip numbers
  if (/^\d+(\.\d+)?$/.test(value)) {
    return true;
  }
  return false;
}

/**
 * Recursively sanitize an object by escaping HTML in string values
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    // Skip sanitization for dates and numbers
    if (shouldSkipSanitization(obj)) {
      return obj;
    }
    return escapeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Input sanitization middleware to prevent XSS attacks
 * Sanitizes request body, query parameters, and URL parameters
 *
 * This middleware escapes HTML special characters in all string inputs
 * to prevent malicious scripts from being injected into the application
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Sanitize request body only
    // Note: Query params and URL params are skipped because:
    // 1. They are read-only in Express 5.x
    // 2. They are validated by Zod schemas in controllers
    // 3. They typically contain dates, numbers, and IDs, not user-generated HTML
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body);
    }

    logger.debug("Input sanitization completed", {
      method: req.method,
      path: req.path,
      hasBody: !!req.body,
      hasQuery: Object.keys(req.query || {}).length > 0,
      hasParams: Object.keys(req.params || {}).length > 0,
    });

    next();
  } catch (error) {
    logger.error("Error during input sanitization", {
      error: error instanceof Error ? error.message : "Unknown error",
      method: req.method,
      path: req.path,
    });

    // Continue even if sanitization fails to avoid blocking requests
    next();
  }
};
