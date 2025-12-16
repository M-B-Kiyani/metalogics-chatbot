import { logger } from "./logger";

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Failing, reject requests immediately
  HALF_OPEN = "HALF_OPEN", // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Time in ms before attempting to close circuit
  monitoringPeriod: number; // Time window for counting failures
  name?: string; // Optional name for logging
}

/**
 * Circuit breaker implementation for external API calls
 * Prevents cascading failures by failing fast when a service is unavailable
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttemptTime: number = 0;
  private successCount: number = 0;
  private readonly config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      ...config,
      name: config.name || "CircuitBreaker",
    };

    logger.info(`Circuit breaker initialized: ${this.config.name}`, {
      failureThreshold: this.config.failureThreshold,
      resetTimeout: this.config.resetTimeout,
      monitoringPeriod: this.config.monitoringPeriod,
    });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if enough time has passed to try again
      if (Date.now() >= this.nextAttemptTime) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        const error = new Error(
          `Circuit breaker is OPEN for ${this.config.name}`
        );
        logger.warn(`Circuit breaker rejected request: ${this.config.name}`, {
          state: this.state,
          nextAttemptTime: new Date(this.nextAttemptTime).toISOString(),
        });
        throw error;
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      // After successful call in HALF_OPEN, transition back to CLOSED
      this.transitionTo(CircuitState.CLOSED);
      this.successCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    logger.warn(`Circuit breaker failure recorded: ${this.config.name}`, {
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold,
      state: this.state,
    });

    // If in HALF_OPEN and we get a failure, go back to OPEN
    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
      return;
    }

    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED) {
      // Check if failures are within monitoring period
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure <= this.config.monitoringPeriod) {
        if (this.failureCount >= this.config.failureThreshold) {
          this.transitionTo(CircuitState.OPEN);
        }
      } else {
        // Reset failure count if outside monitoring period
        this.failureCount = 1;
      }
    }
  }

  /**
   * Transition to a new circuit state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    logger.info(`Circuit breaker state transition: ${this.config.name}`, {
      from: oldState,
      to: newState,
      failureCount: this.failureCount,
      timestamp: new Date().toISOString(),
    });

    // Set next attempt time when opening circuit
    if (newState === CircuitState.OPEN) {
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
      logger.info(`Circuit breaker opened: ${this.config.name}`, {
        nextAttemptTime: new Date(this.nextAttemptTime).toISOString(),
        resetTimeout: this.config.resetTimeout,
      });
    }

    // Reset counters when closing circuit
    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      logger.info(`Circuit breaker closed: ${this.config.name}`);
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : null,
      nextAttemptTime: this.nextAttemptTime
        ? new Date(this.nextAttemptTime).toISOString()
        : null,
      config: {
        name: this.config.name,
        failureThreshold: this.config.failureThreshold,
        resetTimeout: this.config.resetTimeout,
        monitoringPeriod: this.config.monitoringPeriod,
      },
    };
  }

  /**
   * Manually reset the circuit breaker (for testing/admin purposes)
   */
  reset(): void {
    logger.info(`Circuit breaker manually reset: ${this.config.name}`);
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
}
