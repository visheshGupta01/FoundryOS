import pg from "pg";
import pgvector from "pgvector/pg";
import { env } from "../config/env.js";
import { InfrastructureError } from "../errors/base.error.js";
import { ErrorCode } from "../errors/error-codes.js";
import { logger } from "../shared/logger.js";

const { Pool } = pg;

export class DatabasePool {
  private readonly pool: pg.Pool;

  constructor(connectionString: string = env.DATABASE_URL) {
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    this.pool.on("connect", async (client: pg.PoolClient) => {
      try {
        await pgvector.registerType(client);
      } catch (error: unknown) {
        logger.error("Failed to register pgvector type on client connection", error);
      }
    });

    this.pool.on("error", (error: Error) => {
      logger.error("Unexpected database pool error", error);
    });
  }

  public async query<R extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params: readonly unknown[] = []
  ): Promise<pg.QueryResult<R>> {
    try {
      return await this.pool.query<R>(text, params as unknown[]);
    } catch (error: unknown) {
      const details: Record<string, unknown> = {
        query: text,
        paramsCount: params.length
      };
      if (error instanceof Error) {
        details["originalMessage"] = error.message;
      }
      throw new InfrastructureError("Database query execution failed", ErrorCode.DATABASE_QUERY_ERROR, details);
    }
  }

  public async getClient(): Promise<pg.PoolClient> {
    try {
      const client = await this.pool.connect();
      await pgvector.registerType(client);
      return client;
    } catch (error: unknown) {
      throw new InfrastructureError(
        "Failed to acquire database connection from pool",
        ErrorCode.DATABASE_CONNECTION_ERROR,
        error instanceof Error ? { message: error.message } : {}
      );
    }
  }

  public async withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error: unknown) {
      await client.query("ROLLBACK").catch((rollbackError: unknown) => {
        logger.error("Transaction rollback failed", rollbackError);
      });
      throw error;
    } finally {
      client.release();
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query("SELECT 1 AS alive");
      return (result.rows[0] as { alive: number } | undefined)?.alive === 1;
    } catch {
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new DatabasePool();
