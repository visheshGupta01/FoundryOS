import { z } from "zod";

export const McpServerConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  transport: z.enum(["stdio", "in-memory"]).default("stdio"),
  command: z.string().optional(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).optional(),
  autoStart: z.boolean().default(true)
});

export type McpServerConfig = z.input<typeof McpServerConfigSchema>;

export interface McpServerInfo {
  id: string;
  name: string;
  description?: string | undefined;
  transport: string;
  status: "connected" | "disconnected" | "error";
  toolCount: number;
  tools: string[];
  lastError?: string | undefined;
  connectedAt?: string | undefined;
}

export interface McpToolCallPayload {
  serverName: string;
  toolName: string;
  arguments: Record<string, unknown>;
}
