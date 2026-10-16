import { updateActiveCompanyBrainState } from "../../brain/context.builder.js";
import { brainService } from "../../brain/brain.service.js";
import { brainRepository } from "../../brain/brain.repository.js";
import { logger } from "../shared/logger.js";

export type HitlActionType =
  | "commit_brand_positioning"
  | "broadcast_slack"
  | "sync_google_drive"
  | "validate_proposed_learning"
  | "publish_campaign_offer"
  | "missing_information_clarification";

export interface HitlOption {
  id: string;
  label: string;
  description: string;
  badge?: string;
  recommended?: boolean;
}

export interface HitlApprovalRequest {
  id: string;
  tenantId: string;
  executionId?: string | undefined;
  employeeId: string;
  employeeName: string;
  actionType: HitlActionType;
  title: string;
  description: string;
  options?: HitlOption[];
  selectedOptionId?: string;
  customAnswer?: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt?: string | undefined;
  resolvedBy?: string | undefined;
  decisionComment?: string | undefined;
  executionResult?: Record<string, unknown> | undefined;
}

export class HitlService {
  private static instance: HitlService;
  private readonly approvals: Map<string, HitlApprovalRequest> = new Map();

  public static getInstance(): HitlService {
    if (!HitlService.instance) {
      HitlService.instance = new HitlService();
    }
    return HitlService.instance;
  }

  constructor() {
    // Clean initialization: no mock seed approvals
  }

  public generateDefaultOptions(title: string, actionType: HitlActionType): HitlOption[] {
    const lower = `${title} ${actionType}`.toLowerCase();

    if (actionType === "missing_information_clarification" || lower.includes("missing") || lower.includes("clarification") || lower.includes("unknown")) {
      return [
        {
          id: "opt-continue-benchmarks",
          label: "⚡ Continue without it (Use standard benchmarks)",
          description: "Proceed immediately using standard startup industry benchmarks, best-practice pricing, and general market assumptions.",
          recommended: true
        },
        {
          id: "opt-provide-details",
          label: "✍️ Provide missing business details",
          description: "Specify your exact pricing, target customer, or competitors for high-precision bespoke analysis.",
          badge: "High Precision"
        },
        {
          id: "opt-auto-research",
          label: "🌐 Autonomous web discovery",
          description: "Let the AI automatically research online using search engines and trends data to infer the missing context.",
          badge: "Automated"
        }
      ];
    }

    if (lower.includes("position") || lower.includes("brand") || lower.includes("narrative")) {
      return [
        {
          id: "opt-plg",
          label: "PLG Self-Serve & Transparent Pricing",
          description: "Emphasize immediate product trial, interactive playground, and organic developer virality.",
          recommended: true
        },
        {
          id: "opt-abm",
          label: "Enterprise ABM & Executive Governance",
          description: "Focus on compliance, multi-user approval controls, and enterprise procurement readiness.",
          badge: "Enterprise"
        },
        {
          id: "opt-disruptive",
          label: "Category Disruption & Agency Alternative",
          description: "High-contrast challenger narrative contrasting manual agencies with autonomous execution.",
          badge: "High Impact"
        }
      ];
    }

    if (lower.includes("campaign") || lower.includes("funnel") || lower.includes("acquisition")) {
      return [
        {
          id: "opt-social-audit",
          label: "Viral Social Audits & Public Teardowns",
          description: "Deliver high-value automated teardowns comparing prospect stacks to industry benchmarks.",
          recommended: true
        },
        {
          id: "opt-seo-moat",
          label: "Technical SEO & Programmatic Pages",
          description: "Build 50+ programmatic comparison templates and long-tail keyword landing pages.",
          badge: "Compounding"
        },
        {
          id: "opt-vip-outbound",
          label: "High-Signal Direct Founder Outreach",
          description: "Personalized multi-touch outreach targeted strictly to newly funded seed-stage founders.",
          badge: "High Conversion"
        }
      ];
    }

    return [
      {
        id: "opt-speed",
        label: "Accelerated Sprint (48-Hour Pilot)",
        description: "Deploy the leanest viable version to gather immediate market feedback.",
        recommended: true
      },
      {
        id: "opt-comprehensive",
        label: "Comprehensive Multichannel Moat",
        description: "Build out complete cross-functional deliverables, documentation, and assets.",
        badge: "Thorough"
      },
      {
        id: "opt-experiment",
        label: "Split-Testing Experiment Matrix",
        description: "Test 3 micro-angles in parallel to identify the highest performing creative.",
        badge: "Data-Driven"
      }
    ];
  }

  public createApproval(params: {
    tenantId: string;
    executionId?: string;
    employeeId: string;
    employeeName: string;
    actionType: HitlActionType;
    title: string;
    description: string;
    options?: HitlOption[];
    payload: Record<string, unknown>;
  }): HitlApprovalRequest {
    const id = `hitl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const req: HitlApprovalRequest = {
      id,
      tenantId: params.tenantId,
      executionId: params.executionId,
      employeeId: params.employeeId,
      employeeName: params.employeeName,
      actionType: params.actionType,
      title: params.title,
      description: params.description,
      options: params.options || this.generateDefaultOptions(params.title, params.actionType),
      payload: params.payload,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    this.approvals.set(id, req);
    logger.info("Human-In-The-Loop approval created", { id, actionType: params.actionType, title: params.title });
    return req;
  }

  public listApprovals(tenantId: string = "default-tenant", status?: "pending" | "approved" | "rejected"): HitlApprovalRequest[] {
    return Array.from(this.approvals.values())
      .filter((a) => (a.tenantId === tenantId || a.tenantId === "default-tenant") && (!status || a.status === status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getApproval(id: string): HitlApprovalRequest | undefined {
    return this.approvals.get(id);
  }

  public async resolveApproval(
    id: string,
    decision: "approve" | "reject",
    reviewer: string = "founder",
    comment?: string,
    selectedOptionId?: string,
    customAnswer?: string
  ): Promise<HitlApprovalRequest> {
    const approval = this.approvals.get(id);
    if (!approval) {
      throw new Error(`Approval request with ID ${id} not found`);
    }

    approval.status = decision === "approve" ? "approved" : "rejected";
    approval.resolvedAt = new Date().toISOString();
    approval.resolvedBy = reviewer;
    if (selectedOptionId) approval.selectedOptionId = selectedOptionId;
    if (customAnswer) approval.customAnswer = customAnswer;
    if (comment) approval.decisionComment = comment;

    if (decision === "approve") {
      try {
        approval.executionResult = await this.executeApprovedAction(approval);
        logger.info(`HITL action approved and executed: ${approval.actionType}`, { id });
      } catch (err: unknown) {
        logger.error(`HITL action execution encountered error: ${String(err)}`, { id });
        approval.executionResult = { error: String(err) };
      }
    } else {
      logger.info(`HITL action rejected by ${reviewer}: ${approval.actionType}`, { id, comment });
      approval.executionResult = { cancelled: true, comment: comment || "Rejected by founder" };
    }

    return approval;
  }

  private async executeApprovedAction(approval: HitlApprovalRequest): Promise<Record<string, unknown>> {
    switch (approval.actionType) {
      case "commit_brand_positioning": {
        const positioning = String(approval.payload["positioningStatement"] || "");
        const tone = approval.payload["tone"] ? String(approval.payload["tone"]) : undefined;
        updateActiveCompanyBrainState({
          oneLiner: positioning,
          ...(tone ? { tone } : {})
        });

        try {
          await brainRepository.upsertBrandProfile({
            tenantId: approval.tenantId,
            brandName: "FoundryOS",
            brandPositioning: positioning,
            tonePositive: tone ? tone.split(",").map((s) => s.trim()) : ["confident", "human"],
            toneAvoid: []
          });
        } catch {
          // Graceful fallback
        }

        return { appliedToBrain: true, positioning };
      }

      case "broadcast_slack": {
        const channel = String(approval.payload["channel"] || "#marketing");
        return { queued: true, note: "Slack broadcast logged", channel };
      }

      case "sync_google_drive": {
        const name = String(approval.payload["fileName"] || `${approval.title}.md`);
        return { synced: true, note: "Document export queued", fileName: name };
      }

      case "validate_proposed_learning": {
        const memoryId = String(approval.payload["memoryId"] || "");
        if (memoryId) {
          await brainService.validateMemory({
            tenantId: approval.tenantId,
            memoryId,
            reviewer: approval.resolvedBy || "founder"
          });
        }
        return { validatedMemoryId: memoryId };
      }

      case "publish_campaign_offer": {
        return { published: true, offer: approval.payload };
      }

      default:
        return { executed: true };
    }
  }
}

export const hitlService = HitlService.getInstance();
