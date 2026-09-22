import { z } from "zod";

export const CompanyProfileSchema = z.object({
  tenantId: z.string().min(1).max(64),
  companyName: z.string().min(1).max(255),
  website: z.string().url().optional(),
  industry: z.string().min(1).max(128).optional(),
  businessModel: z.string().min(1).max(128).optional(),
  businessStage: z.string().min(1).max(64).optional(),
  description: z.string().optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  location: z.string().max(255).optional(),
  companySize: z.string().max(64).optional(),
  targetGeography: z.string().max(255).optional()
});

export type CompanyProfileInput = z.input<typeof CompanyProfileSchema>;
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

export const CompanyProductSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().min(1).max(64),
  productName: z.string().min(1).max(255),
  category: z.string().max(128).optional(),
  description: z.string().optional(),
  problemStatement: z.string().optional(),
  problemSeverity: z.string().max(64).optional(),
  solutionStatement: z.string().optional(),
  differentiation: z.string().optional(),
  features: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  useCases: z.array(z.string()).default([]),
  pricingModel: z.string().max(64).optional(),
  pricingDetails: z.record(z.unknown()).default({}),
  productStage: z.string().max(64).optional(),
  uniqueFeatures: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([])
});

export type CompanyProductInput = z.input<typeof CompanyProductSchema>;
export type CompanyProduct = z.infer<typeof CompanyProductSchema>;

export const BusinessIcpSchema = z.object({
  tenantId: z.string().min(1).max(64),
  customerType: z.string().max(128).optional(),
  companySize: z.string().max(128).optional(),
  industry: z.string().max(128).optional(),
  jobRoles: z.array(z.string()).default([]),
  budgetRange: z.string().max(128).optional(),
  buyingPower: z.string().max(128).optional(),
  location: z.string().max(128).optional(),
  painPoints: z.array(z.string()).default([]),
  needs: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  objections: z.array(z.string()).default([]),
  buyingTriggers: z.array(z.string()).default([]),
  decisionCriteria: z.array(z.string()).default([])
});

export type BusinessIcpInput = z.input<typeof BusinessIcpSchema>;
export type BusinessIcp = z.infer<typeof BusinessIcpSchema>;

export const PersonaSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  role: z.string().min(1).max(128),
  painPoints: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  objections: z.array(z.string()).default([])
});

export type PersonaInput = z.input<typeof PersonaSchema>;
export type Persona = z.infer<typeof PersonaSchema>;

export const BrandProfileSchema = z.object({
  tenantId: z.string().min(1).max(64),
  brandName: z.string().min(1).max(128),
  brandPositioning: z.string().optional(),
  mission: z.string().optional(),
  vision: z.string().optional(),
  values: z.array(z.string()).default([]),
  personality: z.array(z.string()).default([]),
  brandPromise: z.string().optional(),
  differentiators: z.array(z.string()).default([]),
  tonePositive: z.array(z.string()).default(["professional", "confident", "clear", "human"]),
  toneAvoid: z.array(z.string()).default(["overly corporate", "generic AI language", "excessive hype", "buzzwords"]),
  coreMessage: z.string().optional(),
  valueProposition: z.string().optional(),
  primaryMessage: z.string().optional(),
  secondaryMessages: z.array(z.string()).default([]),
  taglines: z.array(z.string()).default([]),
  keyBenefits: z.array(z.string()).default([]),
  proofPoints: z.array(z.string()).default([]),
  objectionHandling: z.record(z.string()).default({}),
  claims: z.array(z.string()).default([]),
  contentRules: z.array(z.string()).default([])
});

export type BrandProfileInput = z.input<typeof BrandProfileSchema>;
export type BrandProfile = z.infer<typeof BrandProfileSchema>;

export const CompetitorSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  website: z.string().url().optional(),
  productName: z.string().max(128).optional(),
  category: z.string().max(128).optional(),
  currentPricing: z.string().optional(),
  positioning: z.string().optional(),
  targetAudience: z.string().optional(),
  features: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  messaging: z.string().optional(),
  marketingChannels: z.array(z.string()).default([]),
  contentStrategy: z.string().optional(),
  adsSummary: z.string().optional(),
  seoFocus: z.string().optional(),
  socialPresence: z.string().optional()
});

export type CompetitorInput = z.input<typeof CompetitorSchema>;
export type Competitor = z.infer<typeof CompetitorSchema>;

export const CompetitorHistorySchema = z.object({
  id: z.string().uuid().optional(),
  competitorId: z.string().uuid(),
  tenantId: z.string().min(1).max(64),
  attributeName: z.string().min(1).max(64),
  oldValue: z.string().nullable().optional(),
  newValue: z.string().min(1),
  detectedAt: z.date().optional(),
  validFrom: z.date().optional(),
  validUntil: z.date().nullable().optional(),
  sourceNotes: z.string().optional()
});

export type CompetitorHistory = z.infer<typeof CompetitorHistorySchema>;

export const CompetitorObservationInputSchema = z.object({
  tenantId: z.string().min(1).max(64),
  competitorName: z.string().min(1).max(128),
  attributeName: z.string().min(1).max(64),
  newValue: z.string().min(1),
  sourceNotes: z.string().optional()
});

export type CompetitorObservationInput = z.input<typeof CompetitorObservationInputSchema>;

export const GoalPrioritySchema = z.enum(["high", "medium", "low"]);
export type GoalPriority = z.infer<typeof GoalPrioritySchema>;

export const GoalStatusSchema = z.enum(["active", "completed", "paused", "archived"]);
export type GoalStatus = z.infer<typeof GoalStatusSchema>;

export const CompanyGoalSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().min(1).max(64),
  objective: z.string().min(1),
  timeframe: z.string().max(64).optional(),
  deadline: z.coerce.date().optional(),
  priority: GoalPrioritySchema.default("medium"),
  targetAudience: z.string().optional(),
  channels: z.array(z.string()).default([]),
  successMetric: z.string().min(1).max(128),
  targetMetricValue: z.string().optional(),
  currentMetricValue: z.string().optional(),
  status: GoalStatusSchema.default("active")
});

export type CompanyGoalInput = z.input<typeof CompanyGoalSchema>;
export type CompanyGoal = z.infer<typeof CompanyGoalSchema>;

export const StrategyVersionSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().min(1).max(64),
  strategyKey: z.string().min(1).max(128),
  version: z.number().int().positive().default(1),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  rationale: z.string().optional(),
  decisionMaker: z.string().max(128).optional(),
  isCurrent: z.boolean().default(true),
  status: z.string().default("active"),
  createdAt: z.date().optional()
});

export type StrategyVersionInput = z.input<typeof StrategyVersionSchema>;
export type StrategyVersion = z.infer<typeof StrategyVersionSchema>;

export const DocumentIngestInputSchema = z.object({
  tenantId: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  sourceUri: z.string().url().optional(),
  documentType: z.string().default("document"),
  author: z.string().optional(),
  department: z.string().optional(),
  tags: z.array(z.string()).default([]),
  provenance: z.string().optional(),
  confidenceScore: z.number().min(0).max(1).default(1.0),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type DocumentIngestInput = z.input<typeof DocumentIngestInputSchema>;
export type DocumentIngestData = z.infer<typeof DocumentIngestInputSchema>;

export const DocumentRecordSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  sourceUri: z.string().nullable().optional(),
  contentHash: z.string().min(1),
  documentType: z.string(),
  author: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  tags: z.array(z.string()),
  confidenceScore: z.number(),
  provenance: z.string().nullable().optional(),
  validFrom: z.date().nullable().optional(),
  validUntil: z.date().nullable().optional(),
  isCurrent: z.boolean(),
  status: z.string(),
  metadata: z.record(z.unknown()),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type DocumentRecord = z.infer<typeof DocumentRecordSchema>;

export const DocumentChunkSchema = z.object({
  id: z.string().uuid().optional(),
  documentId: z.string().uuid(),
  tenantId: z.string().min(1).max(64),
  chunkIndex: z.number().int().nonnegative(),
  content: z.string().min(1),
  tokenCount: z.number().int().positive(),
  embedding: z.array(z.number()).min(1),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date().optional()
});

export type DocumentChunk = z.infer<typeof DocumentChunkSchema>;

export const VectorSearchQuerySchema = z.object({
  tenantId: z.string().min(1).max(64),
  embedding: z.array(z.number()).min(1),
  limit: z.number().int().positive().max(100).default(10),
  minSimilarity: z.number().min(0).max(1).default(0.5),
  metadataFilter: z.record(z.unknown()).optional(),
  onlyCurrent: z.boolean().default(true)
});

export type VectorSearchQueryInput = z.input<typeof VectorSearchQuerySchema>;
export type VectorSearchQuery = z.infer<typeof VectorSearchQuerySchema>;

export const VectorSearchResultSchema = z.object({
  chunkId: z.string().uuid(),
  documentId: z.string().uuid(),
  tenantId: z.string(),
  content: z.string(),
  similarity: z.number().min(0).max(1),
  chunkIndex: z.number().int().nonnegative(),
  provenance: z.string().optional(),
  documentTitle: z.string().optional(),
  metadata: z.record(z.unknown())
});

export type VectorSearchResult = z.infer<typeof VectorSearchResultSchema>;

export const CampaignExecutionSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().min(1).max(64),
  goalId: z.string().uuid().optional(),
  campaignName: z.string().min(1).max(255),
  channel: z.string().min(1).max(64),
  objective: z.string().optional(),
  targetAudience: z.string().optional(),
  spendAmount: z.number().nonnegative().default(0),
  currency: z.string().default("INR"),
  impressions: z.number().int().nonnegative().default(0),
  clicks: z.number().int().nonnegative().default(0),
  ctr: z.number().min(0).max(1).default(0),
  conversions: z.number().int().nonnegative().default(0),
  leadsGenerated: z.number().int().nonnegative().default(0),
  qualifiedLeads: z.number().int().nonnegative().default(0),
  customersAcquired: z.number().int().nonnegative().default(0),
  status: z.string().default("draft")
});

export type CampaignExecutionInput = z.input<typeof CampaignExecutionSchema>;
export type CampaignExecution = z.infer<typeof CampaignExecutionSchema>;

export const BrainMemoryTypeEnum = z.enum([
  "fact",
  "preference",
  "decision",
  "knowledge",
  "strategy",
  "experience",
  "learning",
  "hypothesis",
  "constraint"
]);

export type BrainMemoryType = z.infer<typeof BrainMemoryTypeEnum>;

export const BrainMemoryStatusEnum = z.enum([
  "unvalidated",
  "pending_validation",
  "validated",
  "archived",
  "superseded"
]);

export type BrainMemoryStatus = z.infer<typeof BrainMemoryStatusEnum>;

export const ConfidenceLevelEnum = z.enum(["HIGH", "MEDIUM", "LOW"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelEnum>;

export const BrainMemoryRecordSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().min(1).max(64),
  memoryType: BrainMemoryTypeEnum,
  statement: z.string().min(1),
  rationale: z.string().optional(),
  confidenceLevel: ConfidenceLevelEnum.default("MEDIUM"),
  confidenceScore: z.number().min(0).max(1).default(0.5),
  evidenceCount: z.number().int().nonnegative().default(1),
  evidence: z.array(z.string()).default([]),
  status: BrainMemoryStatusEnum.default("unvalidated"),
  validatedBy: z.string().optional(),
  validatedAt: z.date().optional(),
  sourcePriority: z.number().int().min(1).max(6).default(5),
  validFrom: z.date().optional(),
  validUntil: z.date().nullable().optional(),
  isCurrent: z.boolean().default(true),
  metadata: z.record(z.unknown()).default({})
});

export type BrainMemoryInput = z.input<typeof BrainMemoryRecordSchema>;
export type BrainMemoryRecord = z.infer<typeof BrainMemoryRecordSchema>;

export const ProposedMemoryInputSchema = z.object({
  tenantId: z.string().min(1).max(64),
  memoryType: BrainMemoryTypeEnum,
  statement: z.string().min(1),
  rationale: z.string().optional(),
  evidence: z.array(z.string()).default([]),
  confidenceLevel: ConfidenceLevelEnum.default("LOW"),
  proposedByEmployee: z.string().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type ProposedMemoryInput = z.input<typeof ProposedMemoryInputSchema>;

export const ValidateMemoryInputSchema = z.object({
  tenantId: z.string().min(1).max(64),
  memoryId: z.string().min(1),
  reviewer: z.string().min(1).max(128),
  targetType: z.enum(["learning", "fact"]).default("learning"),
  confidenceLevel: ConfidenceLevelEnum.default("HIGH"),
  reason: z.string().optional()
});

export type ValidateMemoryInput = z.input<typeof ValidateMemoryInputSchema>;

export const BrainConflictSchema = z.object({
  conflictType: z.string(),
  description: z.string(),
  sourceA: z.string(),
  sourceB: z.string(),
  suggestedAction: z.string()
});

export type BrainConflict = z.infer<typeof BrainConflictSchema>;

export const BrainHealthScoreSchema = z.object({
  tenantId: z.string(),
  overallScore: z.number().min(0).max(100),
  layerScores: z.record(z.number().min(0).max(100)),
  staleAlerts: z.array(z.string()),
  evaluatedAt: z.date()
});

export type BrainHealthScore = z.infer<typeof BrainHealthScoreSchema>;
