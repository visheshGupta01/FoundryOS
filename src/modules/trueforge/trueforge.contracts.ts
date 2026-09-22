import { z } from "zod";

export const AgentSessionCreateInputSchema = z.object({
  tenantId: z.string().min(1).max(64),
  agentName: z.string().min(1).max(128),
  metadata: z.record(z.unknown()).default({})
});

export type AgentSessionCreateInput = z.infer<typeof AgentSessionCreateInputSchema>;

export const AgentSessionResultSchema = z.object({
  sessionId: z.string().min(1),
  agentName: z.string().min(1),
  tenantId: z.string().min(1),
  status: z.string().min(1)
});

export type AgentSessionResult = z.infer<typeof AgentSessionResultSchema>;

export const AgentTurnExecutionInputSchema = z.object({
  sessionId: z.string().min(1),
  tenantId: z.string().min(1).max(64),
  prompt: z.string().min(1)
});

export type AgentTurnExecutionInput = z.infer<typeof AgentTurnExecutionInputSchema>;

export const AgentTurnExecutionResultSchema = z.object({
  turnId: z.string().min(1),
  sessionId: z.string().min(1),
  status: z.string().min(1),
  output: z.string().optional()
});

export type AgentTurnExecutionResult = z.infer<typeof AgentTurnExecutionResultSchema>;
