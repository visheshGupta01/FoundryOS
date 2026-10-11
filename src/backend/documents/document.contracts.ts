export type DocumentCategory = "uploaded" | "generated" | "pdf";

export interface DocumentMetadata {
  tags?: string[];
  author?: string;
  sourceTask?: string;
  employeeId?: string;
  fileSize?: number;
  mimeType?: string;
  format?: string;
  pageCount?: number;
  [key: string]: unknown;
}

export interface ArchivedDocument {
  id: string;
  tenantId: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  content: string;
  summary: string;
  metadata: DocumentMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface PDFGenerationOptions {
  title: string;
  subtitle?: string;
  author?: string;
  content: string;
  sections?: Array<{
    heading: string;
    body: string;
    bullets?: string[];
  }>;
  tenantId?: string;
  sourceTask?: string;
}
