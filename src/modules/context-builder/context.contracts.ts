import { z } from "zod";

export const RetrievedChunkSchema = z.object({
  chunkId: z.string().uuid(),
  documentId: z.string().uuid(),
  content: z.string().min(1),
  similarity: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).default({})
});

export type RetrievedChunk = z.infer<typeof RetrievedChunkSchema>;

export const ContextAssemblyInputSchema = z.object({
  systemDirective: z.string().min(1),
  userQuery: z.string().min(1),
  retrievedChunks: z.array(RetrievedChunkSchema),
  maxTokenBudget: z.number().int().positive().default(4096),
  reservedCompletionBudget: z.number().int().nonnegative().default(1024)
});

export type ContextAssemblyInput = z.infer<typeof ContextAssemblyInputSchema>;

export const ContextBlockRoleSchema = z.enum(["system", "context", "user"]);
export type ContextBlockRole = z.infer<typeof ContextBlockRoleSchema>;

export const ContextBlockSchema = z.object({
  role: ContextBlockRoleSchema,
  content: z.string(),
  tokenEstimate: z.number().int().nonnegative()
});

export type ContextBlock = z.infer<typeof ContextBlockSchema>;

export const AssembledContextSchema = z.object({
  formattedPrompt: z.string(),
  blocks: z.array(ContextBlockSchema),
  totalTokenEstimate: z.number().int().nonnegative(),
  budgetRemaining: z.number().int().nonnegative(),
  includedChunkIds: z.array(z.string().uuid()),
  droppedChunkCount: z.number().int().nonnegative()
});

export type AssembledContext = z.infer<typeof AssembledContextSchema>;
