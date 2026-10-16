import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "../../databases/postgres.client.js";
import { logger } from "../shared/logger.js";
import type { AuthUser, LoginRequest, LoginResponse, SignupRequest } from "./auth.types.js";

interface StoredUser extends AuthUser {
    password_hash: string;
}

const activeTokens = new Map<string, AuthUser>();
const inMemoryUsers = new Map<string, StoredUser>();

let isTableInitialized = false;

// Complex verification: uses constant-time byte comparison to prevent timing-attack vulnerability
function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, expectedKey] = storedHash.split(":");
    if (!salt || !expectedKey) return false;

    const actualKey = scryptSync(password, salt, 64).toString("hex");
    const expectedBuffer = Buffer.from(expectedKey, "hex");
    const actualBuffer = Buffer.from(actualKey, "hex");

    return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString("hex");
    return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function ensureUsersTable(): Promise<boolean> {
    if (isTableInitialized) return true;
    try {
        const isAlive = await db.healthCheck();
        if (!isAlive) return false;

        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
        `);
        isTableInitialized = true;
        return true;
    } catch (err) {
        logger.warn("Postgres users table auto-creation skipped, fallback enabled", { error: String(err) });
        return false;
    }
}

function issueSessionToken(user: AuthUser): string {
    const token = createHash("sha256")
        .update(`${user.id}:${Date.now()}:${randomBytes(24).toString("hex")}`)
        .digest("hex");
    activeTokens.set(token, user);
    return token;
}

export async function signupUser(payload: SignupRequest): Promise<LoginResponse> {
    const name = payload.name?.trim();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password;

    if (!name || name.length < 2) {
        return { success: false, error: "Please enter your full name (minimum 2 characters)." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return { success: false, error: "Please provide a valid email address." };
    }

    if (!password || password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters." };
    }

    const hasDb = await ensureUsersTable();
    if (hasDb) {
        try {
            const existing = await db.query<StoredUser>(
                "SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1",
                [email]
            );
            if (existing.rows.length > 0) {
                return { success: false, error: "An account with this email already exists." };
            }
        } catch {
            // fallback check
        }
    }

    if (inMemoryUsers.has(email)) {
        return { success: false, error: "An account with this email already exists." };
    }

    const userId = randomUUID();
    const password_hash = hashPassword(password);
    const publicUser: AuthUser = { id: userId, name, email };

    if (hasDb) {
        try {
            await db.query(
                "INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)",
                [userId, name, email, password_hash]
            );
        } catch (err) {
            logger.warn("Failed persisting user to database; saved to runtime session memory", { email, error: String(err) });
        }
    }

    inMemoryUsers.set(email, { ...publicUser, password_hash });
    const token = issueSessionToken(publicUser);

    return { success: true, token, user: publicUser };
}

export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
    const email = credentials.email?.trim().toLowerCase();
    const password = credentials.password;

    if (!email || !password) {
        return { success: false, error: "Email and password are required." };
    }

    let user: StoredUser | undefined;

    const hasDb = await ensureUsersTable();
    if (hasDb) {
        try {
            const result = await db.query<StoredUser>(
                "SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = $1 LIMIT 1",
                [email]
            );
            if (result.rows.length > 0) {
                user = result.rows[0];
            }
        } catch (err) {
            logger.warn("DB login query failed; attempting runtime memory lookup", { email, error: String(err) });
        }
    }

    if (!user) {
        user = inMemoryUsers.get(email);
    }

    if (!user || !verifyPassword(password, user.password_hash)) {
        return { success: false, error: "Invalid email or password." };
    }

    const publicUser: AuthUser = { id: user.id, name: user.name, email: user.email };
    const token = issueSessionToken(publicUser);

    return { success: true, token, user: publicUser };
}

export function getUserFromToken(token: string | undefined): AuthUser | null {
    return token ? activeTokens.get(token) ?? null : null;
}

export function logoutUser(token: string | undefined): void {
    if (token) activeTokens.delete(token);
}

export async function clearAllUsers(): Promise<{ clearedDb: boolean; clearedMemoryCount: number }> {
    const memoryCount = inMemoryUsers.size;
    inMemoryUsers.clear();
    activeTokens.clear();

    let clearedDb = false;
    try {
        const isAlive = await db.healthCheck();
        if (isAlive) {
            await db.query("TRUNCATE TABLE users CASCADE;");
            clearedDb = true;
        }
    } catch (err) {
        logger.warn("Postgres users truncate skipped", { error: String(err) });
    }

    return { clearedDb, clearedMemoryCount: memoryCount };
}
