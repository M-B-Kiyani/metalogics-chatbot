import { logger } from "../utils/logger";
import { AppError } from "../errors/AppError";

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 8000, // 8 seconds
  backoffMultiplier: 2, // Exponential backoff
};

/**
 * Error codes and types that are considered retryable
 */
const RETRYABLE_ERROR_CODES = [
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "ECONNRESET",
  "EPIPE",
  "DATABASE_ERROR",
];

/**
 * RetryService provides retry mechanism with exponential backoff
 * for operations that may fail due to transient errors
 */
export class RetryService {
  private options: RetryOptions;

  constructor(options?: Partial<RetryOptions>) {
    this.options = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options,
    };
  }

  /**
   * Determines if an error is retryable based on error code or type
   */
  private isRetryableError(error: any): boolean {
    // Check if error has a code property (common for network errors)
    if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) {
      return true;
    }

    // Check if error is an AppError with DATABASE_ERROR code
    if (error instanceof AppError && error.errorCode === "DATABASE_ERROR") {
      return true;
    }

    // Check if error message contains retryable indicators
    const errorMessage = error.message?.toLowerCase() || "";
    const retryableKeywords = [
      "timeout",
      "connection",
      "network",
      "econnrefused",
    ];
    return retryableKeywords.some((keyword) => errorMessage.includes(keyword));
  }

  /**
   * Calculates the delay for the next retry attempt using exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const delay =
      this.options.initialDelay *
      Math.pow(this.options.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.options.maxDelay);
  }

  /**
   * Sleeps for the specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Executes an operation with retry logic and exponential backoff
   *
   * @param operation - The async operation to execute
   * @param options - Optional retry configuration to override defaults
   * @returns Promise resolving to the operation result
   * @throws The last error if all retry attempts fail
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    const retryOptions = {
      ...this.options,
      ...options,
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
      try {
        logger.debug(
          `Executing operation (attempt ${attempt}/${retryOptions.maxAttempts})`
        );
        const result = await operation();

        if (attempt > 1) {
          logger.info(`Operation succeeded after ${attempt} attempts`);
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === retryOptions.maxAttempts;

        if (!isRetryable) {
          logger.warn("Non-retryable error encountered", {
            error: lastError.message,
            attempt,
          });
          throw error;
        }

        if (isLastAttempt) {
          logger.error("All retry attempts exhausted", {
            error: lastError.message,
            attempts: retryOptions.maxAttempts,
          });
          throw error;
        }

        // Calculate delay and log retry attempt
        const delay = this.calculateDelay(attempt);
        logger.warn("Retryable error encountered, retrying...", {
          error: lastError.message,
          attempt,
          maxAttempts: retryOptions.maxAttempts,
          delayMs: delay,
        });

        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError!;
  }
}

// Export a default instance for convenience
export const retryService = new RetryService();
