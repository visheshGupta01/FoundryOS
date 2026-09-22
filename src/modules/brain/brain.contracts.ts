import { z } from "zod";

export const DocumentIngestInputSchema = z.object({
  tenantId: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  sourceUri: z.string().url().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type DocumentIngestInput = z.infer<typeof DocumentIngestInputSchema>;

export const DocumentRecordSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  sourceUri: z.string().nullable().optional(),
  contentHash: z.string().min(1),
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
  metadataFilter: z.record(z.unknown()).optional()
});

export type VectorSearchQuery = z.infer<typeof VectorSearchQuerySchema>;

export const VectorSearchResultSchema = z.object({
  chunkId: z.string().uuid(),
  documentId: z.string().uuid(),
  tenantId: z.string(),
  content: z.string(),
  similarity: z.number().min(0).max(1),
  chunkIndex: z.number().int().nonnegative(),
  metadata: z.record(z.unknown())
});

export type VectorSearchResult = z.infer<typeof VectorSearchResultSchema>;
