import type { ArchivedDocument, DocumentCategory, PDFGenerationOptions } from "./document.contracts.js";
import { generatePdfBuffer } from "./pdf.generator.js";
import { semanticMemory } from "../../brain/semantic-memory.js";

class DocumentStore {
  private documents: Map<string, ArchivedDocument> = new Map();

  constructor() {
    this.seedDefaultDocuments();
  }

  private seedDefaultDocuments(): void {
    const doc1: ArchivedDocument = {
      id: "doc-sample-gtm",
      tenantId: "default-tenant",
      title: "FoundryOS GTM & Positioning Strategy Brief",
      category: "generated",
      fileName: "FoundryOS_GTM_Strategy.md",
      content: `# FoundryOS GTM & Positioning Strategy

## Executive Summary
FoundryOS is the AI Marketing Operating System designed for founders and lean marketing teams. 
It combines specialized AI agent employees, company memory (Brain), real-time web research, and tool/MCP execution.

## Target Audience
- B2B SaaS Founders (Pre-Seed to Series A)
- Marketing Leads in tech startups
- Growth Agencies managing multiple brand accounts

## Core Differentiators
1. Specialized Employee Persona Agents (Chief Marketing Officer, Copywriter, SEO Lead, Growth Strategist)
2. Centralized Company Brain Memory
3. Native MCP Server Integration
4. Complete Document Archive & PDF Generation Suite`,
      summary: "Comprehensive strategy brief for FoundryOS position and growth channels.",
      metadata: {
        author: "Chief Marketing Strategist",
        tags: ["GTM", "Positioning", "Strategy"],
        sourceTask: "Formulate core company positioning and ICP market strategy.",
        format: "markdown"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.documents.set(doc1.id, doc1);

    const pdfBuffer = generatePdfBuffer({
      title: "FoundryOS Competitor Landscape Report",
      subtitle: "Market Intelligence & Competitor Audit",
      author: "Market Research Specialist",
      content: "Detailed comparative analysis of marketing AI solutions and local LLM execution capabilities.",
      sections: [
        {
          heading: "Market Overview",
          body: "The AI marketing automation space is transitioning from basic prompt wrappers to full agentic operating systems.",
          bullets: [
            "Local LLM privacy and execution (Gemma 3 12B, Llama 3)",
            "Model Context Protocol (MCP) server ecosystem expansion",
            "Multi-agent autonomous workflow orchestration"
          ]
        }
      ]
    });

    const doc2: ArchivedDocument = {
      id: "doc-sample-pdf-audit",
      tenantId: "default-tenant",
      title: "FoundryOS Competitor Landscape Report.pdf",
      category: "pdf",
      fileName: "FoundryOS_Competitor_Audit.pdf",
      content: pdfBuffer.toString("base64"),
      summary: "Generated PDF report analyzing marketing AI space and local model benefits.",
      metadata: {
        author: "Market Research Specialist",
        tags: ["Competitors", "Audit", "PDF"],
        sourceTask: "Generate competitive audit PDF report",
        fileSize: pdfBuffer.byteLength,
        mimeType: "application/pdf",
        format: "pdf"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.documents.set(doc2.id, doc2);

    // Initial seed to semantic memory
    semanticMemory.indexText({
      tenantId: "default-tenant",
      sourceType: "document",
      sourceId: doc1.id,
      title: doc1.title,
      content: doc1.content
    }).catch(() => {});
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
