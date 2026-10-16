import crypto from "node:crypto";

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  hashedSecret: string;
  tenantId: string;
  permissions: "full_access" | "read_only" | "restricted";
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreatedApiKeyResult {
  record: Omit<ApiKeyRecord, "hashedSecret">;
  rawSecretKey: string;
}

class ApiKeyStore {
  private readonly keys = new Map<string, ApiKeyRecord>();

  constructor() {
    this.seedDefaultKey();
  }

  private seedDefaultKey(): void {
    const rawKey = `fos_live_${crypto.randomBytes(16).toString("hex")}`;
    const keyPrefix = rawKey.slice(0, 14);
    const hashedSecret = this.hashKey(rawKey);

    const record: ApiKeyRecord = {
      id: "key-default-admin",
      name: "Default Admin Key",
      keyPrefix: `${keyPrefix}...`,
      hashedSecret,
      tenantId: "default-tenant",
      permissions: "full_access",
      expiresAt: null,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString()
    };

    this.keys.set(record.id, record);
  }

  private hashKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }

  public listKeys(tenantId: string): Array<Omit<ApiKeyRecord, "hashedSecret">> {
    const records: Array<Omit<ApiKeyRecord, "hashedSecret">> = [];
    for (const key of this.keys.values()) {
      if (key.tenantId === tenantId || tenantId === "default-tenant") {
        const { hashedSecret, ...safe } = key;
        records.push(safe);
      }
    }
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createKey(input: {
    name: string;
    tenantId: string;
    permissions?: "full_access" | "read_only" | "restricted" | undefined;
    expiryDays?: number | null | undefined;
  }): CreatedApiKeyResult {
    const rawSecret = `fos_live_${crypto.randomBytes(20).toString("hex")}`;
    const id = `key-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const keyPrefix = `${rawSecret.slice(0, 14)}...${rawSecret.slice(-4)}`;
    const hashedSecret = this.hashKey(rawSecret);

    const expiresAt = input.expiryDays
      ? new Date(Date.now() + input.expiryDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const record: ApiKeyRecord = {
      id,
      name: input.name.trim() || "Untitled API Key",
      keyPrefix,
      hashedSecret,
      tenantId: input.tenantId || "default-tenant",
      permissions: input.permissions || "full_access",
      expiresAt,
      createdAt: new Date().toISOString(),
      lastUsedAt: null
    };

    this.keys.set(id, record);

    const { hashedSecret: _, ...safeRecord } = record;
    return {
      record: safeRecord,
      rawSecretKey: rawSecret
    };
  }

  public revokeKey(id: string): boolean {
    return this.keys.delete(id);
  }

  public validateKey(rawKey: string): ApiKeyRecord | null {
    const hash = this.hashKey(rawKey);
    for (const record of this.keys.values()) {
      if (record.hashedSecret === hash) {
        if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
          return null;
        }
        record.lastUsedAt = new Date().toISOString();
        return record;
      }
    }
    return null;
  }
}

export const apiKeyStore = new ApiKeyStore();
