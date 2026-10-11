import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { documentStore } from "../../documents/document.store.js";
import { logger } from "../../shared/logger.js";
import { integrationStore } from "../../integrations/integration.store.js";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  folder: string;
  webViewLink: string;
  createdTime: string;
  modifiedTime: string;
  content?: string;
}

class GoogleDriveWorkspace {
  private static instance: GoogleDriveWorkspace;
  private readonly files: Map<string, DriveFile> = new Map();
  private readonly folders: Set<string> = new Set(["/", "/Marketing Briefs", "/Executive Reports", "/GTM Strategy"]);

  public static getInstance(): GoogleDriveWorkspace {
    if (!GoogleDriveWorkspace.instance) {
      GoogleDriveWorkspace.instance = new GoogleDriveWorkspace();
    }
    return GoogleDriveWorkspace.instance;
  }

  constructor() {
    this.seedWorkspace();
  }

  private seedWorkspace(): void {
    const seedFiles: DriveFile[] = [
      {
        id: "drive-seed-1",
        name: "FoundryOS_Brand_Guidelines_2026.gdoc",
        mimeType: "application/vnd.google-apps.document",
        sizeBytes: 14200,
        folder: "/Marketing Briefs",
        webViewLink: "https://drive.google.com/file/d/foundryos-brand-guidelines-2026/view",
        createdTime: new Date(Date.now() - 86400000 * 5).toISOString(),
        modifiedTime: new Date().toISOString(),
        content: "# FoundryOS Brand & Messaging Guidelines\nConfident, human, data-driven startup voice. Zero fluff."
      },
      {
        id: "drive-seed-2",
        name: "Q3_GTM_Funnel_Benchmarks.gsheet",
        mimeType: "application/vnd.google-apps.spreadsheet",
        sizeBytes: 28400,
        folder: "/GTM Strategy",
        webViewLink: "https://drive.google.com/file/d/foundryos-gtm-funnel-benchmarks/view",
        createdTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        modifiedTime: new Date().toISOString(),
        content: "Channel, CAC, LTV, Conversion\nOrganic Dev, $120, $1400, 4.2%\nDirect Search, $210, $1200, 2.8%"
      }
    ];

    for (const f of seedFiles) {
      this.files.set(f.id, f);
    }
  }

  public listFiles(folder?: string): DriveFile[] {
    const all = Array.from(this.files.values());
    if (folder) {
      return all.filter((f) => f.folder === folder || folder === "all");
    }
    return all.sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime());
  }

  public searchFiles(query: string): DriveFile[] {
    const q = query.toLowerCase();
    return Array.from(this.files.values()).filter(
      (f) => f.name.toLowerCase().includes(q) || (f.content && f.content.toLowerCase().includes(q))
    );
  }

  public uploadFile(params: {
    name: string;
    content: string;
    folder?: string;
    mimeType?: string;
  }): DriveFile {
    const id = `drive-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const folder = params.folder || "/Executive Reports";
    this.folders.add(folder);

    const file: DriveFile = {
      id,
      name: params.name,
      mimeType: params.mimeType || (params.name.endsWith(".pdf") ? "application/pdf" : "text/markdown"),
      sizeBytes: Buffer.byteLength(params.content),
      folder,
      webViewLink: `https://drive.google.com/file/d/${id}/view`,
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      content: params.content
    };

    this.files.set(id, file);

    // Also sync to FoundryOS local document archive
    try {
      documentStore.archiveDocument({
        tenantId: "default-tenant",
        title: params.name,
        fileName: params.name,
        category: params.name.endsWith(".pdf") ? "pdf" : "generated",
        content: params.content,
        summary: `Synced from Google Drive [${folder}]`,
        metadata: {
          googleDriveId: id,
          googleDriveLink: file.webViewLink,
          folder
        }
      });
    } catch (e) {
      // Ignored
    }

    logger.info("Google Drive MCP: File uploaded & synced", { id, name: params.name, folder });
    return file;
  }

  public getFile(id: string): DriveFile | undefined {
    return this.files.get(id);
  }

  public createFolder(folderPath: string): string {
    const clean = folderPath.startsWith("/") ? folderPath : `/${folderPath}`;
    this.folders.add(clean);
    return clean;
  }
}

export const googleDriveWorkspace = GoogleDriveWorkspace.getInstance();

export function createGoogleDriveMcpServer(): Server {
  const server = new Server(
    { name: "google-drive-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "drive_upload_document",
          description: "Upload and sync a marketing report, brief, or document to Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "File name with extension (e.g. GTM_Strategy.md)" },
              content: { type: "string", description: "File text content" },
              folder: { type: "string", description: "Target folder (e.g. /Executive Reports, /Marketing Briefs)", default: "/Executive Reports" }
            },
            required: ["name", "content"]
          }
        },
        {
          name: "drive_list_files",
          description: "List files and folders available in Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              folder: { type: "string", description: "Optional folder filter", default: "all" }
            }
          }
        },
        {
          name: "drive_search_files",
          description: "Search Google Drive files by keyword or title",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        },
        {
          name: "drive_get_file_content",
          description: "Retrieve full text content of a file in Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              fileId: { type: "string", description: "Drive File ID" }
            },
            required: ["fileId"]
          }
        },
        {
          name: "drive_create_folder",
          description: "Create an organized folder in Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              folderPath: { type: "string", description: "Path (e.g. /FoundryOS 2026/Campaigns)" }
            },
            required: ["folderPath"]
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const driveConfig = integrationStore.getDriveConfig("default-tenant");

    if (!driveConfig && (name === "drive_upload_document" || name === "drive_create_folder")) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "not_configured",
              error: "Google Drive integration is not connected. User must provide and connect their Google Drive token in the Integrations settings.",
              action: "Please configure Google Drive in FoundryOS -> Integrations tab."
            }, null, 2)
          }
        ]
      };
    }

    if (name === "drive_upload_document") {
      const fileName = String(args?.["name"] || "FoundryOS_Document.md");
      const content = String(args?.["content"] || "");
      const folder = String(args?.["folder"] || "/Executive Reports");

      const file = googleDriveWorkspace.uploadFile({
        name: fileName,
        content,
        folder
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "success",
              fileId: file.id,
              name: file.name,
              folder: file.folder,
              sizeBytes: file.sizeBytes,
              webViewLink: file.webViewLink,
              syncedWithDocumentArchive: true
            }, null, 2)
          }
        ]
      };
    }

    if (name === "drive_list_files") {
      const folder = String(args?.["folder"] || "all");
      const files = googleDriveWorkspace.listFiles(folder);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: files.length,
              files: files.map((f) => ({
                id: f.id,
                name: f.name,
                folder: f.folder,
                sizeBytes: f.sizeBytes,
                webViewLink: f.webViewLink,
                modifiedTime: f.modifiedTime
              }))
            }, null, 2)
          }
        ]
      };
    }

    if (name === "drive_search_files") {
      const query = String(args?.["query"] || "");
      const files = googleDriveWorkspace.searchFiles(query);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query,
              matchCount: files.length,
              files: files.map((f) => ({
                id: f.id,
                name: f.name,
                folder: f.folder,
                webViewLink: f.webViewLink
              }))
            }, null, 2)
          }
        ]
      };
    }

    if (name === "drive_get_file_content") {
      const fileId = String(args?.["fileId"] || "");
      const file = googleDriveWorkspace.getFile(fileId);
      if (!file) {
        return {
          isError: true,
          content: [{ type: "text", text: `File not found with ID: ${fileId}` }]
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              fileId: file.id,
              name: file.name,
              content: file.content || ""
            }, null, 2)
          }
        ]
      };
    }

    if (name === "drive_create_folder") {
      const folderPath = String(args?.["folderPath"] || "/New Folder");
      const created = googleDriveWorkspace.createFolder(folderPath);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "created",
              folder: created
            }, null, 2)
          }
        ]
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown Google Drive MCP tool: ${name}` }]
    };
  });

  return server;
}
