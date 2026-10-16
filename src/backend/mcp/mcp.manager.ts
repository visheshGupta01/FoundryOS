import { McpClientWrapper } from "./mcp.client.js";
import type { McpServerConfig, McpServerInfo } from "./mcp.types.js";
import { createMarketIntelMcpServer } from "./servers/market-intel.server.js";
import { createSeoAuditMcpServer } from "./servers/seo-audit.server.js";
import { createGrowthGtmMcpServer } from "./servers/growth-gtm.server.js";
import { createBrainMemoryMcpServer } from "./servers/brain-memory.server.js";
import { createDocumentArchiveMCPServer } from "./servers/document-archive.server.js";
import { createIntegrationHubMCPServer } from "./servers/integration-hub.server.js";
import { logger } from "../shared/logger.js";

export class McpManager {
  private readonly clients: Map<string, McpClientWrapper> = new Map();
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const marketIntel = new McpClientWrapper({
      id: "market-intel-mcp",
      name: "Market Intelligence MCP Server",
      description: "Live web search, Exa neural fallback, HackerNews/Reddit trend extraction, and page scraper",
      transport: "in-memory"
    });
    await marketIntel.connectInMemory(createMarketIntelMcpServer());
    this.clients.set("market-intel-mcp", marketIntel);

    const seoAudit = new McpClientWrapper({
      id: "seo-competitor-mcp",
      name: "SEO & Competitor Audit MCP Server",
      description: "Keyword suggestion engine, meta tag auditor, and competitor pricing model audit",
      transport: "in-memory"
    });
    await seoAudit.connectInMemory(createSeoAuditMcpServer());
    this.clients.set("seo-competitor-mcp", seoAudit);

    const growthGtm = new McpClientWrapper({
      id: "growth-gtm-mcp",
      name: "Growth & GTM Analytics MCP Server",
      description: "CAC/LTV calculator, funnel conversion benchmarks, and value proposition evaluator",
      transport: "in-memory"
    });
    await growthGtm.connectInMemory(createGrowthGtmMcpServer());
    this.clients.set("growth-gtm-mcp", growthGtm);

    const brainMemory = new McpClientWrapper({
      id: "foundry-brain-mcp",
      name: "Foundry Brain Memory MCP Server",
      description: "Persistent Company Brain context inspection, semantic search, and memory proposing",
      transport: "in-memory"
    });
    await brainMemory.connectInMemory(createBrainMemoryMcpServer());
    this.clients.set("foundry-brain-mcp", brainMemory);

    const docArchive = new McpClientWrapper({
      id: "document-archive-mcp",
      name: "Document Archive & PDF Generation MCP Server",
      description: "PDF report creation, document vault storage, search, and export engine",
      transport: "in-memory"
    });
    await docArchive.connectInMemory(createDocumentArchiveMCPServer());
    this.clients.set("document-archive-mcp", docArchive);

    const integrationHub = new McpClientWrapper({
      id: "integration-hub-mcp",
      name: "Workspace Integration Hub MCP Server",
      description: "Slack/Discord notifications, GitHub changelog sync, and universal integration health audits",
      transport: "in-memory"
    });
    await integrationHub.connectInMemory(createIntegrationHubMCPServer());
    this.clients.set("integration-hub-mcp", integrationHub);

    this.initialized = true;
    logger.info(`FoundryOS Multi-MCP Server Suite initialized (${this.clients.size} verified servers active)`);
  }

  public async addStdioServer(config: McpServerConfig): Promise<McpServerInfo> {
    if (this.clients.has(config.id)) {
      throw new Error(`MCP server with id '${config.id}' already exists`);
    }

    const client = new McpClientWrapper(config);
    await client.connectStdio();
    this.clients.set(config.id, client);
    return client.getInfo();
  }

  public async removeServer(id: string): Promise<boolean> {
    const client = this.clients.get(id);
    if (!client) return false;
    await client.disconnect();
    this.clients.delete(id);
    return true;
  }

  public listServers(): McpServerInfo[] {
    return Array.from(this.clients.values()).map((c) => c.getInfo());
  }

  public getServer(id: string): McpServerInfo | undefined {
    return this.clients.get(id)?.getInfo();
  }

  public async shutdown(): Promise<void> {
    for (const client of this.clients.values()) {
      await client.disconnect();
    }
    this.clients.clear();
    this.initialized = false;
  }
}

export const mcpManager = new McpManager();
