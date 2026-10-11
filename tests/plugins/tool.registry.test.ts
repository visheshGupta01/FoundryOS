import { describe, it, expect, beforeEach } from "vitest";
import { ToolRegistry } from "../../src/backend/plugins/tool.registry.js";
import { webSearchPlugin } from "../../src/backend/plugins/builtin/web-search.plugin.js";
import { z } from "zod";

describe("ToolRegistry", () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it("should register and list tools", () => {
    registry.registerTool({
      name: "sample_tool",
      description: "Test tool description",
      parameters: z.object({ value: z.string() }),
      source: "builtin",
      execute: async (input) => ({ echo: input.value })
    });

    expect(registry.hasTool("sample_tool")).toBe(true);
    const tools = registry.listTools();
    expect(tools.length).toBe(1);
    expect(tools[0]?.name).toBe("sample_tool");
  });

  it("should execute registered tool with validation", async () => {
    registry.registerTool({
      name: "add_numbers",
      description: "Adds two numbers",
      parameters: z.object({ a: z.number(), b: z.number() }),
      source: "builtin",
      execute: async ({ a, b }) => a + b
    });

    const result = await registry.executeTool("add_numbers", { a: 5, b: 10 });
    expect(result.success).toBe(true);
    expect(result.data).toBe(15);
  });

  it("should fail validation gracefully on invalid inputs", async () => {
    registry.registerTool({
      name: "strictly_positive",
      description: "Requires positive number",
      parameters: z.object({ count: z.number().positive() }),
      source: "builtin",
      execute: async ({ count }) => count * 2
    });

    await expect(registry.executeTool("strictly_positive", { count: -5 })).rejects.toThrow();
  });

  it("should register plugins and prefix tool sources", () => {
    registry.registerPlugin(webSearchPlugin);
    expect(registry.hasTool("web_search")).toBe(true);
    expect(registry.hasTool("exa_search")).toBe(true);
    expect(registry.hasTool("fetch_page_content")).toBe(true);
    const tool = registry.getTool("web_search");
    expect(tool?.source).toBe("plugin:web-search-plugin");
  });
});
