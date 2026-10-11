import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { toolRegistry } from "../../plugins/tool.registry.js";

export function createMarketIntelMcpServer(): Server {
  const server = new Server(
    { name: "market-intelligence-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "web_search",
          description: "Free real-time web search for market trends, competitor insights, and industry news",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
              limit: { type: "number", description: "Max results (1-10)", default: 5 }
            },
            required: ["query"]
          }
        },
        {
          name: "exa_search",
          description: "Neural semantic search via Exa API with automatic DuckDuckGo fallback",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Semantic search query" },
              numResults: { type: "number", description: "Number of results", default: 5 }
            },
            required: ["query"]
          }
        },
        {
          name: "tech_trends",
          description: "Find real-time startup discussions and user sentiment from HackerNews and Reddit",
          inputSchema: {
            type: "object",
            properties: {
              topic: { type: "string", description: "Topic or keyword" },
              limit: { type: "number", description: "Max results", default: 5 }
            },
            required: ["topic"]
          }
        },
        {
          name: "fetch_page_content",
          description: "Fetch and clean text content from any public webpage or competitor URL",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "Full URL of webpage to extract" }
            },
            required: ["url"]
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = toolRegistry.getTool(name);

    if (tool) {
      const res = await tool.execute(args);
      return {
        content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown market intel tool: ${name}` }]
    };
  });

  return server;
}
