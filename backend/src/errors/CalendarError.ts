import { AppError } from "./AppError";

/**
 * Error thrown when Google Calendar API operations fail
 * Used for calendar event creation, updates, deletions, and query failures
 */
export class CalendarError extends AppError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(503, message, "CALENDAR_ERROR", true);
    this.originalError = originalError;

    // Preserve the original error stack if available
    if (originalError && originalError.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }

    Object.setPrototypeOf(this, CalendarError.prototype);
  }
}

/**
 * Error thrown when Google Calendar authentication fails
 * Used when service account authentication or authorization fails
 */
export class CalendarAuthError extends AppError {
  constructor(message: string = "Google Calendar authentication failed") {
    super(401, message, "CALENDAR_AUTH_ERROR", true);

    Object.setPrototypeOf(this, CalendarAuthError.prototype);
  }
}
