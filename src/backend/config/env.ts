import { config } from "dotenv";
import { z } from "zod";
import { ConfigurationError } from "../errors/base.error.js";

config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DATABASE_URL: z.string().min(1).default("postgresql://foundry:foundry_pass@localhost:5432/foundry_os"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  TRUEFORGE_API_URL: z.string().url().default("http://localhost:8080"),
  TRUEFORGE_API_KEY: z.string().min(1).default("tf_dev_default_key"),
  EMBEDDING_MODEL: z.string().min(1).default("nomic-embed-text"),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3.2:1b"),
  LLM_PROVIDER: z.literal("ollama").default("ollama")
});

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(rawEnv: NodeJS.ProcessEnv): Env {
  const result = EnvSchema.safeParse(rawEnv);
  if (!result.success) {
    const issueMap: Record<string, unknown> = {};
    for (const issue of result.error.issues) {
      issueMap[issue.path.join(".")] = issue.message;
    }
    throw new ConfigurationError("Environment configuration validation failed", issueMap);
  }
  return result.data;
}

export const env = parseEnv(process.env);
