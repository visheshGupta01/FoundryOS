import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { env } from "./config/env.js";
import { logger } from "./shared/logger.js";
import { handleApiRoute } from "./routes/api.router.js";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const STATIC_DIR = existsSync(join(process.cwd(), "public"))
  ? join(process.cwd(), "public")
  : join(process.cwd(), "frontend");

async function handleStaticFile(reqPath: string, res: ServerResponse): Promise<void> {
  const safePath = reqPath === "/" ? "/index.html" : reqPath;
  const filePath = join(STATIC_DIR, safePath);

  if (!filePath.startsWith(STATIC_DIR) || !existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
    return;
  }

  try {
    const data = await readFile(filePath);
    const contentType = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (err: unknown) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("500 Internal Server Error");
  }
}

async function requestHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://localhost:${env.PORT}`);

  const handled = await handleApiRoute(req, res, url);
  if (handled) {
    return;
  }

  await handleStaticFile(url.pathname, res);
}

export function startServer(port: number = env.PORT) {
  const server = createServer(requestHandler);
  server.listen(port, () => {
    logger.info(`FoundryOS Marketing Operating System running on http://localhost:${port}`, { port, env: env.NODE_ENV });
  });
  return server;
}

startServer();
