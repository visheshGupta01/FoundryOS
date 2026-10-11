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
import { creditService } from "../credits/credit.service.js";
import { toolRegistry } from "../plugins/tool.registry.js";
import { mcpManager } from "../mcp/mcp.manager.js";
import { documentStore } from "../documents/document.store.js";
import { hitlService } from "../hitl/hitl.service.js";
import { integrationStore } from "../integrations/integration.store.js";
import { DEMO_PROFILES, getDemoProfile } from "../config/demo-profiles.js";

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
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

  if (url.pathname === "/api/credits" && req.method === "GET") {
    const tenantId = url.searchParams.get("tenantId") ?? "default-tenant";
    const status = creditService.getCreditStatus(tenantId);
    sendJson(res, 200, status);
    return true;
  }

  if (url.pathname === "/api/credits/reset" && req.method === "POST") {
    try {
      const body = await readJsonBody<{ tenantId?: string }>(req);
      const tenantId = body.tenantId ?? "default-tenant";
      const status = creditService.resetCredits(tenantId);
      sendJson(res, 200, status);
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/tools" && req.method === "GET") {
    sendJson(res, 200, {
      tools: toolRegistry.listTools(),
      plugins: toolRegistry.listPlugins()
    });
    return true;
  }

  if (url.pathname === "/api/tools/execute" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        toolName: string;
        input: unknown;
        tenantId?: string;
        employeeId?: string;
      }>(req);

      if (!body.toolName) {
        sendJson(res, 400, { error: "Missing toolName" });
        return true;
      }

      const result = await toolRegistry.executeTool(body.toolName, body.input ?? {}, {
        tenantId: body.tenantId ?? "default-tenant",
        ...(body.employeeId ? { employeeId: body.employeeId } : {})
      });

      sendJson(res, result.success ? 200 : 500, result);
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/mcp/servers" && req.method === "GET") {
    sendJson(res, 200, {
      servers: mcpManager.listServers()
    });
    return true;
  }

  if (url.pathname === "/api/mcp/servers" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        id: string;
        name: string;
        description?: string;
        command: string;
        args?: string[];
        env?: Record<string, string>;
      }>(req);

      const info = await mcpManager.addStdioServer({
        id: body.id,
        name: body.name,
        description: body.description,
        transport: "stdio",
        command: body.command,
        args: body.args ?? [],
        env: body.env,
        autoStart: true
      });

      sendJson(res, 201, info);
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
        attachedDocuments?: Array<{ fileName: string; content: string }>;
        enableTools?: boolean;
      }>(req);

      const tenantId = body.tenantId ?? "default-tenant";
      const employeeId = body.employeeId && body.employeeId !== "auto" ? body.employeeId : undefined;
      const task = body.task ?? "Formulate core company positioning and value proposition.";

      const result = await agentRunner.run({
        tenantId,
        ...(employeeId ? { employeeId } : {}),
        task,
        goalObjective: body.goalObjective,
        attachedDocument: body.attachedDocument,
        attachedDocuments: body.attachedDocuments,
        enableTools: body.enableTools ?? true
      });

      sendJson(res, 200, result);
    } catch (err: unknown) {
      logger.error("Agent execution failed", { error: String(err) });
      const statusCode = (err as any)?.httpStatus || 500;
      sendJson(res, statusCode, { error: String(err) });
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

  if (url.pathname === "/api/hitl/pending" && req.method === "GET") {
    const tenantId = url.searchParams.get("tenantId") ?? "default-tenant";
    const pending = hitlService.listApprovals(tenantId, "pending");
    sendJson(res, 200, { approvals: pending });
    return true;
  }

  if (url.pathname === "/api/hitl/approvals" && req.method === "GET") {
    const tenantId = url.searchParams.get("tenantId") ?? "default-tenant";
    const statusParam = url.searchParams.get("status");
    const status = statusParam === "all" || !statusParam ? undefined : (statusParam as "pending" | "approved" | "rejected");
    const approvals = hitlService.listApprovals(tenantId, status);
    sendJson(res, 200, { approvals });
    return true;
  }

  if (url.pathname === "/api/profiles/demo" && req.method === "GET") {
    sendJson(res, 200, { profiles: DEMO_PROFILES });
    return true;
  }

  if (url.pathname === "/api/profiles/apply" && req.method === "POST") {
    try {
      const body = await readJsonBody<{ profileId: string; tenantId?: string }>(req);
      const profile = getDemoProfile(body.profileId);
      if (!profile) {
        sendJson(res, 404, { error: `Demo profile not found: ${body.profileId}` });
        return true;
      }

      const tenantId = body.tenantId ?? "default-tenant";

      updateActiveCompanyBrainState({
        name: profile.name,
        website: profile.website,
        oneLiner: profile.oneLiner,
        audience: profile.audience,
        problem: profile.problem,
        competitors: profile.competitors,
        tone: profile.tone,
        avoidTone: profile.avoidTone,
        pricing: profile.pricing,
        goal: profile.goal
      });

      try {
        await brainRepository.upsertCompanyProfile({
          tenantId,
          companyName: profile.name,
          website: profile.website,
          description: profile.oneLiner,
          industry: profile.industry
        });
        await brainRepository.upsertIcp({
          tenantId,
          customerType: profile.audience,
          painPoints: [profile.problem]
        });
        await brainRepository.upsertBrandProfile({
          tenantId,
          brandName: profile.name,
          brandPositioning: profile.oneLiner,
          tonePositive: profile.tone.split(",").map((s) => s.trim()),
          toneAvoid: profile.avoidTone.split(",").map((s) => s.trim())
        });
      } catch {
        // Fallback gracefully if database client is offline
      }

      sendJson(res, 200, {
        success: true,
        message: `Company Brain updated to ${profile.name}`,
        profile
      });
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/webhooks/trigger" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        event?: string;
        tenantId?: string;
        employeeId?: string;
        task?: string;
        payload?: Record<string, unknown>;
      }>(req);

      const tenantId = body.tenantId ?? "default-tenant";
      const employeeId = body.employeeId || "auto";
      const task = body.task || `Inbound webhook event [${body.event || "automated_trigger"}]. Analyze payload and synthesize operational response: ${JSON.stringify(body.payload || {})}`;

      const result = await agentRunner.run({
        tenantId,
        employeeId: employeeId !== "auto" ? employeeId : undefined,
        task
      });

      sendJson(res, 200, {
        received: true,
        event: body.event || "custom_trigger",
        executionId: result.executionId,
        employeeId: result.employeeId,
        result: result.output,
        pendingApproval: result.pendingApproval
      });
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/hitl/decision" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        approvalId: string;
        decision: "approve" | "reject";
        reviewer?: string;
        comment?: string;
        selectedOptionId?: string;
        customAnswer?: string;
      }>(req);

      if (!body.approvalId || !body.decision) {
        sendJson(res, 400, { error: "Missing approvalId or decision" });
        return true;
      }

      const updated = await hitlService.resolveApproval(
        body.approvalId,
        body.decision,
        body.reviewer ?? "founder",
        body.comment,
        body.selectedOptionId,
        body.customAnswer
      );

      sendJson(res, 200, { success: true, approval: updated });
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/documents" && req.method === "GET") {
    const tenantId = url.searchParams.get("tenantId") ?? "default-tenant";
    const category = url.searchParams.get("category") as any;
    const query = url.searchParams.get("query") || undefined;
    const docs = documentStore.listDocuments(tenantId, category, query);
    sendJson(res, 200, { documents: docs });
    return true;
  }

  if (url.pathname === "/api/documents/upload" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        tenantId?: string;
        title: string;
        fileName: string;
        content: string;
        category?: "uploaded" | "generated" | "pdf";
        summary?: string;
        metadata?: Record<string, unknown>;
      }>(req);

      const doc = documentStore.archiveDocument({
        tenantId: body.tenantId ?? "default-tenant",
        title: body.title,
        fileName: body.fileName,
        content: body.content,
        category: body.category || "uploaded",
        ...(body.summary ? { summary: body.summary } : {}),
        ...(body.metadata ? { metadata: body.metadata } : {})
      });

      sendJson(res, 201, doc);
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/documents/generate-pdf" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        tenantId?: string;
        title: string;
        subtitle?: string;
        author?: string;
        content: string;
        sections?: Array<{ heading: string; body: string; bullets?: string[] }>;
      }>(req);

      const { document } = documentStore.generateAndArchivePdf({
        tenantId: body.tenantId ?? "default-tenant",
        title: body.title,
        ...(body.subtitle ? { subtitle: body.subtitle } : {}),
        author: body.author || "FoundryOS Agent",
        content: body.content,
        ...(body.sections ? { sections: body.sections } : {})
      });

      sendJson(res, 201, document);
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname.startsWith("/api/documents/") && req.method === "GET") {
    const parts = url.pathname.split("/");
    const id = parts[3];

    if (!id) {
      sendJson(res, 400, { error: "Missing document id" });
      return true;
    }

    const doc = documentStore.getDocument(id);
    if (!doc) {
      sendJson(res, 404, { error: "Document not found" });
      return true;
    }

    if (parts[4] === "download") {
      if (doc.category === "pdf" || doc.metadata.mimeType === "application/pdf") {
        const buffer = Buffer.from(doc.content, "base64");
        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${doc.fileName}"`,
          "Content-Length": buffer.length
        });
        res.end(buffer);
      } else {
        const buffer = Buffer.from(doc.content, "utf-8");
        res.writeHead(200, {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${doc.fileName}"`,
          "Content-Length": buffer.length
        });
        res.end(buffer);
      }
      return true;
    }

    sendJson(res, 200, doc);
    return true;
  }

  if (url.pathname.startsWith("/api/documents/") && req.method === "DELETE") {
    const parts = url.pathname.split("/");
    const id = parts[3];

    if (!id) {
      sendJson(res, 400, { error: "Missing document id" });
      return true;
    }

    const success = documentStore.deleteDocument(id);
    sendJson(res, success ? 200 : 404, { success, id });
    return true;
  }

  if (url.pathname === "/api/integrations" && req.method === "GET") {
    const tenantId = url.searchParams.get("tenantId") ?? "default-tenant";
    const status = integrationStore.getStatus(tenantId);
    sendJson(res, 200, status);
    return true;
  }

  if (url.pathname === "/api/integrations/slack" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        tenantId?: string;
        botToken: string;
        defaultChannel?: string;
        signingSecret?: string;
      }>(req);

      const tenantId = body.tenantId ?? "default-tenant";
      const result = await integrationStore.configureSlack(tenantId, {
        botToken: body.botToken,
        defaultChannel: body.defaultChannel || "#marketing",
        ...(body.signingSecret ? { signingSecret: body.signingSecret } : {})
      });

      sendJson(res, 200, result);
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/integrations/slack" && req.method === "DELETE") {
    const tenantId = url.searchParams.get("tenantId") ?? "default-tenant";
    const disconnected = integrationStore.disconnectSlack(tenantId);
    sendJson(res, 200, { success: disconnected });
    return true;
  }

  if (url.pathname === "/api/integrations/drive" && req.method === "POST") {
    try {
      const body = await readJsonBody<{
        tenantId?: string;
        accessToken?: string;
        apiKey?: string;
        folderName?: string;
      }>(req);

      const tenantId = body.tenantId ?? "default-tenant";
      const result = await integrationStore.configureDrive(tenantId, {
        ...(body.accessToken ? { accessToken: body.accessToken } : {}),
        ...(body.apiKey ? { apiKey: body.apiKey } : {}),
        ...(body.folderName ? { folderName: body.folderName } : {})
      });

      sendJson(res, 200, result);
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/integrations/drive" && req.method === "DELETE") {
    const tenantId = url.searchParams.get("tenantId") ?? "default-tenant";
    const disconnected = integrationStore.disconnectDrive(tenantId);
    sendJson(res, 200, { success: disconnected });
    return true;
  }

  if (url.pathname === "/api/integrations/test/slack" && req.method === "POST") {
    try {
      const body = await readJsonBody<{ botToken: string }>(req);
      const test = await integrationStore.testSlack(body.botToken || "");
      sendJson(res, 200, test);
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  if (url.pathname === "/api/integrations/test/drive" && req.method === "POST") {
    try {
      const body = await readJsonBody<{ accessToken?: string; apiKey?: string }>(req);
      const test = await integrationStore.testDrive(body.accessToken, body.apiKey);
      sendJson(res, 200, test);
    } catch (err: unknown) {
      sendJson(res, 400, { error: String(err) });
    }
    return true;
  }

  return false;
}
