import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { McpManager } from "../../src/backend/mcp/mcp.manager.js";
import { toolRegistry } from "../../src/backend/plugins/tool.registry.js";

describe("MCP Multi-Server Integration", () => {
  let manager: McpManager;

  beforeAll(async () => {
    manager = new McpManager();
    await manager.initialize();
  });

  afterAll(async () => {
    await manager.shutdown();
  });

  it("should mount all 6 specialized verified MCP servers", () => {
    const servers = manager.listServers();
    expect(servers.length).toBe(6);

    const ids = servers.map((s) => s.id);
    expect(ids).toContain("market-intel-mcp");
    expect(ids).toContain("seo-competitor-mcp");
    expect(ids).toContain("growth-gtm-mcp");
    expect(ids).toContain("foundry-brain-mcp");
    expect(ids).toContain("document-archive-mcp");
    expect(ids).toContain("integration-hub-mcp");
  });

  it("should register tools across all 4 servers in toolRegistry", () => {
    expect(toolRegistry.hasTool("web_search")).toBe(true);
    expect(toolRegistry.hasTool("keyword_suggester")).toBe(true);
    expect(toolRegistry.hasTool("cac_ltv_calculator")).toBe(true);
    expect(toolRegistry.hasTool("query_brain_context")).toBe(true);
  });

  it("should execute keyword_suggester tool through MCP client", async () => {
    const res = await toolRegistry.executeTool("keyword_suggester", {
      seedTopic: "ai marketing"
    });

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    const data = res.data as any;
    expect(data.suggestions.length).toBeGreaterThan(0);
    expect(data.suggestions[0].keyword).toContain("ai marketing");
  });

  it("should execute cac_ltv_calculator tool through MCP client", async () => {
    const res = await toolRegistry.executeTool("cac_ltv_calculator", {
      arpuMonthly: 120,
      cac: 360,
      churnRateMonthly: 0.02
    });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.metrics.ltvCacRatio).toBeDefined();
    expect(data.assessment).toBe("exceptional");
  });

  it("should execute value_prop_evaluator tool through MCP client", async () => {
    const res = await toolRegistry.executeTool("value_prop_evaluator", {
      statement: "The revolutionary and disruptive next-gen platform for synergy."
    });

    expect(res.success).toBe(true);
    const data = res.data as any;
    expect(data.detectedBuzzwords.length).toBeGreaterThan(0);
  });
});
