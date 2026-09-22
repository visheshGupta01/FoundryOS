import { Queue, Worker, type JobsOptions, type Job } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { InfrastructureError, ValidationError } from "../errors/base.error.js";
import { ErrorCode } from "../errors/error-codes.js";
import { logger } from "../shared/logger.js";
import {
  type DocumentIngestJobData,
  type DocumentIngestJobInput,
  DocumentIngestJobDataSchema,
  type IngestJobResult,
  QueueName
} from "./queue.contracts.js";

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000
  },
  removeOnComplete: {
    age: 86400,
    count: 1000
  },
  removeOnFail: {
    age: 604800,
    count: 5000
  }
};

export class QueueManager {
  private readonly redisConnection: Redis;
  private readonly ingestionQueue: Queue<DocumentIngestJobData, IngestJobResult>;

  constructor(redisConnectionOrUrl: Redis | string = env.REDIS_URL) {
    if (typeof redisConnectionOrUrl === "string") {
      this.redisConnection = new Redis(redisConnectionOrUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true
      });
    } else {
      this.redisConnection = redisConnectionOrUrl;
    }

    this.ingestionQueue = new Queue<DocumentIngestJobData, IngestJobResult>(
      QueueName.DOCUMENT_INGESTION,
      {
        connection: this.redisConnection,
        defaultJobOptions: DEFAULT_JOB_OPTIONS
      }
    );
  }

  public async enqueueIngestionJob(rawInput: DocumentIngestJobInput): Promise<string> {
    const parseResult = DocumentIngestJobDataSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid job data for document ingestion", {
        issues: parseResult.error.issues
      });
    }

    const data = parseResult.data;

    try {
      const job = await this.ingestionQueue.add("ingest", data);
      if (!job.id) {
        throw new Error("Job was enqueued without an identifier");
      }

      logger.info("Enqueued document ingestion job", {
        jobId: job.id,
        tenantId: data.tenantId
      });

      return job.id;
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error("Failed to enqueue document ingestion job", error, { tenantId: data.tenantId });
      throw new InfrastructureError(
        "Failed to enqueue queue job",
        ErrorCode.QUEUE_JOB_ERROR,
        error instanceof Error ? { message: error.message } : {}
      );
    }
  }

  public createIngestionWorker(
    processor: (data: DocumentIngestJobData) => Promise<IngestJobResult>
  ): Worker<DocumentIngestJobData, IngestJobResult> {
    const worker = new Worker<DocumentIngestJobData, IngestJobResult>(
      QueueName.DOCUMENT_INGESTION,
      async (job: Job<DocumentIngestJobData, IngestJobResult>) => {
        logger.info("Processing ingestion job", { jobId: job.id, tenantId: job.data.tenantId });
        return await processor(job.data);
      },
      {
        connection: this.redisConnection,
        concurrency: 5
      }
    );

    worker.on("failed", (job, error) => {
      logger.error("Queue job processing failed", error, {
        jobId: job?.id,
        tenantId: job?.data.tenantId
      });
    });

    return worker;
  }

  public async close(): Promise<void> {
    await this.ingestionQueue.close();
    await this.redisConnection.quit();
  }
}

export const queueManager = new QueueManager();
