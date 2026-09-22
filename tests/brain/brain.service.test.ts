import { describe, it, expect, vi } from "vitest";
import { BrainService } from "../../src/brain/brain.service.js";
import { BrainRepository } from "../../src/brain/brain.repository.js";
import { ValidationError, DomainError } from "../../src/backend/errors/base.error.js";
import { ErrorCode } from "../../src/backend/errors/error-codes.js";

describe("BrainService", () => {
  const mockUpsertDocument = vi.fn();
  const mockInsertChunks = vi.fn();
  const mockSearchSimilarChunks = vi.fn();

  const mockRepo = {
    upsertDocument: mockUpsertDocument,
    insertChunks: mockInsertChunks,
    searchSimilarChunks: mockSearchSimilarChunks
  } as unknown as BrainRepository;

  it("should compute deterministic SHA-256 hashes", () => {
    const service = new BrainService(mockRepo);
    const hash1 = service.computeHash("Enterprise Knowledge Base");
    const hash2 = service.computeHash("Enterprise Knowledge Base");
    const hash3 = service.computeHash("Different Knowledge Base");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });

  it("should split long text into overlapping chunks", () => {
    const service = new BrainService(mockRepo);
    const text = "A".repeat(1200);
    const chunks = service.splitIntoChunks(text, { maxChunkSize: 500, chunkOverlap: 50 });

    expect(chunks.length).toBe(3);
    expect(chunks[0]?.length).toBe(500);
  });

  it("should return single chunk if text is smaller than maxChunkSize", () => {
    const service = new BrainService(mockRepo);
    const text = "Short documentation excerpt.";
    const chunks = service.splitIntoChunks(text, { maxChunkSize: 500 });

    expect(chunks).toEqual([text]);
  });

  it("should ingest document and chunks through repository", async () => {
    const mockDoc = {
      id: "d1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      tenantId: "tenant-org",
      title: "Architecture Guide",
      sourceUri: "https://example.com/guide",
      contentHash: "hash-xyz",
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockUpsertDocument.mockResolvedValueOnce(mockDoc);
    mockInsertChunks.mockResolvedValueOnce(undefined);

    const service = new BrainService(mockRepo);
    const fakeEmbeddingGenerator = vi.fn().mockResolvedValue([0.1, 0.2, 0.3]);

    const result = await service.ingestDocument(
      {
        tenantId: "tenant-org",
        title: "Architecture Guide",
        content: "FoundryOS combines Company Brain persistence with TrueForge runtime.",
        sourceUri: "https://example.com/guide"
      },
      fakeEmbeddingGenerator
    );

    expect(result.document.id).toBe(mockDoc.id);
    expect(result.chunkCount).toBe(1);
    expect(mockUpsertDocument).toHaveBeenCalledTimes(1);
    expect(mockInsertChunks).toHaveBeenCalledTimes(1);
  });

  it("should throw ValidationError if document ingestion input is invalid", async () => {
    const service = new BrainService(mockRepo);
    const fakeEmbeddingGenerator = vi.fn().mockResolvedValue([0.1, 0.2]);

    await expect(
      service.ingestDocument(
        {
          tenantId: "",
          title: "Missing tenant",
          content: "Content"
        },
        fakeEmbeddingGenerator
      )
    ).rejects.toThrow(ValidationError);
  });

  it("should throw DomainError when embedding generator returns empty array", async () => {
    mockUpsertDocument.mockResolvedValueOnce({
      id: "d1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      tenantId: "tenant-org",
      title: "Title",
      contentHash: "hash-xyz",
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const service = new BrainService(mockRepo);
    const emptyEmbeddingGenerator = vi.fn().mockResolvedValue([]);

    try {
      await service.ingestDocument(
        {
          tenantId: "tenant-org",
          title: "Title",
          content: "Valid content"
        },
        emptyEmbeddingGenerator
      );
      expect.fail("Expected ingestDocument to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe(ErrorCode.VECTOR_DIMENSION_MISMATCH);
    }
  });

  it("should perform vector similarity search via repository", async () => {
    const mockResults = [
      {
        chunkId: "c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        documentId: "d1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        tenantId: "tenant-org",
        content: "Matched content",
        similarity: 0.92,
        chunkIndex: 0,
        metadata: {}
      }
    ];

    mockSearchSimilarChunks.mockResolvedValueOnce(mockResults);

    const service = new BrainService(mockRepo);
    const results = await service.search({
      tenantId: "tenant-org",
      embedding: [0.1, 0.2, 0.3],
      limit: 5,
      minSimilarity: 0.8
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.similarity).toBe(0.92);
  });
});
