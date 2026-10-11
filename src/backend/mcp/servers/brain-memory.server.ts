import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getActiveCompanyBrainState } from "../../../brain/context.builder.js";
import { brainService } from "../../../brain/brain.service.js";
import { semanticMemory } from "../../../brain/semantic-memory.js";

export function createBrainMemoryMcpServer(): Server {
  const server = new Server(
    { name: "foundry-brain-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "query_brain_context",
          description: "Read persistent Company Brain profile, ICPs, competitors, and tone rules",
          inputSchema: {
            type: "object",
            properties: {
              tenantId: { type: "string", description: "Tenant workspace ID", default: "default-tenant" }
            }
          }
        },
        {
          name: "propose_brain_memory",
          description: "Propose a validated marketing learning or strategic hypothesis to Company Brain",
          inputSchema: {
            type: "object",
            properties: {
              tenantId: { type: "string", description: "Tenant ID", default: "default-tenant" },
              statement: { type: "string", description: "Factual insight or learning" },
              rationale: { type: "string", description: "Supporting rationale or data points" },
              confidenceLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], default: "HIGH" }
            },
            required: ["statement", "rationale"]
          }
        },
        {
          name: "semantic_memory_search",
          description: "Perform cosine similarity semantic vector search over company documents, research briefs, and institutional memory",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Natural language search query" },
              limit: { type: "number", description: "Max results to return", default: 4 },
              minSimilarity: { type: "number", description: "Minimum cosine similarity threshold (0-1)", default: 0.25 }
            },
            required: ["query"]
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "query_brain_context") {
      const state = getActiveCompanyBrainState();
      return {
        content: [{ type: "text", text: JSON.stringify(state, null, 2) }]
      };
    }

    if (name === "propose_brain_memory") {
      const tenantId = String(args?.["tenantId"] || "default-tenant");
      const statement = String(args?.["statement"] || "");
      const rationale = String(args?.["rationale"] || "");
      const confidence = (args?.["confidenceLevel"] as any) || "HIGH";

      const memoryId = await brainService.proposeMemory({
        tenantId,
        memoryType: "learning",
        statement,
        rationale,
        confidenceLevel: confidence
      });

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, memoryId, status: "proposed" }, null, 2) }]
      };
    }

    if (name === "semantic_memory_search") {
      const query = String(args?.["query"] || "");
      const limit = typeof args?.["limit"] === "number" ? args["limit"] : 4;
      const minSimilarity = typeof args?.["minSimilarity"] === "number" ? args["minSimilarity"] : 0.25;

      const results = await semanticMemory.search(query, {
        limit,
        minSimilarity
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query,
                matchCount: results.length,
                matches: results.map((r) => ({
                  title: r.item.title,
                  sourceType: r.item.sourceType,
                  similarity: Number(r.similarity.toFixed(3)),
                  content: r.item.content
                }))
              },
              null,
              2
            )
          }
        ]
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown brain memory tool: ${name}` }]
    };
  });

  return server;
}
