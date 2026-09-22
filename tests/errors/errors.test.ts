import { describe, it, expect } from "vitest";
import {
  ValidationError,
  NotFoundError,
  ConfigurationError,
  DomainError,
  InfrastructureError,
  RateLimitError
} from "../../src/errors/base.error.js";
import { ErrorCode } from "../../src/errors/error-codes.js";

describe("Typed Error Hierarchy", () => {
  it("should construct ValidationError with 400 status and VALIDATION_ERROR code", () => {
    const error = new ValidationError("Invalid payload", { field: "title" });
    expect(error.httpStatus).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.details).toEqual({ field: "title" });
    expect(error.toJSON()).toEqual({
      name: "ValidationError",
      code: ErrorCode.VALIDATION_ERROR,
      message: "Invalid payload",
      httpStatus: 400,
      details: { field: "title" }
    });
  });

  it("should construct NotFoundError with 404 status and NOT_FOUND code", () => {
    const error = new NotFoundError("Document not found", { documentId: "doc-123" });
    expect(error.httpStatus).toBe(404);
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("should construct ConfigurationError with 500 status", () => {
    const error = new ConfigurationError("Missing key");
    expect(error.httpStatus).toBe(500);
    expect(error.code).toBe(ErrorCode.CONFIGURATION_ERROR);
  });

  it("should construct DomainError with custom domain code", () => {
    const error = new DomainError("Chunk failure", ErrorCode.CHUNK_GENERATION_ERROR);
    expect(error.httpStatus).toBe(422);
    expect(error.code).toBe(ErrorCode.CHUNK_GENERATION_ERROR);
  });

  it("should construct InfrastructureError with 502 status", () => {
    const error = new InfrastructureError("DB failure", ErrorCode.DATABASE_QUERY_ERROR);
    expect(error.httpStatus).toBe(502);
    expect(error.code).toBe(ErrorCode.DATABASE_QUERY_ERROR);
  });

  it("should construct RateLimitError with 429 status", () => {
    const error = new RateLimitError("Too many requests");
    expect(error.httpStatus).toBe(429);
    expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
  });
});
