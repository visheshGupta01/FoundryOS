import { ErrorCode, type ErrorCodeType } from "./error-codes.js";

export abstract class FoundryError extends Error {
  public abstract readonly httpStatus: number;
  public readonly code: ErrorCodeType;
  public readonly details: Readonly<Record<string, unknown>>;

  constructor(message: string, code: ErrorCodeType, details: Record<string, unknown> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = Object.freeze({ ...details });
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
      details: this.details
    };
  }
}

export class ValidationError extends FoundryError {
  public readonly httpStatus = 400;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class ConfigurationError extends FoundryError {
  public readonly httpStatus = 500;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, ErrorCode.CONFIGURATION_ERROR, details);
  }
}

export class NotFoundError extends FoundryError {
  public readonly httpStatus = 404;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, ErrorCode.NOT_FOUND, details);
  }
}

export class DomainError extends FoundryError {
  public readonly httpStatus = 422;

  constructor(message: string, code: ErrorCodeType = ErrorCode.INTERNAL_ERROR, details: Record<string, unknown> = {}) {
    super(message, code, details);
  }
}

export class InfrastructureError extends FoundryError {
  public readonly httpStatus = 502;

  constructor(message: string, code: ErrorCodeType = ErrorCode.INTERNAL_ERROR, details: Record<string, unknown> = {}) {
    super(message, code, details);
  }
}

export class RateLimitError extends FoundryError {
  public readonly httpStatus = 429;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, details);
  }
}
