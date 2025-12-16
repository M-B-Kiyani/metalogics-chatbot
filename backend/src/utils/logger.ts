/**
 * Winston-based logger with structured logging and log rotation
 * Supports multiple transports (console, file) with environment-based configuration
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Get log level from environment (default to 'info' for production, 'debug' for development)
const getLogLevel = (): string => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL.toLowerCase();
  }
  return process.env.NODE_ENV === "development" ? "debug" : "info";
};

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development (pretty print)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(
    ({ timestamp, level, message, requestId, context, stack }) => {
      let log = `${timestamp} [${level}]`;

      if (requestId) {
        log += ` [${requestId}]`;
      }

      log += `: ${message}`;

      if (context) {
        log += ` ${JSON.stringify(context)}`;
      }

      if (stack) {
        log += `\n${stack}`;
      }

      return log;
    }
  )
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format:
      process.env.NODE_ENV === "development" ? consoleFormat : structuredFormat,
  })
);

// File transports for production
if (process.env.NODE_ENV === "production" || process.env.LOG_FILE_PATH) {
  const logDir = process.env.LOG_FILE_PATH
    ? path.dirname(process.env.LOG_FILE_PATH)
    : path.join(process.cwd(), "logs");

  // Rotating file transport for all logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, "app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: structuredFormat,
      level: getLogLevel(),
    })
  );

  // Separate rotating file transport for errors only
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      format: structuredFormat,
      level: "error",
    })
  );
}

// Create Winston logger instance
const winstonLogger = winston.createLogger({
  levels: logLevels,
  level: getLogLevel(),
  transports,
  exitOnError: false,
});

// Logger interface for type safety
interface LogContext {
  [key: string]: any;
}

interface LogMetadata {
  requestId?: string;
  context?: LogContext;
  [key: string]: any;
}

/**
 * Logger class that wraps Winston with a clean API
 */
class Logger {
  /**
   * Log an error message
   */
  error(message: string, metadata?: LogMetadata): void {
    winstonLogger.error(message, metadata);
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    winstonLogger.warn(message, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: LogMetadata): void {
    winstonLogger.info(message, metadata);
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: LogMetadata): void {
    winstonLogger.debug(message, metadata);
  }

  /**
   * Create a child logger with default metadata (e.g., requestId)
   */
  child(defaultMetadata: LogMetadata): Logger {
    const childLogger = new Logger();
    const originalMethods = {
      error: childLogger.error.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      debug: childLogger.debug.bind(childLogger),
    };

    // Override methods to include default metadata
    childLogger.error = (message: string, metadata?: LogMetadata) => {
      originalMethods.error(message, { ...defaultMetadata, ...metadata });
    };

    childLogger.warn = (message: string, metadata?: LogMetadata) => {
      originalMethods.warn(message, { ...defaultMetadata, ...metadata });
    };

    childLogger.info = (message: string, metadata?: LogMetadata) => {
      originalMethods.info(message, { ...defaultMetadata, ...metadata });
    };

    childLogger.debug = (message: string, metadata?: LogMetadata) => {
      originalMethods.debug(message, { ...defaultMetadata, ...metadata });
    };

    return childLogger;
  }

  /**
   * Get the underlying Winston logger instance
   */
  getWinstonLogger(): winston.Logger {
    return winstonLogger;
  }
}

export const logger = new Logger();
export type { LogMetadata, LogContext };
