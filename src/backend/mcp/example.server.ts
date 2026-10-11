import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "custom-marketing-mcp",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_tagline",
        description: "Generate 3 high-converting marketing taglines for a product",
        inputSchema: {
          type: "object",
          properties: {
            productName: { type: "string", description: "Name of the product" },
            targetAudience: { type: "string", description: "Target audience" }
          },
          required: ["productName", "targetAudience"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "generate_tagline") {
    const prod = String(args?.["productName"] || "Product");
    const aud = String(args?.["targetAudience"] || "founders");

    const taglines = [
      `${prod}: The unfair advantage for ${aud}.`,
      `Stop wasting hours. Let ${prod} do the heavy lifting.`,
      `The easiest way for ${aud} to scale without complexity.`
    ];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ productName: prod, audience: aud, taglines }, null, 2)
        }
      ]
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Unknown tool: ${name}` }]
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1]?.endsWith("example.server.ts") || process.argv[1]?.endsWith("example.server.js")) {
  main().catch((err) => {
    process.stderr.write(`Fatal MCP server error: ${String(err)}\n`);
    process.exit(1);
  });
}
