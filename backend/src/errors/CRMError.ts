import { AppError } from "./AppError";

/**
 * Error thrown when HubSpot CRM API operations fail
 * Used for contact creation, updates, searches, and other CRM integration failures
 */
export class CRMError extends AppError {
  public readonly originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(503, message, "CRM_ERROR", true);
    this.originalError = originalError;

    // Preserve the original error stack if available
    if (originalError && originalError.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }

    Object.setPrototypeOf(this, CRMError.prototype);
  }
}

/**
 * Error thrown when HubSpot CRM authentication fails
 * Used when private app access token authentication or authorization fails
 */
export class CRMAuthError extends AppError {
  constructor(message: string = "HubSpot CRM authentication failed") {
    super(401, message, "CRM_AUTH_ERROR", true);

    Object.setPrototypeOf(this, CRMAuthError.prototype);
  }
}
