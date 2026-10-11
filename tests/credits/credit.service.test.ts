import { describe, it, expect, beforeEach } from "vitest";
import { CreditService } from "../../src/backend/credits/credit.service.js";
import { RateLimitError } from "../../src/backend/errors/base.error.js";

describe("CreditService", () => {
  let service: CreditService;
  const tenantId = "test-tenant-1";

  beforeEach(() => {
    service = new CreditService(100, 800);
  });

  it("should initialize with 100 credits and 0 tokens used", () => {
    const status = service.getCreditStatus(tenantId);
    expect(status.dailyLimit).toBe(100);
    expect(status.creditsRemaining).toBe(100);
    expect(status.creditsUsed).toBe(0);
    expect(status.tokensUsedToday).toBe(0);
    expect(status.allowed).toBe(true);
  });

  it("should deduct 1 credit for usage under 800 tokens", () => {
    const res = service.consumeCredits(tenantId, 450);
    expect(res.creditsDeducted).toBe(1);
    expect(res.tokensConsumed).toBe(450);
    expect(res.creditsRemaining).toBe(99);
    expect(res.status.tokensUsedToday).toBe(450);
  });

  it("should deduct multiple credits when tokens exceed multiples of 800", () => {
    const res = service.consumeCredits(tenantId, 1605);
    expect(res.creditsDeducted).toBe(3);
    expect(res.creditsRemaining).toBe(97);
  });

  it("should prevent execution when credits are exhausted", () => {
    service.consumeCredits(tenantId, 800 * 100);
    const status = service.getCreditStatus(tenantId);
    expect(status.creditsRemaining).toBe(0);
    expect(status.allowed).toBe(false);
    expect(service.hasSufficientCredits(tenantId)).toBe(false);

    expect(() => {
      service.consumeCredits(tenantId, 50);
    }).toThrowError(RateLimitError);
  });

  it("should reset credits cleanly", () => {
    service.consumeCredits(tenantId, 800 * 50);
    expect(service.getCreditStatus(tenantId).creditsRemaining).toBe(50);

    const reset = service.resetCredits(tenantId);
    expect(reset.creditsRemaining).toBe(100);
    expect(reset.creditsUsed).toBe(0);
    expect(reset.tokensUsedToday).toBe(0);
  });
});
