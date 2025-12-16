import { AppError } from "./AppError";

/**
 * Error thrown when a user exceeds the maximum number of bookings allowed within a time window
 * Used to enforce booking frequency limits and prevent abuse
 */
export class FrequencyLimitError extends AppError {
  constructor(
    maxBookings: number,
    windowDays?: number,
    windowMinutes?: number,
    duration?: number
  ) {
    let message: string;

    if (windowMinutes !== undefined && duration !== undefined) {
      // Duration-specific frequency limit
      const hours = Math.floor(windowMinutes / 60);
      const mins = windowMinutes % 60;
      const timeWindow =
        hours > 0
          ? mins > 0
            ? `${hours}-hour ${mins}-minute`
            : `${hours}-hour`
          : `${mins}-minute`;

      message = `Maximum ${maxBookings} bookings of ${duration}-minute duration within any rolling ${timeWindow} window exceeded`;
    } else if (windowDays !== undefined) {
      // Email-based frequency limit
      message = `Maximum ${maxBookings} bookings per ${windowDays} days exceeded`;
    } else {
      message = `Booking frequency limit exceeded`;
    }

    super(429, message, "FREQUENCY_LIMIT_EXCEEDED", true);

    Object.setPrototypeOf(this, FrequencyLimitError.prototype);
  }
}
