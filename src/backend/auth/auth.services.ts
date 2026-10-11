import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "../../databases/postgres.client.js";
import type { AuthUser, LoginRequest, LoginResponse } from "./auth.types.js";

interface StoredUser extends AuthUser {
    password_hash: string;
}

const activeTokens = new Map<string, AuthUser>();

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

export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
    const email = credentials.email.trim().toLowerCase();

    if (!email || !credentials.password) {
        return { success: false, error: "Email and password are required." };
    }

    const result = await db.query<StoredUser>(
        "SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = $1 LIMIT 1",
        [email]
    );
    const user = result.rows[0];

    if (!user || !verifyPassword(credentials.password, user.password_hash)) {
        return { success: false, error: "Invalid email or password." };
    }

    const publicUser: AuthUser = { id: user.id, name: user.name, email: user.email };
    const token = createHash("sha256")
        .update(`${user.id}:${Date.now()}:${randomBytes(24).toString("hex")}`)
        .digest("hex");

    activeTokens.set(token, publicUser);
    return { success: true, token, user: publicUser };
}

export function getUserFromToken(token: string | undefined): AuthUser | null {
    return token ? activeTokens.get(token) ?? null : null;
}

export function logoutUser(token: string | undefined): void {
    if (token) activeTokens.delete(token);
}

