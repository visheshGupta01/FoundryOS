import { describe, it, expect, vi } from "vitest";
import { TrueForgeService } from "../../src/modules/trueforge/trueforge.service.js";
import { ValidationError, InfrastructureError } from "../../src/errors/base.error.js";
import { ErrorCode } from "../../src/errors/error-codes.js";
import type { TrueForge } from "@truefoundry/trueforge-sdk";

describe("TrueForgeService", () => {
  const mockCreate = vi.fn();
  const mockCreateTurn = vi.fn();

  const mockClient = {
    sessions: {
      create: mockCreate,
      createTurn: mockCreateTurn
    }
  } as unknown as TrueForge;

  it("should create agent session successfully", async () => {
    mockCreate.mockResolvedValueOnce({
      data: {
        id: "session-xyz-123",
        createdAt: new Date().toISOString()
      }
    });

    const service = new TrueForgeService(mockClient);
    const result = await service.createSession({
      tenantId: "tenant-alpha",
      agentName: "researcher",
      metadata: { env: "test" }
    });

    expect(result.sessionId).toBe("session-xyz-123");
    expect(result.tenantId).toBe("tenant-alpha");
    expect(result.agentName).toBe("researcher");
    expect(result.status).toBe("active");
  });

  it("should throw ValidationError if session input is missing tenantId", async () => {
    const service = new TrueForgeService(mockClient);
    await expect(
      service.createSession({
        tenantId: "",
        agentName: "researcher"
      })
    ).rejects.toThrow(ValidationError);
  });

  it("should wrap session creation failures in InfrastructureError with TRUEFORGE_SESSION_ERROR code", async () => {
    mockCreate.mockRejectedValue(new Error("Connection refused"));

    const service = new TrueForgeService(mockClient);
    try {
      await service.createSession({
        tenantId: "tenant-alpha",
        agentName: "researcher"
      });
      expect.fail("Expected createSession to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InfrastructureError);
      expect((error as InfrastructureError).code).toBe(ErrorCode.TRUEFORGE_SESSION_ERROR);
    }
  });

  it("should execute agent turn successfully and extract text output", async () => {
    mockCreateTurn.mockResolvedValueOnce({
      data: {
        id: "turn-abc-456",
        sessionId: "session-xyz-123",
        state: {
          status: "done",
          completedAt: new Date().toISOString(),
          output: {
            type: "model.message",
            id: "msg-1",
            threadId: "main",
            createdAt: new Date().toISOString(),
            content: "Response from agent harness"
          },
          requiredActions: []
        }
      }
    });

    const service = new TrueForgeService(mockClient);
    const result = await service.executeTurn({
      sessionId: "session-xyz-123",
      tenantId: "tenant-alpha",
      prompt: "Analyze Q3 vector latency"
    });

    expect(result.turnId).toBe("turn-abc-456");
    expect(result.sessionId).toBe("session-xyz-123");
    expect(result.status).toBe("done");
    expect(result.output).toBe("Response from agent harness");
  });

  it("should wrap turn execution failures in InfrastructureError with TRUEFORGE_API_ERROR code", async () => {
    mockCreateTurn.mockRejectedValue(new Error("Timeout waiting for model response"));

    const service = new TrueForgeService(mockClient);
    try {
      await service.executeTurn({
        sessionId: "session-xyz-123",
        tenantId: "tenant-alpha",
        prompt: "Analyze Q3 vector latency"
      });
      expect.fail("Expected executeTurn to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(InfrastructureError);
      expect((error as InfrastructureError).code).toBe(ErrorCode.TRUEFORGE_API_ERROR);
    }
  });
});
