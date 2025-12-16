import { AppError } from "./AppError";

/**
 * Error thrown when authentication fails
 * Used for invalid API keys, missing authorization, etc.
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(401, message, "AUTHENTICATION_ERROR", true);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
