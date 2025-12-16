import { AppError } from "./AppError";

/**
 * Error thrown when a request conflicts with existing data
 * Used for time slot conflicts, duplicate bookings, etc.
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "CONFLICT", true);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
