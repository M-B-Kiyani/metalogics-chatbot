import { AppError } from "./AppError";

/**
 * Error thrown when database operations fail
 * Used for connection failures, query errors, etc.
 */
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(503, message, "DATABASE_ERROR", true);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}
