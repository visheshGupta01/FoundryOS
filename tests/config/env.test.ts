import { describe, it, expect } from "vitest";
import { parseEnv } from "../../src/backend/config/env.js";
import { ConfigurationError } from "../../src/backend/errors/base.error.js";

describe("Environment Configuration", () => {
  it("should parse default environment values correctly", () => {
    const parsed = parseEnv({});
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.PORT).toBe(3000);
    expect(parsed.LOG_LEVEL).toBe("info");
    expect(parsed.EMBEDDING_DIMENSIONS).toBe(1536);
  });

  it("should parse valid custom environment values", () => {
    const custom = {
      NODE_ENV: "production",
      PORT: "8080",
      LOG_LEVEL: "warn",
      DATABASE_URL: "postgresql://custom:custom@localhost:5432/db",
      REDIS_URL: "redis://localhost:6380",
      TRUEFORGE_API_URL: "https://agent.example.com",
      TRUEFORGE_API_KEY: "custom_key",
      EMBEDDING_MODEL: "text-embedding-3-large",
      EMBEDDING_DIMENSIONS: "3072"
    };
    const parsed = parseEnv(custom);
    expect(parsed.NODE_ENV).toBe("production");
    expect(parsed.PORT).toBe(8080);
    expect(parsed.LOG_LEVEL).toBe("warn");
    expect(parsed.EMBEDDING_DIMENSIONS).toBe(3072);
  });

  it("should throw ConfigurationError when invalid values are provided", () => {
    const invalid = {
      PORT: "not-a-number"
    };
    expect(() => parseEnv(invalid)).toThrow(ConfigurationError);
  });
});
