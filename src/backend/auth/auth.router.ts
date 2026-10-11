import { type IncomingMessage, type ServerResponse } from "node:http";
import { loginUser, getUserFromToken, logoutUser } from "./auth.services.js";
import type { LoginRequest } from "./auth.types.js";

type ReadJsonBody = <T>() => Promise<T>;
type SendJson = (res: ServerResponse, statusCode: number, data: unknown) => void;

function getBearerToken(req: IncomingMessage): string | undefined {
    const header = req.headers.authorization;
    return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

export async function handleAuthRoute(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL,
    readJsonBody: ReadJsonBody,
    sendJson: SendJson
): Promise<boolean> {
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
        try {
            const credentials = await readJsonBody<LoginRequest>();
            const result = await loginUser(credentials);
            sendJson(res, result.success ? 200 : 401, result);
        } catch {
            sendJson(res, 500, { success: false, error: "Authentication service unavailable." });
        }
        return true;
    }

    if (url.pathname === "/api/auth/me" && req.method === "GET") {
        const user = getUserFromToken(getBearerToken(req));
        sendJson(res, user ? 200 : 401, user ? { success: true, user } : { success: false, error: "Unauthorized." });
        return true;
    }

    if (url.pathname === "/api/auth/logout" && req.method === "POST") {
        logoutUser(getBearerToken(req));
        sendJson(res, 200, { success: true });
        return true;
    }

    return false;
}

