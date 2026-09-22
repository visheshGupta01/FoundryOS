import { Redis, type RedisOptions } from "ioredis";
import { env } from "../backend/config/env.js";
import { logger } from "../backend/shared/logger.js";

export function createRedisConnection(customOptions: RedisOptions = {}): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    ...customOptions
  });

  client.on("error", (error: Error) => {
    logger.error("Redis connection error", error);
  });

  return client;
}

export class RedisService {
  private defaultClient: Redis | null = null;

  public getClient(): Redis {
    if (!this.defaultClient) {
      this.defaultClient = createRedisConnection();
    }
    return this.defaultClient;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const client = this.getClient();
      if (client.status === "wait") {
        await client.connect();
      }
      const pong = await client.ping();
      return pong === "PONG";
    } catch {
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.defaultClient) {
      await this.defaultClient.quit();
      this.defaultClient = null;
    }
  }
}

export const redisService = new RedisService();
