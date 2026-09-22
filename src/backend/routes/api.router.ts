import { type IncomingMessage, type ServerResponse } from "node:http";
import { employeeRegistry } from "../employees/employee.registry.js";
import { contextInspector } from "../../brain/context.inspector.js";
import { agentRunner } from "../agents/agent.runner.js";
import { flowEngine } from "../flows/flow.engine.js";
import { brainService } from "../../brain/brain.service.js";
import { brainRepository } from "../../brain/brain.repository.js";
import { updateActiveCompanyBrainState } from "../../brain/context.builder.js";
import { db } from "../../databases/postgres.client.js";
import { env } from "../config/env.js";
import { logger } from "../shared/logger.js";

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        reject(new Error("Request payload exceeds 2MB limit"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : ({} as T));
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}

export async function handleApiRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<boolean> {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return true;
  }

  if (url.pathname === "/api/health" && req.method === "GET") {
    const isDbAlive = await db.healthCheck();
    sendJson(res, 200, {
      status: "ok",
      service: "FoundryOS",
      edition: "AI Marketing Operating System",
      dbConnected: isDbAlive,
      env: env.NODE_ENV
    });
    return true;
  }

  if (url.pathname === "/api/employees" && req.method === "GET") {
    const employees = employeeRegistry.listEmployees();
    sendJson(res, 200, { employees });
    return true;
  }

  if (url.pathname === "/api/brain/overview" && req.method === "GET") {
    const tenantId = url.searchParams.get("tenantId") ?? "default-tenant";
    try {
      const health = await brainService.computeBrainHealth(tenantId);
      sendJson(res, 200, { tenantId, health });
    } catch (err: unknown) {
      sendJson(res, 500, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/brain/setup" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        tenantId?: string;
        name: string;
        website?: string;
        oneLiner: string;
        audience: string;
        problem: string;
        competitors: string;
        tone: string;
        avoidTone?: string;
        pricing?: string;
        goal?: string;
      }>(req);

      const tenantId = body.tenantId ?? "tenant-foundry-dev";

      // 1. Immediately update active runtime memory so agent runs and token inspector reflect it immediately
      updateActiveCompanyBrainState({
        name: body.name,
        website: body.website || "",
        oneLiner: body.oneLiner,
        audience: body.audience,
        problem: body.problem,
        competitors: body.competitors,
        tone: body.tone,
        avoidTone: body.avoidTone || "",
        pricing: body.pricing || "",
        goal: body.goal || ""
      });

      // 2. Persist to Postgres if alive
      try {
        await brainRepository.upsertCompanyProfile({
          tenantId,
          companyName: body.name,
          website: body.website || undefined,
          description: body.oneLiner,
          industry: "B2B Marketing Technology"
        });

        await brainRepository.upsertIcp({
          tenantId,
          customerType: body.audience,
          painPoints: [body.problem]
        });

        await brainRepository.upsertBrandProfile({
          tenantId,
          brandName: body.name,
          brandPositioning: body.oneLiner,
          tonePositive: body.tone ? body.tone.split(",").map((s) => s.trim()) : ["confident", "human"],
          toneAvoid: body.avoidTone ? body.avoidTone.split(",").map((s) => s.trim()) : []
        });

        if (body.competitors) {
          await brainRepository.upsertCompetitor({
            tenantId,
            name: body.competitors.split(",")[0]?.trim() || "Top Competitor",
            positioning: body.competitors
          });
        }
      } catch (dbErr) {
        logger.warn("Database storage deferred; updated active memory store", { error: String(dbErr) });
      }

      sendJson(res, 200, {
        status: "ok",
        message: `Company Brain updated with details for ${body.name}`,
        tenantId
      });
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/context/inspect" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        tenantId?: string;
        employeeId?: string;
        task?: string;
        maxTokenBudget?: number;
        reservedCompletionBudget?: number;
      }>(req);

      const tenantId = body.tenantId ?? "default-tenant";
      const employeeId = body.employeeId ?? "chief-marketing-strategist";
      const task = body.task ?? "Formulate core company positioning and ICP market strategy.";

      const options: { maxTokenBudget?: number; reservedCompletionBudget?: number } = {};
      if (typeof body.maxTokenBudget === "number") {
        options.maxTokenBudget = body.maxTokenBudget;
      }
      if (typeof body.reservedCompletionBudget === "number") {
        options.reservedCompletionBudget = body.reservedCompletionBudget;
      }

      const report = await contextInspector.inspectContext(tenantId, employeeId, task, options);

      sendJson(res, 200, report);
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/agents/run" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        tenantId?: string;
        employeeId?: string;
        task?: string;
        goalObjective?: string;
        attachedDocument?: { fileName: string; content: string };
      }>(req);

      const tenantId = body.tenantId ?? "default-tenant";
      const employeeId = body.employeeId && body.employeeId !== "auto" ? body.employeeId : undefined;
      const task = body.task ?? "Formulate core company positioning and value proposition.";

      const result = await agentRunner.run({
        tenantId,
        ...(employeeId ? { employeeId } : {}),
        task,
        goalObjective: body.goalObjective,
        attachedDocument: body.attachedDocument
      });

      sendJson(res, 200, result);
    } catch (err: unknown) {
      logger.error("Agent execution failed", { error: String(err) });
      sendJson(res, 500, { error: String(err) });
    }
    return true;
  }

  if (url.pathname.startsWith("/api/flows/") && url.pathname.endsWith("/approve") && req.method === "POST") {
    const parts = url.pathname.split("/");
    const flowId = parts[3];
    if (!flowId) {
      sendJson(res, 400, { error: "Missing flowId" });
      return true;
    }
    try {
      const body = await readJsonBody<{ approvedBy?: string }>(req);
      const updated = await flowEngine.approveStep(flowId, body.approvedBy ?? "founder");
      sendJson(res, 200, updated);
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  return false;
}
