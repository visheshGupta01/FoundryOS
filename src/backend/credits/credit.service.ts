import {
  DAILY_CREDIT_LIMIT,
  TOKENS_PER_CREDIT,
  type CreditStatus,
  type CreditDeductionResult
} from "./credit.types.js";
import { RateLimitError } from "../errors/base.error.js";
import { logger } from "../shared/logger.js";

interface DailyRecord {
  date: string;
  tokensUsed: number;
  creditsUsed: number;
}

export class CreditService {
  private readonly dailyLimit: number;
  private readonly tokensPerCredit: number;
  private readonly store: Map<string, DailyRecord> = new Map();

  constructor(dailyLimit: number = DAILY_CREDIT_LIMIT, tokensPerCredit: number = TOKENS_PER_CREDIT) {
    this.dailyLimit = dailyLimit;
    this.tokensPerCredit = tokensPerCredit;
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getNextMidnightIso(): string {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow.toISOString();
  }

  private getRecord(tenantId: string): DailyRecord {
    const today = this.getTodayKey();
    const existing = this.store.get(tenantId);
    if (!existing || existing.date !== today) {
      const freshRecord: DailyRecord = {
        date: today,
        tokensUsed: 0,
        creditsUsed: 0
      };
      this.store.set(tenantId, freshRecord);
      return freshRecord;
    }
    return existing;
  }

  public getCreditStatus(tenantId: string): CreditStatus {
    const record = this.getRecord(tenantId);
    const creditsRemaining = Math.max(0, this.dailyLimit - record.creditsUsed);
    const dailyTokensRemaining = creditsRemaining * this.tokensPerCredit;
    const isExhausted = creditsRemaining <= 0;
    const resetTime = this.getNextMidnightIso();

    return {
      tenantId,
      dailyLimit: this.dailyLimit,
      maxDailyCredits: this.dailyLimit,
      creditsRemaining,
      remainingCredits: creditsRemaining,
      creditsUsed: record.creditsUsed,
      tokensUsedToday: record.tokensUsed,
      tokensPerCredit: this.tokensPerCredit,
      dailyTokensRemaining,
      isExhausted,
      resetAt: resetTime,
      resetsAt: resetTime,
      allowed: creditsRemaining > 0
    };
  }

  public hasSufficientCredits(tenantId: string, estimatedTokens = 1): boolean {
    const status = this.getCreditStatus(tenantId);
    const requiredCredits = Math.max(1, Math.ceil(estimatedTokens / this.tokensPerCredit));
    return status.creditsRemaining >= requiredCredits;
  }

  public consumeCredits(tenantId: string, tokensUsed: number): CreditDeductionResult {
    const safeTokens = Math.max(0, tokensUsed);
    const record = this.getRecord(tenantId);
    const creditsToDeduct = safeTokens === 0 ? 0 : Math.max(1, Math.ceil(safeTokens / this.tokensPerCredit));

    const currentRemaining = Math.max(0, this.dailyLimit - record.creditsUsed);
    if (creditsToDeduct > 0 && currentRemaining < creditsToDeduct && currentRemaining === 0) {
      logger.warn("Daily credit limit exceeded", { tenantId, dailyLimit: this.dailyLimit });
      throw new RateLimitError("Daily credit allowance exceeded", {
        tenantId,
        dailyLimit: this.dailyLimit,
        tokensPerCredit: this.tokensPerCredit,
        resetAt: this.getNextMidnightIso()
      });
    }

    record.tokensUsed += safeTokens;
    record.creditsUsed = Math.min(this.dailyLimit, record.creditsUsed + creditsToDeduct);

    const updatedStatus = this.getCreditStatus(tenantId);

    return {
      tenantId,
      creditsDeducted: creditsToDeduct,
      tokensConsumed: safeTokens,
      creditsRemaining: updatedStatus.creditsRemaining,
      remainingCredits: updatedStatus.creditsRemaining,
      status: updatedStatus
    };
  }

  public resetCredits(tenantId: string): CreditStatus {
    this.store.set(tenantId, {
      date: this.getTodayKey(),
      tokensUsed: 0,
      creditsUsed: 0
    });
    return this.getCreditStatus(tenantId);
  }
}

export const creditService = new CreditService();
