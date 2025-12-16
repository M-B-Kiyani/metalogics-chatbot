/**
 * Verification script for logging infrastructure
 * Tests Winston logger configuration and request logging middleware
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

import { logger } from "../utils/logger";
import { Request, Response, NextFunction } from "express";
import { requestLogger } from "../middleware/requestLogger.middleware";

console.log("=== Testing Logging Infrastructure ===\n");

// Test 1: Basic logging at different levels
console.log("Test 1: Testing log levels...");
logger.debug("This is a debug message", { context: { test: "debug" } });
logger.info("This is an info message", { context: { test: "info" } });
logger.warn("This is a warning message", { context: { test: "warning" } });
logger.error("This is an error message", { context: { test: "error" } });

// Test 2: Logging with request ID
console.log("\nTest 2: Testing child logger with requestId...");
const childLogger = logger.child({ requestId: "test-req-123" });
childLogger.info("Request received", {
  context: {
    method: "GET",
    path: "/api/bookings",
    ip: "127.0.0.1",
  },
});

// Test 3: Structured logging with complex context
console.log("\nTest 3: Testing structured logging...");
logger.info("Booking created successfully", {
  requestId: "req-456",
  context: {
    bookingId: "booking-789",
    userId: "user@example.com",
    duration: 125,
    timeSlot: {
      startTime: new Date().toISOString(),
      duration: 30,
    },
  },
});

// Test 4: Error logging with stack trace
console.log("\nTest 4: Testing error logging with stack trace...");
try {
  throw new Error("Test error for logging");
} catch (error) {
  logger.error("An error occurred during processing", {
    requestId: "req-789",
    context: {
      operation: "createBooking",
      error: error instanceof Error ? error.message : String(error),
    },
  });
}

// Test 5: Mock request logger middleware
console.log("\nTest 5: Testing request logger middleware...");
const mockReq = {
  method: "POST",
  path: "/api/bookings",
  query: { page: "1", limit: "10" },
  headers: {},
  ip: "127.0.0.1",
  socket: { remoteAddress: "127.0.0.1" },
} as unknown as Request;

const mockRes = {
  setHeader: (name: string, value: string) => {
    console.log(`  Response header set: ${name} = ${value}`);
  },
  json: function (_body: any) {
    console.log(`  Response sent with status ${mockRes.statusCode}`);
    return mockRes;
  },
  on: (_event: string, _callback: Function) => {
    // Mock event listener
  },
  statusCode: 200,
  headersSent: false,
  getHeader: () => "application/json",
} as unknown as Response;

const mockNext = (() => {
  console.log("  Next middleware called");
}) as NextFunction;

requestLogger(mockReq, mockRes, mockNext);

console.log("\n=== Logging Infrastructure Tests Complete ===");
console.log("\nConfiguration:");
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(
  `  LOG_LEVEL: ${process.env.LOG_LEVEL || "debug (default for dev)"}`
);
console.log(
  `  LOG_FILE_PATH: ${
    process.env.LOG_FILE_PATH || "not configured (console only)"
  }`
);

if (process.env.LOG_FILE_PATH) {
  console.log("\n✓ File-based logging is enabled!");
  console.log(
    `  Log files will be created in: ${path.dirname(process.env.LOG_FILE_PATH)}`
  );
  console.log(
    `  - app-YYYY-MM-DD.log (all logs, rotated daily, kept for 14 days)`
  );
  console.log(
    `  - error-YYYY-MM-DD.log (errors only, rotated daily, kept for 30 days)`
  );
  console.log(`  - Max file size: 20MB per file`);
} else {
  console.log(
    "\nNote: File-based logging is disabled. Set LOG_FILE_PATH to enable."
  );
}
