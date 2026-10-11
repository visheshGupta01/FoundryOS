import { z } from "zod";

export interface ToolExecutionContext {
  tenantId: string;
  employeeId?: string | undefined;
  executionId?: string | undefined;
}

export interface ToolExecutionResult<T = unknown> {
  toolName: string;
  success: boolean;
  data?: T | undefined;
  error?: string | undefined;
  durationMs: number;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  parameters: z.ZodType<TInput> | Record<string, unknown>;
  source: "builtin" | "plugin" | string;
  execute: (input: TInput, context?: ToolExecutionContext) => Promise<TOutput>;
}

export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  tools: ToolDefinition[];
}
