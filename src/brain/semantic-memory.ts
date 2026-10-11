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
    this.seedInitialKnowledge();
  }

  private seedInitialKnowledge(): void {
    const initialItems = [
      {
        sourceType: "company_brain" as const,
        sourceId: "brain-core-positioning",
        title: "FoundryOS Core Positioning & Architecture",
        content: "FoundryOS is the AI Marketing Operating System for founders and startups. It coordinates specialized AI employee personas (Chief Marketing Strategist, Market Research Analyst, Competitor Analyst, and GTM Funnel Architect) with persistent institutional Company Brain memory, native MCP tools, and full deliverable generation."
      },
      {
        sourceType: "company_brain" as const,
        sourceId: "brain-target-icp",
        title: "Ideal Customer Profile & Pain Points",
        content: "Target audience comprises early-stage B2B SaaS and technical founders with 1-25 employees. Core pain point: founders waste weeks coordinating fragmented AI tools with zero persistent company context, inconsistent brand tone, and high prompt fatigue."
      },
      {
        sourceType: "competitor_intel" as const,
        sourceId: "brain-competitor-audit",
        title: "Competitive Landscape & Moats",
        content: "Competitors are fragmented into generic prompt wrappers (Jasper, Copy.ai) and rigid workflow builders (Make, Zapier). Vulnerabilities of competitors: no persistent company context, no verified memory learning, prompt drift, and zero multi-agent synchronization."
      },
      {
        sourceType: "memory_learning" as const,
        sourceId: "learning-pricing-strategy",
        title: "Pricing & GTM Model Benchmark",
        content: "Recommended B2B SaaS pricing tier: Self-serve Starter ($49/mo) with 50K tokens, Growth ($149/mo) with full MCP tools & PDF export, and Scale ($399/mo) with dedicated multi-agent autonomy and custom integrations."
      }
    ];

    for (const item of initialItems) {
      const embedding = (embeddingService as any).generateSemanticFeatureVector(item.content);
      const id = `sem-mem-${item.sourceId}`;
      this.items.set(id, {
        id,
        tenantId: "default-tenant",
        sourceType: item.sourceType,
        sourceId: item.sourceId,
        title: item.title,
        content: item.content,
        embedding,
        metadata: { isSeed: true },
        createdAt: new Date().toISOString()
      });
    }
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
