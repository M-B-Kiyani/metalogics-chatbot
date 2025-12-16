import { AppError } from "./AppError";

/**
 * Error thrown when request validation fails
 * Used for invalid input data, schema validation failures, etc.
 */
export class ValidationError extends AppError {
  public readonly details?: any;

  constructor(message: string, details?: any) {
    super(400, message, "VALIDATION_ERROR", true);
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
