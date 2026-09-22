import { describe, it, expect, vi } from "vitest";
import { withRetry, calculateBackoffWithJitter } from "../../src/backend/shared/retry.js";

describe("Resilient Retry Mechanism", () => {
  it("should calculate backoff with jitter within bounded range", () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      const delay = calculateBackoffWithJitter(attempt, 100, 1000, 2);
      const maxPossible = Math.min(100 * Math.pow(2, attempt - 1), 1000);
      expect(delay).toBeGreaterThanOrEqual(0);
      expect(delay).toBeLessThanOrEqual(maxPossible);
    }
  });

  it("should return operation result immediately on first success", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry until successful within maxAttempts", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Transient 1"))
      .mockRejectedValueOnce(new Error("Transient 2"))
      .mockResolvedValue("recovered");

    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 5, maxDelayMs: 20 });
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should throw after exceeding maxAttempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Permanent error"));
    await expect(withRetry(fn, { maxAttempts: 2, baseDelayMs: 5, maxDelayMs: 10 })).rejects.toThrow(
      "Permanent error"
    );
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should not retry if isRetriable returns false", async () => {
    const customError = new Error("Fatal unretriable");
    const fn = vi.fn().mockRejectedValue(customError);

    await expect(
      withRetry(fn, {
        maxAttempts: 5,
        baseDelayMs: 5,
        isRetriable: () => false
      })
    ).rejects.toThrow("Fatal unretriable");

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
