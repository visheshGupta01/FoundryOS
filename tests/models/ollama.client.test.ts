import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { OllamaClient } from "../../src/backend/models/ollama.client.js";
import { ValidationError, InfrastructureError } from "../../src/backend/errors/base.error.js";

describe("OllamaClient Integration and Logic", () => {
  it("should check if ollama server is available", async () => {
    const client = new OllamaClient();
    const available = await client.isAvailable();
    expect(typeof available).toBe("boolean");
    expect(available).toBe(true);
  });

  it("should list available models in ollama", async () => {
    const client = new OllamaClient();
    const models = await client.listModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.some((m) => m.includes("llama3.2"))).toBe(true);
  });

  it("should generate text completion from llama3.2:1b", async () => {
    const client = new OllamaClient({ model: "llama3.2:1b" });
    const response = await client.generate("Respond only with the word PONG");
    expect(response.length).toBeGreaterThan(0);
    expect(response.toUpperCase()).toContain("PONG");
  });

  it("should generate structured validated JSON matching a Zod schema", async () => {
    const client = new OllamaClient({ model: "llama3.2:1b" });

    const OutputSchema = z.object({
      company: z.string(),
      score: z.number()
    });

    const prompt = 'Output JSON for company "FoundryOS" with score 95';
    const result = await client.generateStructured(prompt, OutputSchema, {
      system: "You are a JSON generator. Respond only with JSON conforming to { company: string, score: number }."
    });

    expect(result.company).toBe("FoundryOS");
    expect(result.score).toBe(95);
  });

  it("should generate embedding vector via nomic-embed-text", async () => {
    const client = new OllamaClient({ embeddingModel: "nomic-embed-text" });
    const vector = await client.embed("FoundryOS company brain digital institutional memory");
    expect(Array.isArray(vector)).toBe(true);
    expect(vector.length).toBe(768);
    expect(typeof vector[0]).toBe("number");
  });

  it("should throw ValidationError if structured output fails schema validation", async () => {
    const mockClient = new OllamaClient();
    vi.spyOn(mockClient, "chat").mockResolvedValue('{"unexpectedKey": "value"}');

    const TargetSchema = z.object({
      requiredKey: z.string()
    });

    await expect(
      mockClient.generateStructured("test prompt", TargetSchema)
    ).rejects.toThrow(ValidationError);
  });

  it("should throw InfrastructureError if Ollama returns server error", async () => {
    const mockClient = new OllamaClient({ baseUrl: "http://localhost:9999" });
    await expect(
      mockClient.generate("test prompt")
    ).rejects.toThrow(InfrastructureError);
  });
});
