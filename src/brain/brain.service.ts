import { createHash } from "node:crypto";
import {
  type DocumentChunk,
  type DocumentIngestInput,
  DocumentIngestInputSchema,
  type DocumentRecord,
  type VectorSearchQueryInput,
  VectorSearchQuerySchema,
  type VectorSearchResult,
  type ProposedMemoryInput,
  ProposedMemoryInputSchema,
  type ValidateMemoryInput,
  ValidateMemoryInputSchema,
  type CompetitorObservationInput,
  CompetitorObservationInputSchema,
  type BrainConflict,
  type BrainHealthScore,
  type BrainMemoryRecord
} from "./brain.contracts.js";
import { BrainRepository, brainRepository } from "./brain.repository.js";
import { estimateTokenCount } from "./context.builder.js";
import { ValidationError, DomainError } from "../backend/errors/base.error.js";
import { ErrorCode } from "../backend/errors/error-codes.js";
import { logger } from "../backend/shared/logger.js";

export interface ChunkSplitOptions {
  readonly maxChunkSize?: number;
  readonly chunkOverlap?: number;
}

export class BrainService {
  constructor(private readonly repository: BrainRepository = brainRepository) {}

  public computeHash(content: string): string {
    return createHash("sha256").update(content, "utf8").digest("hex");
  }

  public splitIntoChunks(text: string, options: ChunkSplitOptions = {}): string[] {
    const maxChunkSize = options.maxChunkSize ?? 500;
    const overlap = options.chunkOverlap ?? 50;
    const chunks: string[] = [];

    if (text.length <= maxChunkSize) {
      return [text];
    }

    let start = 0;
    while (start < text.length) {
      let end = start + maxChunkSize;
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(" ", end);
        if (lastSpace > start + overlap) {
          end = lastSpace;
        }
      } else {
        end = text.length;
      }

      const chunk = text.slice(start, end).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      if (end >= text.length) {
        break;
      }
      start = end - overlap;
    }

    return chunks;
  }

  public async ingestDocument(
    rawInput: DocumentIngestInput,
    embeddingGenerator: (text: string) => Promise<number[]>
  ): Promise<{ document: DocumentRecord; chunkCount: number }> {
    const parseResult = DocumentIngestInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid document ingestion input", { issues: parseResult.error.issues });
    }

    const input = parseResult.data;
    const contentHash = this.computeHash(input.content);

    try {
      const document = await this.repository.upsertDocument(
        input.tenantId,
        input.title,
        contentHash,
        input.sourceUri,
        input.metadata,
        input.provenance
      );

      const rawChunks = this.splitIntoChunks(input.content);
      const chunks: DocumentChunk[] = [];

      for (let i = 0; i < rawChunks.length; i++) {
        const chunkText = rawChunks[i]!;
        const embedding = await embeddingGenerator(chunkText);
        if (!embedding || embedding.length === 0) {
          throw new DomainError(
            "Embedding generator returned empty vector",
            ErrorCode.VECTOR_DIMENSION_MISMATCH,
            { chunkIndex: i }
          );
        }
        const tokenCount = estimateTokenCount(chunkText);

        chunks.push({
          documentId: document.id,
          tenantId: input.tenantId,
          chunkIndex: i,
          content: chunkText,
          tokenCount,
          embedding,
          metadata: {
            ...input.metadata,
            title: input.title,
            provenance: input.provenance
          }
        });
      }

      await this.repository.insertChunks(chunks);

      logger.info("Document ingested successfully into Company Brain", {
        documentId: document.id,
        tenantId: input.tenantId,
        chunkCount: chunks.length
      });

      return { document, chunkCount: chunks.length };
    } catch (error: unknown) {
      if (error instanceof ValidationError || error instanceof DomainError) {
        throw error;
      }
      logger.error("Failed to ingest document into Company Brain", error, { tenantId: input.tenantId });
      throw new DomainError(
        "Document ingestion failed",
        ErrorCode.DOCUMENT_INGESTION_ERROR,
        error instanceof Error ? { message: error.message } : {}
      );
    }
  }

  public async search(rawQuery: VectorSearchQueryInput): Promise<VectorSearchResult[]> {
    const parseResult = VectorSearchQuerySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      throw new ValidationError("Invalid vector search query", { issues: parseResult.error.issues });
    }

    const query = parseResult.data;
    try {
      return await this.repository.searchSimilarChunks(query);
    } catch (error: unknown) {
      logger.error("Vector similarity search failed", error, { tenantId: query.tenantId });
      throw new DomainError(
        "Vector search execution failed",
        ErrorCode.VECTOR_SEARCH_ERROR,
        error instanceof Error ? { message: error.message } : {}
      );
    }
  }

  public async proposeMemory(rawInput: ProposedMemoryInput): Promise<string> {
    const parseResult = ProposedMemoryInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid proposed memory payload", { issues: parseResult.error.issues });
    }

    const input = parseResult.data;
    const confidenceScore = input.confidenceLevel === "HIGH" ? 0.9 : input.confidenceLevel === "MEDIUM" ? 0.6 : 0.35;
    const sourcePriority = input.confidenceLevel === "HIGH" ? 2 : input.confidenceLevel === "MEDIUM" ? 4 : 6;

    const memoryRecord: BrainMemoryRecord = {
      tenantId: input.tenantId,
      memoryType: input.memoryType,
      statement: input.statement,
      rationale: input.rationale,
      confidenceLevel: input.confidenceLevel,
      confidenceScore,
      evidenceCount: input.evidence.length > 0 ? input.evidence.length : 1,
      evidence: input.evidence,
      status: "unvalidated",
      sourcePriority,
      isCurrent: true,
      metadata: {
        ...input.metadata,
        proposedByEmployee: input.proposedByEmployee ?? "ai_employee"
      }
    };

    const id = await this.repository.saveMemory(memoryRecord);
    logger.info("New memory proposed to Company Brain", {
      tenantId: input.tenantId,
      memoryId: id,
      memoryType: input.memoryType,
      confidenceLevel: input.confidenceLevel
    });

    return id;
  }

  public async validateMemory(rawInput: ValidateMemoryInput): Promise<void> {
    const parseResult = ValidateMemoryInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid memory validation input", { issues: parseResult.error.issues });
    }

    const input = parseResult.data;
    await this.repository.updateMemoryStatus(
      input.tenantId,
      input.memoryId,
      "validated",
      input.reviewer,
      input.targetType,
      input.confidenceLevel
    );

    logger.info("Memory validated and promoted in Company Brain", {
      tenantId: input.tenantId,
      memoryId: input.memoryId,
      targetType: input.targetType,
      reviewer: input.reviewer
    });
  }

  public async recordCompetitorObservation(rawInput: CompetitorObservationInput): Promise<void> {
    const parseResult = CompetitorObservationInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid competitor observation input", { issues: parseResult.error.issues });
    }

    const input = parseResult.data;
    const competitors = await this.repository.getCompetitors(input.tenantId);
    let target = competitors.find((c) => c.name.toLowerCase() === input.competitorName.toLowerCase());

    if (!target) {
      const id = await this.repository.upsertCompetitor({
        tenantId: input.tenantId,
        name: input.competitorName,
        currentPricing: input.attributeName === "pricing" ? input.newValue : undefined,
        positioning: input.attributeName === "positioning" ? input.newValue : undefined
      });
      target = {
        id,
        tenantId: input.tenantId,
        name: input.competitorName,
        currentPricing: input.attributeName === "pricing" ? input.newValue : undefined,
        features: [],
        strengths: [],
        weaknesses: [],
        marketingChannels: []
      };
    }

    const currentTarget = target;
    const oldValue = input.attributeName === "pricing" ? currentTarget.currentPricing ?? null : null;

    if (oldValue !== input.newValue) {
      await this.repository.recordCompetitorHistory({
        competitorId: currentTarget.id!,
        tenantId: input.tenantId,
        attributeName: input.attributeName,
        oldValue,
        newValue: input.newValue,
        sourceNotes: input.sourceNotes
      });

      if (input.attributeName === "pricing") {
        await this.repository.upsertCompetitor({
          ...currentTarget,
          currentPricing: input.newValue
        });
      }

      logger.info("Competitor change recorded in Company Brain", {
        tenantId: input.tenantId,
        competitorName: input.competitorName,
        attributeName: input.attributeName,
        oldValue,
        newValue: input.newValue
      });
    }
  }

  public async detectConflicts(tenantId: string): Promise<BrainConflict[]> {
    const conflicts: BrainConflict[] = [];

    const brand = await this.repository.getBrandProfile(tenantId);
    const campaigns = await this.repository.getCampaigns(tenantId);
    const strategies = await this.repository.getStrategies(tenantId, false);
    const icp = await this.repository.getIcp(tenantId);
    const goals = await this.repository.getGoals(tenantId, "active");

    if (brand && brand.toneAvoid.length > 0 && campaigns.length > 0) {
      for (const campaign of campaigns) {
        if (campaign.objective) {
          for (const avoidTone of brand.toneAvoid) {
            if (campaign.objective.toLowerCase().includes(avoidTone.toLowerCase())) {
              conflicts.push({
                conflictType: "BRAND_VOICE_MISMATCH",
                description: `Campaign "${campaign.campaignName}" uses tone elements explicitly discouraged by brand guidelines: "${avoidTone}".`,
                sourceA: "BrandProfile.toneAvoid",
                sourceB: `Campaign Execution: ${campaign.campaignName}`,
                suggestedAction: `Revise campaign objective and copy to adhere to preferred brand voice: ${brand.tonePositive.join(", ")}.`
              });
            }
          }
        }
      }
    }

    if (icp && goals.length > 0) {
      for (const goal of goals) {
        if (goal.targetAudience && icp.customerType) {
          const goalAudience = goal.targetAudience.toLowerCase();
          const icpType = icp.customerType.toLowerCase();
          if (!goalAudience.includes(icpType) && !icpType.includes(goalAudience)) {
            conflicts.push({
              conflictType: "AUDIENCE_GTM_MISMATCH",
              description: `Active goal "${goal.objective}" targets "${goal.targetAudience}", which diverges from primary ICP definition "${icp.customerType}".`,
              sourceA: `BusinessIcp.customerType (${icp.customerType})`,
              sourceB: `CompanyGoal: ${goal.objective} (${goal.targetAudience})`,
              suggestedAction: "Align the campaign target audience with the approved ICP or record an updated strategic decision."
            });
          }
        }
      }
    }

    if (strategies.length > 1) {
      const outdated = strategies.filter((s) => !s.isCurrent);
      const current = strategies.find((s) => s.isCurrent);
      if (current && outdated.length > 0) {
        for (const old of outdated) {
          if (old.strategyKey === current.strategyKey && old.content === current.content) {
            conflicts.push({
              conflictType: "SUPERSEDED_STRATEGY_DUPLICATION",
              description: `Strategy version ${old.version} contains identical content to active version ${current.version}.`,
              sourceA: `Strategy V${old.version}`,
              sourceB: `Strategy V${current.version}`,
              suggestedAction: "Deprecate or consolidate identical strategy versions."
            });
          }
        }
      }
    }

    return conflicts;
  }

  public async computeBrainHealth(tenantId: string): Promise<BrainHealthScore> {
    const [company, products, icp, personas, brand, competitors, goals, memories] = await Promise.all([
      this.repository.getCompanyProfile(tenantId),
      this.repository.getProducts(tenantId),
      this.repository.getIcp(tenantId),
      this.repository.getPersonas(tenantId),
      this.repository.getBrandProfile(tenantId),
      this.repository.getCompetitors(tenantId),
      this.repository.getGoals(tenantId),
      this.repository.queryMemories(tenantId)
    ]);

    const layerScores: Record<string, number> = {};
    const staleAlerts: string[] = [];

    let companyScore = 0;
    if (company) {
      companyScore += company.companyName ? 30 : 0;
      companyScore += company.industry ? 25 : 0;
      companyScore += company.description ? 25 : 0;
      companyScore += company.website ? 20 : 0;
    }
    layerScores["companyIdentity"] = companyScore;
    if (companyScore < 70) {
      staleAlerts.push("Company profile is incomplete (missing core industry or description).");
    }

    let productScore = 0;
    if (products.length > 0) {
      const p = products[0]!;
      productScore += p.productName ? 40 : 0;
      productScore += p.features.length > 0 ? 30 : 0;
      productScore += p.problemStatement ? 30 : 0;
    }
    layerScores["products"] = productScore;

    let audienceScore = 0;
    if (icp) {
      audienceScore += icp.customerType ? 40 : 0;
      audienceScore += icp.painPoints.length > 0 ? 30 : 0;
      audienceScore += personas.length > 0 ? 30 : 0;
    }
    layerScores["audience"] = audienceScore;
    if (audienceScore < 60) {
      staleAlerts.push("Audience ICP and Personas are sparsely defined.");
    }

    let brandScore = 0;
    if (brand) {
      brandScore += brand.brandName ? 20 : 0;
      brandScore += brand.tonePositive.length > 0 ? 25 : 0;
      brandScore += brand.coreMessage ? 25 : 0;
      brandScore += brand.contentRules.length > 0 ? 30 : 0;
    }
    layerScores["brand"] = brandScore;

    let competitorScore = 0;
    if (competitors.length > 0) {
      competitorScore += Math.min(100, competitors.length * 35);
    }
    layerScores["competitors"] = competitorScore;

    let goalScore = 0;
    const activeGoals = goals.filter((g) => g.status === "active");
    if (activeGoals.length > 0) {
      goalScore = 100;
    }
    layerScores["goals"] = goalScore;
    if (goalScore === 0) {
      staleAlerts.push("No active goals found in Company Brain.");
    }

    let memoryScore = 0;
    const validatedLearnings = memories.filter((m) => m.status === "validated");
    if (validatedLearnings.length > 0) {
      memoryScore = Math.min(100, validatedLearnings.length * 25);
    } else if (memories.length > 0) {
      memoryScore = 40;
    }
    layerScores["marketingMemory"] = memoryScore;
    if (validatedLearnings.length === 0) {
      staleAlerts.push("No validated learnings in Marketing Memory yet.");
    }

    const scores = Object.values(layerScores);
    const overallScore = Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length);

    return {
      tenantId,
      overallScore,
      layerScores,
      staleAlerts,
      evaluatedAt: new Date()
    };
  }
}

export const brainService = new BrainService();
