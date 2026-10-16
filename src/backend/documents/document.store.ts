import type { ArchivedDocument, DocumentCategory, PDFGenerationOptions } from "./document.contracts.js";
import { generatePdfBuffer } from "./pdf.generator.js";
import { semanticMemory } from "../../brain/semantic-memory.js";

class DocumentStore {
  private documents: Map<string, ArchivedDocument> = new Map();

  constructor() {
    // Clean startup: no placeholder seeded documents
  }

  public listDocuments(tenantId: string = "default-tenant", category?: DocumentCategory, query?: string): ArchivedDocument[] {
    let docs = Array.from(this.documents.values()).filter((d) => d.tenantId === tenantId || d.tenantId === "default-tenant");

    if (category && category !== "all" as any) {
      docs = docs.filter((d) => d.category === category);
    }

    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          (d.metadata.tags && d.metadata.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getDocument(id: string): ArchivedDocument | undefined {
    return this.documents.get(id);
  }

  public archiveDocument(payload: {
    tenantId?: string;
    title: string;
    category: DocumentCategory;
    fileName: string;
    content: string;
    summary?: string;
    metadata?: Record<string, unknown>;
  }): ArchivedDocument {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const tenantId = payload.tenantId || "default-tenant";

    const doc: ArchivedDocument = {
      id,
      tenantId,
      title: payload.title,
      category: payload.category,
      fileName: payload.fileName,
      content: payload.content,
      summary: payload.summary || payload.content.slice(0, 150) + "...",
      metadata: {
        author: "FoundryOS User/Agent",
        fileSize: Buffer.byteLength(payload.content),
        mimeType: payload.category === "pdf" ? "application/pdf" : "text/markdown",
        format: payload.category === "pdf" ? "pdf" : "markdown",
        ...payload.metadata
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.documents.set(id, doc);

    // Asynchronously index in semantic memory for retrieval by agents
    if (payload.category !== "pdf" && payload.content.length > 0) {
      semanticMemory.indexText({
        tenantId,
        sourceType: "document",
        sourceId: id,
        title: payload.title,
        content: payload.content.slice(0, 8000),
        metadata: { fileName: payload.fileName, category: payload.category }
      }).catch(() => {});
    }

    return doc;
  }

  public generateAndArchivePdf(options: PDFGenerationOptions): { document: ArchivedDocument; pdfBuffer: Buffer } {
    const pdfBuffer = generatePdfBuffer(options);
    const fileName = `${options.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    const doc = this.archiveDocument({
      tenantId: options.tenantId || "default-tenant",
      title: `${options.title}.pdf`,
      category: "pdf",
      fileName,
      content: pdfBuffer.toString("base64"),
      summary: options.subtitle || `PDF document: ${options.title}`,
      metadata: {
        author: options.author || "FoundryOS Agent",
        sourceTask: options.sourceTask,
        fileSize: pdfBuffer.byteLength,
        mimeType: "application/pdf",
        format: "pdf"
      }
    });

    return { document: doc, pdfBuffer };
  }

  public deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }
}

export const documentStore = new DocumentStore();
