import {
  type AssembledContext,
  type ContextAssemblyInput,
  type ContextBlock,
  ContextAssemblyInputSchema,
  type RetrievedChunk
} from "./context.contracts.js";
import { DomainError } from "../../errors/base.error.js";
import { ErrorCode } from "../../errors/error-codes.js";

export function estimateTokenCount(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }
  return Math.ceil(text.length / 4);
}

function formatContextChunk(chunk: RetrievedChunk, index: number): string {
  return `[Source ${index + 1} | Reqd: ${chunk.similarity.toFixed(3)}]\n${chunk.content}`;
}

export function buildContext(rawInput: ContextAssemblyInput): AssembledContext {
  const parseResult = ContextAssemblyInputSchema.safeParse(rawInput);
  if (!parseResult.success) {
    throw new DomainError(
      "Invalid context assembly input",
      ErrorCode.VALIDATION_ERROR,
      { issues: parseResult.error.issues }
    );
  }

  const input = parseResult.data;
  const effectiveBudget = input.maxTokenBudget - input.reservedCompletionBudget;

  if (effectiveBudget <= 0) {
    throw new DomainError(
      "Effective context budget is non-positive",
      ErrorCode.CONTEXT_BUDGET_EXCEEDED,
      { maxTokenBudget: input.maxTokenBudget, reservedCompletionBudget: input.reservedCompletionBudget }
    );
  }

  const systemTokenEstimate = estimateTokenCount(input.systemDirective);
  const queryTokenEstimate = estimateTokenCount(input.userQuery);
  const baseTokens = systemTokenEstimate + queryTokenEstimate;

  if (baseTokens > effectiveBudget) {
    throw new DomainError(
      "Base system directive and query exceed the effective token budget",
      ErrorCode.CONTEXT_BUDGET_EXCEEDED,
      { baseTokens, effectiveBudget }
    );
  }

  let remainingBudget = effectiveBudget - baseTokens;
  const sortedChunks = [...input.retrievedChunks].sort((a, b) => b.similarity - a.similarity);

  const includedChunks: RetrievedChunk[] = [];
  const includedChunkIds: string[] = [];
  let droppedChunkCount = 0;

  for (let i = 0; i < sortedChunks.length; i++) {
    const chunk = sortedChunks[i]!;
    const formatted = formatContextChunk(chunk, includedChunks.length);
    const chunkTokens = estimateTokenCount(formatted);

    if (chunkTokens <= remainingBudget) {
      includedChunks.push(chunk);
      includedChunkIds.push(chunk.chunkId);
      remainingBudget -= chunkTokens;
    } else {
      droppedChunkCount++;
    }
  }

  const contextSection = includedChunks
    .map((chunk, idx) => formatContextChunk(chunk, idx))
    .join("\n\n---\n\n");

  const blocks: ContextBlock[] = [
    {
      role: "system",
      content: input.systemDirective,
      tokenEstimate: systemTokenEstimate
    }
  ];

  if (contextSection.length > 0) {
    blocks.push({
      role: "context",
      content: contextSection,
      tokenEstimate: estimateTokenCount(contextSection)
    });
  }

  blocks.push({
    role: "user",
    content: input.userQuery,
    tokenEstimate: queryTokenEstimate
  });

  const formattedPrompt = blocks
    .map((block) => `### ${block.role.toUpperCase()}\n${block.content}`)
    .join("\n\n");

  const totalTokenEstimate = effectiveBudget - remainingBudget;

  return {
    formattedPrompt,
    blocks,
    totalTokenEstimate,
    budgetRemaining: remainingBudget,
    includedChunkIds,
    droppedChunkCount
  };
}
