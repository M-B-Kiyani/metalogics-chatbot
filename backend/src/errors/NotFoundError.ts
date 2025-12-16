import { AppError } from "./AppError";

/**
 * Error thrown when a requested resource is not found
 * Used for 404 scenarios (booking not found, etc.)
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, "NOT_FOUND", true);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
