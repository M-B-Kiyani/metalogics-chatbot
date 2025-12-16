/**
 * Error classes for the application
 * Provides a consistent error handling structure across the API
 */

export { AppError } from "./AppError";
export { ValidationError } from "./ValidationError";
export { NotFoundError } from "./NotFoundError";
export { ConflictError } from "./ConflictError";
export { DatabaseError } from "./DatabaseError";
export { AuthenticationError } from "./AuthenticationError";
export { CalendarError, CalendarAuthError } from "./CalendarError";
export { CRMError, CRMAuthError } from "./CRMError";
export { FrequencyLimitError } from "./FrequencyLimitError";
