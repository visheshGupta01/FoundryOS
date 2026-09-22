import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueueManager } from "../../src/backend/queue/queue.manager.js";
import { ValidationError, InfrastructureError } from "../../src/backend/errors/base.error.js";
import { ErrorCode } from "../../src/backend/errors/error-codes.js";

const { mockAdd, mockQueueClose, mockRedisQuit } = vi.hoisted(() => {
  return {
    mockAdd: vi.fn(),
    mockQueueClose: vi.fn(),
    mockRedisQuit: vi.fn()
  };
});

vi.mock("bullmq", () => {
  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: mockAdd,
      close: mockQueueClose
    })),
    Worker: vi.fn().mockImplementation((_name, processor, _opts) => ({
      processor,
      on: vi.fn()
    }))
  };
});

vi.mock("ioredis", () => {
  return {
    Redis: vi.fn().mockImplementation(() => ({
      quit: mockRedisQuit
    }))
  };
});

describe("QueueManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate and enqueue document ingestion job", async () => {
    mockAdd.mockResolvedValueOnce({ id: "job-101" });

    const manager = new QueueManager("redis://localhost:6379");
    const jobId = await manager.enqueueIngestionJob({
      tenantId: "tenant-beta",
      title: "Quarterly Financials",
      content: "Revenue was up 20% in Q3."
    });

    expect(jobId).toBe("job-101");
    expect(mockAdd).toHaveBeenCalledWith("ingest", {
      tenantId: "tenant-beta",
      title: "Quarterly Financials",
      content: "Revenue was up 20% in Q3.",
      metadata: {}
    });
  });

  it("should throw ValidationError if required job fields are missing", async () => {
    const manager = new QueueManager("redis://localhost:6379");
    await expect(
      manager.enqueueIngestionJob({
        tenantId: "",
        title: "Missing tenant",
        content: "Content"
      })
    ).rejects.toThrow(ValidationError);
  });

  it("should wrap queue failures in InfrastructureError with QUEUE_JOB_ERROR code", async () => {
    mockAdd.mockRejectedValueOnce(new Error("Redis connection refused"));

    const manager = new QueueManager("redis://localhost:6379");
    try {
      await manager.enqueueIngestionJob({
        tenantId: "tenant-beta",
        title: "Title",
        content: "Content"
      });
      expect.fail("Expected enqueueIngestionJob to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InfrastructureError);
      expect((error as InfrastructureError).code).toBe(ErrorCode.QUEUE_JOB_ERROR);
    }
  });

  it("should close queue and redis connections cleanly", async () => {
    mockQueueClose.mockResolvedValueOnce(undefined);
    mockRedisQuit.mockResolvedValueOnce("OK");

    const manager = new QueueManager("redis://localhost:6379");
    await manager.close();

    expect(mockQueueClose).toHaveBeenCalledTimes(1);
    expect(mockRedisQuit).toHaveBeenCalledTimes(1);
  });
});
