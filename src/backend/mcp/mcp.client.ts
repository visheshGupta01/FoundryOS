import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { McpServerConfig, McpServerInfo } from "./mcp.types.js";
import { toolRegistry } from "../plugins/tool.registry.js";
import { logger } from "../shared/logger.js";

export class McpClientWrapper {
  private client: Client | null = null;
  private stdioTransport: StdioClientTransport | null = null;
  private serverInfo: McpServerInfo;
  private readonly config: McpServerConfig;
  private registeredToolNames: string[] = [];

  constructor(config: McpServerConfig) {
    this.config = config;
    this.serverInfo = {
      id: config.id,
      name: config.name,
      ...(config.description ? { description: config.description } : {}),
      transport: config.transport ?? "stdio",
      status: "disconnected",
      toolCount: 0,
      tools: []
    };
  }

  public getInfo(): McpServerInfo {
    return { ...this.serverInfo };
  }

  public async connectInMemory(server: Server): Promise<McpServerInfo> {
    try {
      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      await server.connect(serverTransport);

      this.client = new Client(
        { name: `foundry-${this.config.id}-client`, version: "1.0.0" },
        { capabilities: {} }
      );

      await this.client.connect(clientTransport);
      await this.discoverAndRegisterTools();

      this.serverInfo.status = "connected";
      this.serverInfo.connectedAt = new Date().toISOString();
      logger.info(`Connected to in-memory MCP server: ${this.config.name} (${this.serverInfo.toolCount} tools)`);
      return this.getInfo();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.serverInfo.status = "error";
      this.serverInfo.lastError = msg;
      logger.error(`Failed to connect in-memory MCP server: ${this.config.name}`, { error: msg });
      throw err;
    }
  }

  public async connectStdio(): Promise<McpServerInfo> {
    if (!this.config.command) {
      throw new Error(`MCP server ${this.config.id} is missing 'command' for stdio transport`);
    }

    try {
      const cleanEnv: Record<string, string> = {};
      for (const [k, v] of Object.entries(process.env)) {
        if (typeof v === "string") cleanEnv[k] = v;
      }
      if (this.config.env) {
        Object.assign(cleanEnv, this.config.env);
      }

      this.stdioTransport = new StdioClientTransport({
        command: this.config.command,
        ...(this.config.args ? { args: this.config.args } : {}),
        env: cleanEnv
      });

      this.client = new Client(
        { name: `foundry-${this.config.id}-client`, version: "1.0.0" },
        { capabilities: {} }
      );

      await this.client.connect(this.stdioTransport);
      await this.discoverAndRegisterTools();

      this.serverInfo.status = "connected";
      this.serverInfo.connectedAt = new Date().toISOString();
      logger.info(`Connected to stdio MCP server: ${this.config.name} (${this.serverInfo.toolCount} tools)`);
      return this.getInfo();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.serverInfo.status = "error";
      this.serverInfo.lastError = msg;
      logger.error(`Failed to connect stdio MCP server: ${this.config.name}`, { error: msg });
      throw err;
    }
  }

  private async discoverAndRegisterTools(): Promise<void> {
    if (!this.client) return;

    const listRes = await this.client.listTools();
    const tools = listRes.tools || [];

    this.serverInfo.toolCount = tools.length;
    this.serverInfo.tools = tools.map((t) => t.name);

    for (const tool of tools) {
      const toolName = tool.name;
      this.registeredToolNames.push(toolName);

      if (toolRegistry.hasTool(toolName)) {
        continue;
      }

      toolRegistry.registerTool({
        name: toolName,
        description: tool.description || `Tool from MCP server ${this.config.name}`,
        parameters: (tool.inputSchema as any) || {},
        source: `mcp:${this.config.id}`,
        execute: async (input) => {
          if (!this.client) throw new Error(`MCP Client for ${this.config.id} is not connected`);
          const callRes = await this.client.callTool({
            name: toolName,
            arguments: (input as Record<string, unknown>) || {}
          });

          const rawContent: any[] = Array.isArray(callRes.content) ? (callRes.content as any[]) : [];
          if (callRes.isError) {
            const errText = rawContent
              .filter((c: any) => c.type === "text")
              .map((c: any) => String(c.text || ""))
              .join("\n");
            throw new Error(`MCP tool ${toolName} error: ${errText}`);
          }

          const textParts = rawContent
            .filter((c: any) => c.type === "text")
            .map((c: any) => String(c.text || ""));

          const firstPart = textParts[0];
          if (textParts.length === 1 && typeof firstPart === "string") {
            try {
              return JSON.parse(firstPart);
            } catch {
              return firstPart;
            }
          }
          return textParts.join("\n\n");
        }
      });
    }
  }

  public async disconnect(): Promise<void> {
    for (const toolName of this.registeredToolNames) {
      toolRegistry.unregisterTool(toolName);
    }
    this.registeredToolNames = [];

    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    if (this.stdioTransport) {
      await this.stdioTransport.close();
      this.stdioTransport = null;
    }

    this.serverInfo.status = "disconnected";
    this.serverInfo.toolCount = 0;
    this.serverInfo.tools = [];
  }
}
