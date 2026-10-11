import { z } from "zod";
import type { PluginDefinition } from "../tool.types.js";
import { getActiveCompanyBrainState } from "../../../brain/context.builder.js";
import { brainService } from "../../../brain/brain.service.js";

const BrainSearchInputSchema = z.object({
  query: z.string().optional()
});

const BrainProposeMemoryInputSchema = z.object({
  statement: z.string().min(1),
  rationale: z.string().min(1),
  confidenceLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).default("HIGH")
});

export const brainPlugin: PluginDefinition = {
  id: "brain-tools-plugin",
  name: "FoundryOS Company Brain Access",
  description: "Search and propose institutional knowledge into persistent Company Brain",
  version: "1.0.0",
  tools: [
    {
      name: "brain_search",
      description: "Search the persistent Company Brain for company positioning, ICPs, competitors, and tone rules",
      parameters: BrainSearchInputSchema,
      source: "plugin:brain-tools-plugin",
      execute: async (_input, context) => {
        const state = getActiveCompanyBrainState();
        return {
          tenantId: context?.tenantId ?? "default-tenant",
          companyName: state.name,
          oneLiner: state.oneLiner,
          audience: state.audience,
          problem: state.problem,
          competitors: state.competitors,
          tone: state.tone,
          pricing: state.pricing,
          goal: state.goal
        };
      }
    },
    {
      name: "brain_propose_memory",
      description: "Submit a strategic hypothesis or validated learning into the Company Brain",
      parameters: BrainProposeMemoryInputSchema,
      source: "plugin:brain-tools-plugin",
      execute: async (input, context) => {
        const tenantId = context?.tenantId ?? "default-tenant";
        const memoryId = await brainService.proposeMemory({
          tenantId,
          memoryType: "learning",
          statement: input.statement,
          rationale: input.rationale,
          confidenceLevel: input.confidenceLevel
        });
        return {
          success: true,
          memoryId,
          statement: input.statement,
          status: "proposed"
        };
      }
    }
  ]
};
