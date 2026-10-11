import { z } from "zod";

export const DAILY_CREDIT_LIMIT = 100;
export const TOKENS_PER_CREDIT = 800;

export const CreditStatusSchema = z.object({
  tenantId: z.string().min(1),
  dailyLimit: z.number().int().nonnegative(),
  maxDailyCredits: z.number().int().nonnegative().optional(),
  creditsRemaining: z.number().int().nonnegative(),
  remainingCredits: z.number().int().nonnegative().optional(),
  creditsUsed: z.number().int().nonnegative(),
  tokensUsedToday: z.number().int().nonnegative(),
  tokensPerCredit: z.number().int().nonnegative().optional(),
  dailyTokensRemaining: z.number().int().nonnegative().optional(),
  isExhausted: z.boolean().optional(),
  resetAt: z.string().min(1),
  resetsAt: z.string().min(1).optional(),
  allowed: z.boolean()
});

export type CreditStatus = z.infer<typeof CreditStatusSchema>;

export interface CreditDeductionResult {
  tenantId: string;
  creditsDeducted: number;
  tokensConsumed: number;
  creditsRemaining: number;
  remainingCredits?: number;
  status: CreditStatus;
}
