/**
 * Base error class for all application errors
 * Extends the native Error class with additional properties for API error handling
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    message: string,
    errorCode: string,
    isOperational: boolean = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly to maintain instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * ValidationError class for input validation errors
 * Used when request data fails validation
 */
export class ValidationError extends AppError {
  public readonly details?: any;

  constructor(message: string, details?: any) {
    super(400, message, "VALIDATION_ERROR", true);
    this.details = details;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * NotFoundError class for resource not found errors
 * Used when a requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, "NOT_FOUND", true);

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * ConflictError class for resource conflict errors
 * Used when an operation conflicts with existing data
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "CONFLICT", true);

    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * AuthenticationError class for authentication failures
 * Used when authentication is required or fails
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(401, message, "AUTHENTICATION_ERROR", true);

    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * DatabaseError class for database-related errors
 * Used when database operations fail
 */
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(503, message, "DATABASE_ERROR", true);

    // Preserve the original error stack if available
    if (originalError && originalError.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }

    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}
