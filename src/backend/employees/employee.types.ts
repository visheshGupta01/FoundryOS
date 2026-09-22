import { z } from "zod";

export const EmployeePillarEnum = z.enum(["research", "strategy"]);
export type EmployeePillar = z.infer<typeof EmployeePillarEnum>;

export const EmployeeIdentitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  pillar: EmployeePillarEnum,
  role: z.string().min(1),
  avatar: z.string().min(1)
});
export type EmployeeIdentity = z.infer<typeof EmployeeIdentitySchema>;

export const ContextLayerRequirementEnum = z.enum([
  "company",
  "product",
  "audience",
  "brand",
  "competitors",
  "goals",
  "strategies",
  "chunks",
  "memories"
]);
export type ContextLayerRequirement = z.infer<typeof ContextLayerRequirementEnum>;

export const EmployeeApprovalRulesSchema = z.object({
  requiresHumanApproval: z.boolean().default(false),
  criticalActions: z.array(z.string()).default([])
});
export type EmployeeApprovalRules = z.infer<typeof EmployeeApprovalRulesSchema>;

export const EmployeeMemoryPolicySchema = z.object({
  canProposeLearnings: z.boolean().default(true),
  defaultConfidence: z.number().min(0).max(1).default(0.7)
});
export type EmployeeMemoryPolicy = z.infer<typeof EmployeeMemoryPolicySchema>;

export const EmployeeOperatingContractSchema = z.object({
  identity: EmployeeIdentitySchema,
  specialties: z.array(z.string()).min(1),
  worksWith: z.array(z.string()).default([]),
  systemPrompt: z.string().min(1),
  requiredLayers: z.array(ContextLayerRequirementEnum).min(1),
  tools: z.array(z.string()).default([]),
  approvalRules: EmployeeApprovalRulesSchema.default({}),
  memoryPolicy: EmployeeMemoryPolicySchema.default({}),
  outputSchemaDescription: z.string().min(1)
});
export type EmployeeOperatingContract = z.infer<typeof EmployeeOperatingContractSchema>;
