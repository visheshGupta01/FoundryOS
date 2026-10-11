import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { toolRegistry } from "../../plugins/tool.registry.js";
import { documentStore } from "../../documents/document.store.js";

export function createDocumentArchiveMCPServer(): Server {
  const server = new Server(
    { name: "document-archive-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "pdf_archive_generate",
          description: "Generate a formatted PDF report and archive it in the company document vault.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Document title" },
              subtitle: { type: "string", description: "Subtitle/header" },
              content: { type: "string", description: "Report markdown content" },
              author: { type: "string", description: "Author name" }
            },
            required: ["title", "content"]
          }
        },
        {
          name: "document_archive_list",
          description: "List uploaded, generated, or PDF documents in the company archive vault.",
          inputSchema: {
            type: "object",
            properties: {
              category: { type: "string", enum: ["all", "uploaded", "generated", "pdf"] },
              query: { type: "string", description: "Optional filter search query" }
            }
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "pdf_archive_generate" && args) {
      const title = String(args["title"] || "Report");
      const content = String(args["content"] || "");
      const subtitle = args["subtitle"] ? String(args["subtitle"]) : undefined;
      const author = args["author"] ? String(args["author"]) : "FoundryOS Agent";

      const { document } = documentStore.generateAndArchivePdf({
        title,
        content,
        ...(subtitle ? { subtitle } : {}),
        author
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "success",
              documentId: document.id,
              fileName: document.fileName,
              downloadUrl: `/api/documents/${document.id}/download`
            })
          }
        ]
      };
    }

    if (name === "document_archive_list") {
      const category = args && args["category"] ? (String(args["category"]) as any) : "all";
      const query = args && args["query"] ? String(args["query"]) : undefined;

      const docs = documentStore.listDocuments("default-tenant", category, query);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: docs.length,
              documents: docs.map((d) => ({
                id: d.id,
                title: d.title,
                category: d.category,
                fileName: d.fileName,
                summary: d.summary,
                createdAt: d.createdAt
              }))
            })
          }
        ]
      };
    }

    const tool = toolRegistry.getTool(name);
    if (tool) {
      const res = await tool.execute(args);
      return {
        content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown document archive tool: ${name}` }]
    };
  });

  return server;
}
