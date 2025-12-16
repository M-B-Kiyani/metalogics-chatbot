/**
 * Utility function to add timeout to promises
 */

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Wraps a promise with a timeout
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message if timeout occurs
 * @returns Promise that rejects if timeout occurs
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new TimeoutError(`${errorMessage} (${timeoutMs}ms)`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}
