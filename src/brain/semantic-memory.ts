import { embeddingService } from "./embedding.service.js";
import { logger } from "../backend/shared/logger.js";

export interface SemanticMemoryItem {
  id: string;
  tenantId: string;
  sourceType: "document" | "company_brain" | "memory_learning" | "competitor_intel";
  sourceId: string;
  title: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SemanticSearchResult {
  item: SemanticMemoryItem;
  similarity: number;
}

export class SemanticMemoryStore {
  private static instance: SemanticMemoryStore;
  private readonly items: Map<string, SemanticMemoryItem> = new Map();

  public static getInstance(): SemanticMemoryStore {
    if (!SemanticMemoryStore.instance) {
      SemanticMemoryStore.instance = new SemanticMemoryStore();
    }
    return SemanticMemoryStore.instance;
  }

  constructor() {
    // Clean startup: index from user-provided company brain and documents
  }

  public async indexText(params: {
    tenantId: string;
    sourceType: "document" | "company_brain" | "memory_learning" | "competitor_intel";
    sourceId: string;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const embedding = await embeddingService.generateEmbedding(params.content);
    const id = `sem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const item: SemanticMemoryItem = {
      id,
      tenantId: params.tenantId,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      title: params.title,
      content: params.content,
      embedding,
      metadata: params.metadata || {},
      createdAt: new Date().toISOString()
    };

    this.items.set(id, item);
    logger.info("Indexed item in Semantic Memory Store", { id, title: params.title, sourceType: params.sourceType });
    return id;
  }

  public async indexDocumentChunks(params: {
    tenantId: string;
    documentId: string;
    title: string;
    chunks: string[];
    metadata?: Record<string, unknown>;
  }): Promise<string[]> {
    const ids: string[] = [];
    for (let i = 0; i < params.chunks.length; i++) {
      const chunkText = params.chunks[i]!;
      const chunkId = await this.indexText({
        tenantId: params.tenantId,
        sourceType: "document",
        sourceId: `${params.documentId}-chunk-${i}`,
        title: `${params.title} (Part ${i + 1}/${params.chunks.length})`,
        content: chunkText,
        metadata: {
          ...params.metadata,
          documentId: params.documentId,
          chunkIndex: i
        }
      });
      ids.push(chunkId);
    }
    return ids;
  }

  public async search(
    queryText: string,
    options: {
      tenantId?: string;
      limit?: number;
      minSimilarity?: number;
      sourceTypes?: Array<"document" | "company_brain" | "memory_learning" | "competitor_intel">;
    } = {}
  ): Promise<SemanticSearchResult[]> {
    const tenantId = options.tenantId || "default-tenant";
    const limit = options.limit || 5;
    const minSimilarity = options.minSimilarity ?? 0.25;

    const queryEmbedding = await embeddingService.generateEmbedding(queryText);
    const results: SemanticSearchResult[] = [];

    for (const item of this.items.values()) {
      if (item.tenantId !== tenantId && item.tenantId !== "default-tenant") {
        continue;
      }
      if (options.sourceTypes && !options.sourceTypes.includes(item.sourceType)) {
        continue;
      }

      const similarity = embeddingService.cosineSimilarity(queryEmbedding, item.embedding);
      if (similarity >= minSimilarity) {
        results.push({ item, similarity });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  public deleteBySourceId(sourceId: string): number {
    let count = 0;
    for (const [id, item] of this.items.entries()) {
      if (item.sourceId === sourceId || item.sourceId.startsWith(`${sourceId}-chunk`)) {
        this.items.delete(id);
        count++;
      }
    }
    return count;
  }

  public count(tenantId: string = "default-tenant"): number {
    let total = 0;
    for (const item of this.items.values()) {
      if (item.tenantId === tenantId || item.tenantId === "default-tenant") total++;
    }
    return total;
  }
}

export const semanticMemory = SemanticMemoryStore.getInstance();
