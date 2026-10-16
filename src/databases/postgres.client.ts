import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import pgvector from "pgvector/pg";
import { env } from "../backend/config/env.js";
import { InfrastructureError } from "../backend/errors/base.error.js";
import { ErrorCode } from "../backend/errors/error-codes.js";
import { logger } from "../backend/shared/logger.js";

const { Pool } = pg;

export class DatabasePool {
  private readonly pool: pg.Pool;
  private isSchemaInitialized = false;

  constructor(connectionString: string = env.DATABASE_URL) {
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    this.pool.on("error", (error: Error) => {
      logger.error("Unexpected database pool error", error);
    });
  }

  public async ensureSchema(): Promise<boolean> {
    if (this.isSchemaInitialized) return true;
    try {
      const isAlive = await this.healthCheck();
      if (!isAlive) return false;

      const check = await this.pool.query(
        "SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' LIMIT 1;"
      );
      if (check.rows.length === 0) {
        const schemaPath = join(process.cwd(), "src", "databases", "schema.sql");
        if (existsSync(schemaPath)) {
          const sql = await readFile(schemaPath, "utf-8");
          await this.pool.query(sql);
          logger.info("PostgreSQL schema successfully auto-initialized with pgvector extension");
        }
      }
      this.isSchemaInitialized = true;
      return true;
    } catch (err: unknown) {
      logger.warn("Schema auto-initialization skipped or failed", { error: String(err) });
      return false;
    }
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
      try {
        if (typeof (pgvector as any).registerTypes === "function") {
          await (pgvector as any).registerTypes(client);
        } else if (typeof (pgvector as any).registerType === "function") {
          await (pgvector as any).registerType(client);
        }
      } catch {
        // Types already registered on connection
      }
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
