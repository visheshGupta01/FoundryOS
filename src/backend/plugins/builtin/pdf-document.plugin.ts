import { z } from "zod";
import type { PluginDefinition } from "../tool.types.js";
import { documentStore } from "../../documents/document.store.js";

const GeneratePdfReportSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  content: z.string(),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        body: z.string(),
        bullets: z.array(z.string()).optional()
      })
    )
    .optional()
});

const ArchiveDocumentSchema = z.object({
  title: z.string(),
  category: z.enum(["uploaded", "generated", "pdf"]).default("generated"),
  fileName: z.string(),
  content: z.string(),
  summary: z.string().optional()
});

const ListArchivedDocumentsSchema = z.object({
  category: z.enum(["all", "uploaded", "generated", "pdf"]).optional().default("all"),
  query: z.string().optional()
});

export const pdfDocumentPlugin: PluginDefinition = {
  id: "pdf-document-plugin",
  name: "Document & PDF Intelligence Plugin",
  description: "Provides tools for generating PDF reports, archiving artifacts, and searching document storage.",
  version: "1.0.0",
  tools: [
    {
      name: "generate_pdf_report",
      description: "Generates a clean PDF report from text/markdown content and saves it directly into the Document Archive.",
      parameters: GeneratePdfReportSchema,
      source: "plugin:pdf-document-plugin",
      execute: async (input, context) => {
        const { document } = documentStore.generateAndArchivePdf({
          tenantId: context?.tenantId ?? "default-tenant",
          title: input.title,
          ...(input.subtitle ? { subtitle: input.subtitle } : {}),
          ...(input.author ? { author: input.author } : {}),
          content: input.content,
          ...(input.sections ? { sections: input.sections } : {})
        });
        return {
          documentId: document.id,
          fileName: document.fileName,
          fileSize: Number(document.metadata.fileSize || 0),
          downloadUrl: `/api/documents/${document.id}/download`
        };
      }
    },
    {
      name: "archive_document",
      description: "Archives an uploaded or generated text/markdown document in the FoundryOS Document Store.",
      parameters: ArchiveDocumentSchema,
      source: "plugin:pdf-document-plugin",
      execute: async (input, context) => {
        const doc = documentStore.archiveDocument({
          tenantId: context?.tenantId ?? "default-tenant",
          title: input.title,
          category: input.category,
          fileName: input.fileName,
          content: input.content,
          ...(input.summary ? { summary: input.summary } : {})
        });
        return {
          documentId: doc.id,
          archivedAt: doc.createdAt
        };
      }
    },
    {
      name: "list_archived_documents",
      description: "Lists archived documents and PDF reports stored in the company archive.",
      parameters: ListArchivedDocumentsSchema,
      source: "plugin:pdf-document-plugin",
      execute: async (input, context) => {
        const docs = documentStore.listDocuments(
          context?.tenantId ?? "default-tenant",
          input.category as any,
          input.query
        );
        return {
          documents: docs.map((d) => ({
            id: d.id,
            title: d.title,
            category: d.category,
            fileName: d.fileName,
            summary: d.summary,
            createdAt: d.createdAt
          }))
        };
      }
    }
  ]
};
