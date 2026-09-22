import { describe, it, expect } from "vitest";
import { buildContext, estimateTokenCount } from "../../src/brain/context.builder.js";
import { DomainError } from "../../src/backend/errors/base.error.js";
import { ErrorCode } from "../../src/backend/errors/error-codes.js";

describe("Context Builder", () => {
  const dummyChunk1 = {
    chunkId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    documentId: "b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    content: "FoundryOS combines Company Brain persistence with TrueForge runtime harness.",
    similarity: 0.95,
    metadata: { section: "architecture" }
  };

  const dummyChunk2 = {
    chunkId: "c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    documentId: "b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    content: "PostgreSQL pgvector provides HNSW indexing for rapid cosine similarity search.",
    similarity: 0.88,
    metadata: { section: "database" }
  };

  it("should calculate token estimates proportionally to character length", () => {
    expect(estimateTokenCount("")).toBe(0);
    expect(estimateTokenCount("1234")).toBe(1);
    expect(estimateTokenCount("12345")).toBe(2);
  });

  it("should assemble context deterministically and include chunks sorted by similarity", () => {
    const result = buildContext({
      systemDirective: "You are an AI assistant.",
      userQuery: "How does FoundryOS index vectors?",
      retrievedChunks: [dummyChunk2, dummyChunk1],
      maxTokenBudget: 2000,
      reservedCompletionBudget: 500
    });

    expect(result.includedChunkIds[0]).toBe(dummyChunk1.chunkId);
    expect(result.includedChunkIds[1]).toBe(dummyChunk2.chunkId);
    expect(result.droppedChunkCount).toBe(0);
    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0]?.role).toBe("system");
    expect(result.blocks[1]?.role).toBe("context");
    expect(result.blocks[2]?.role).toBe("user");
    expect(result.formattedPrompt).toContain("### SYSTEM");
    expect(result.formattedPrompt).toContain("### CONTEXT");
    expect(result.formattedPrompt).toContain("### USER");
  });

  it("should drop chunks when token budget is constrained", () => {
    const result = buildContext({
      systemDirective: "You are an assistant.",
      userQuery: "Vector query?",
      retrievedChunks: [dummyChunk1, dummyChunk2],
      maxTokenBudget: 60,
      reservedCompletionBudget: 20
    });

    expect(result.droppedChunkCount).toBeGreaterThanOrEqual(1);
    expect(result.includedChunkIds.length).toBeLessThan(2);
  });

  it("should throw DomainError when base tokens exceed budget", () => {
    expect(() =>
      buildContext({
        systemDirective: "Very long directive exceeding small budget.",
        userQuery: "Another query string.",
        retrievedChunks: [],
        maxTokenBudget: 15,
        reservedCompletionBudget: 5
      })
    ).toThrow(DomainError);
  });

  it("should throw DomainError when effective budget is zero or negative", () => {
    try {
      buildContext({
        systemDirective: "Directive",
        userQuery: "Query",
        retrievedChunks: [],
        maxTokenBudget: 500,
        reservedCompletionBudget: 500
      });
      expect.fail("Expected buildContext to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe(ErrorCode.CONTEXT_BUDGET_EXCEEDED);
    }
  });
});
