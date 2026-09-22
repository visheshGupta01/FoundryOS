import { z } from "zod";

export const FlowStepStatusEnum = z.enum([
  "pending",
  "running",
  "awaiting_approval",
  "completed",
  "failed"
]);
export type FlowStepStatus = z.infer<typeof FlowStepStatusEnum>;

export const FlowStepDefinitionSchema = z.object({
  stepId: z.string().min(1),
  name: z.string().min(1),
  employeeId: z.string().min(1),
  taskTemplate: z.string().min(1),
  requiresApproval: z.boolean().default(false)
});
export type FlowStepDefinition = z.infer<typeof FlowStepDefinitionSchema>;

export const FlowDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  steps: z.array(FlowStepDefinitionSchema).min(1)
});
export type FlowDefinition = z.infer<typeof FlowDefinitionSchema>;

export interface FlowStepExecution {
  stepId: string;
  name: string;
  employeeId: string;
  status: FlowStepStatus;
  inputTask: string;
  output?: unknown;
  tokenCount?: number;
  startedAt?: string;
  completedAt?: string;
  approvedBy?: string;
}

export interface FlowRunState {
  flowRunId: string;
  flowId: string;
  tenantId: string;
  status: "running" | "awaiting_approval" | "completed" | "failed";
  currentStepIndex: number;
  steps: FlowStepExecution[];
  finalArtifacts: Record<string, unknown>;
  startedAt: string;
  updatedAt: string;
}
