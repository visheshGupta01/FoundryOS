import { z } from "zod";

export const QueueName = {
  DOCUMENT_INGESTION: "document-ingestion",
  VECTOR_INDEXING: "vector-indexing"
} as const;

export type QueueNameType = (typeof QueueName)[keyof typeof QueueName];

export const DocumentIngestJobDataSchema = z.object({
  tenantId: z.string().min(1).max(64),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  sourceUri: z.string().url().optional(),
  metadata: z.record(z.unknown()).default({})
});

export type DocumentIngestJobInput = z.input<typeof DocumentIngestJobDataSchema>;
export type DocumentIngestJobData = z.infer<typeof DocumentIngestJobDataSchema>;

export const IngestJobResultSchema = z.object({
  documentId: z.string().uuid(),
  tenantId: z.string(),
  chunkCount: z.number().int().nonnegative()
});

export type IngestJobResult = z.infer<typeof IngestJobResultSchema>;
