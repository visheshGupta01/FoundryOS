import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type {
  ToolDefinition,
  PluginDefinition,
  ToolExecutionContext,
  ToolExecutionResult
} from "./tool.types.js";
import { ValidationError, NotFoundError } from "../errors/base.error.js";
import { logger } from "../shared/logger.js";

export class ToolRegistry {
  private readonly tools: Map<string, ToolDefinition> = new Map();
  private readonly plugins: Map<string, PluginDefinition> = new Map();

  public registerTool(tool: ToolDefinition): void {
    if (!tool.name || typeof tool.name !== "string") {
      throw new ValidationError("Tool name must be a non-empty string");
    }
    this.tools.set(tool.name, tool);
    logger.debug(`Registered tool: ${tool.name} [${tool.source}]`);
  }

  public registerPlugin(plugin: PluginDefinition): void {
    this.plugins.set(plugin.id, plugin);
    for (const tool of plugin.tools) {
      this.registerTool({
        ...tool,
        source: tool.source || `plugin:${plugin.id}`
      });
    }
    logger.info(`Registered plugin: ${plugin.name} (${plugin.id}) with ${plugin.tools.length} tools`);
  }

  public unregisterTool(name: string): boolean {
    return this.tools.delete(name);
  }

  public unregisterToolsBySourcePrefix(prefix: string): number {
    let count = 0;
    for (const [name, tool] of this.tools.entries()) {
      if (tool.source.startsWith(prefix)) {
        this.tools.delete(name);
        count++;
      }
    }
    return count;
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  public listTools(): Array<{
    name: string;
    description: string;
    source: string;
    parameters: unknown;
  }> {
    const list: Array<{
      name: string;
      description: string;
      source: string;
      parameters: unknown;
    }> = [];

    for (const tool of this.tools.values()) {
      let schema: unknown;
      if (tool.parameters instanceof z.ZodType) {
        schema = zodToJsonSchema(tool.parameters);
      } else {
        schema = tool.parameters;
      }

      list.push({
        name: tool.name,
        description: tool.description,
        source: tool.source,
        parameters: schema
      });
    }

    return list;
  }

  public listPlugins(): Array<{
    id: string;
    name: string;
    description: string;
    version: string;
    toolCount: number;
  }> {
    return Array.from(this.plugins.values()).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      version: p.version,
      toolCount: p.tools.length
    }));
  }

  public async executeTool(
    name: string,
    rawInput: unknown,
    context?: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      throw new NotFoundError(`Tool '${name}' is not registered`);
    }

    let parsedInput = rawInput;
    if (tool.parameters instanceof z.ZodType) {
      const parsed = tool.parameters.safeParse(rawInput);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
        throw new ValidationError(`Input validation failed for tool '${name}': ${issues}`);
      }
      parsedInput = parsed.data;
    }

    try {
      const result = await tool.execute(parsedInput, context);
      return {
        toolName: name,
        success: true,
        data: result,
        durationMs: Date.now() - startTime
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Error executing tool '${name}'`, { error: errorMsg });
      return {
        toolName: name,
        success: false,
        error: errorMsg,
        durationMs: Date.now() - startTime
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
