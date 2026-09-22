export interface RetryOptions {
  readonly maxAttempts?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly factor?: number;
  readonly isRetriable?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 5000,
  factor: 2,
  isRetriable: () => true
};

// Computes exponential backoff with full jitter: random uniform delay in [0, min(base * factor^(attempt-1), maxDelay)]
export function calculateBackoffWithJitter(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  factor: number
): number {
  const calculatedDelay = baseDelayMs * Math.pow(factor, attempt - 1);
  const cappedDelay = Math.min(calculatedDelay, maxDelayMs);
  return Math.floor(Math.random() * cappedDelay);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (attempt >= config.maxAttempts || !config.isRetriable(error)) {
        throw error;
      }

      const backoffMs = calculateBackoffWithJitter(
        attempt,
        config.baseDelayMs,
        config.maxDelayMs,
        config.factor
      );
      await delay(backoffMs);
    }
  }

  throw new Error("Unreachable retry loop termination");
}
