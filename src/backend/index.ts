import { env } from "./config/env.js";
import { db } from "../databases/postgres.client.js";
import { buildContext } from "../brain/index.js";
import { logger } from "./shared/logger.js";

export * from "./config/index.js";
export * from "./errors/index.js";
export * from "./shared/index.js";
export * from "./queue/index.js";
export * from "./models/index.js";
export * from "./employees/index.js";
export * from "./agents/index.js";
export * from "./flows/index.js";

async function main(): Promise<void> {
  logger.info("FoundryOS initializing...", {
    environment: env.NODE_ENV,
    port: env.PORT,
    model: env.EMBEDDING_MODEL
  });

  const isDbConnected = await db.healthCheck();
  logger.info("Database connectivity check", { connected: isDbConnected });

  const sampleContext = buildContext({
    systemDirective: "You are an AI assistant powered by FoundryOS.",
    userQuery: "How does the Company Brain retrieve documents?",
    retrievedChunks: [
      {
        chunkId: "11111111-2222-3333-4444-555555555555",
        documentId: "66666666-7777-8888-9999-000000000000",
        content: "FoundryOS uses PostgreSQL with pgvector HNSW indexing for similarity search.",
        similarity: 0.94,
        metadata: { category: "architecture" }
      }
    ],
    maxTokenBudget: 2048,
    reservedCompletionBudget: 512
  });

  logger.info("Context builder sample output generated", {
    tokenEstimate: sampleContext.totalTokenEstimate,
    includedChunks: sampleContext.includedChunkIds.length
  });

  await db.close();
  logger.info("FoundryOS startup cycle completed successfully.");
}

if (process.argv[1] && process.argv[1].endsWith("backend/index.js")) {
  main().catch((error: unknown) => {
    logger.error("Application runtime failure", error);
    process.exit(1);
  });
}

export { main };
