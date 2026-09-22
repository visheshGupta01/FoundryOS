import {
  type FlowDefinition,
  type FlowRunState,
  type FlowStepExecution
} from "./flow.types.js";
import { AgentRunner, agentRunner } from "../agents/agent.runner.js";
import { NotFoundError, DomainError } from "../errors/base.error.js";
import { ErrorCode } from "../errors/error-codes.js";
import { logger } from "../shared/logger.js";

export class FlowEngine {
  private readonly runner: AgentRunner;
  private readonly activeRuns: Map<string, FlowRunState>;

  constructor(runner: AgentRunner = agentRunner) {
    this.runner = runner;
    this.activeRuns = new Map();
  }

  public async startFlow(
    tenantId: string,
    flowDef: FlowDefinition,
    userObjective: string
  ): Promise<FlowRunState> {
    const flowRunId = `flow-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const steps: FlowStepExecution[] = flowDef.steps.map((step) => ({
      stepId: step.stepId,
      name: step.name,
      employeeId: step.employeeId,
      status: "pending",
      inputTask: step.taskTemplate.replace("{{objective}}", userObjective)
    }));

    const state: FlowRunState = {
      flowRunId,
      flowId: flowDef.id,
      tenantId,
      status: "running",
      currentStepIndex: 0,
      steps,
      finalArtifacts: {},
      startedAt: now,
      updatedAt: now
    };

    this.activeRuns.set(flowRunId, state);
    return await this.executeCurrentStep(flowRunId);
  }

  public async executeCurrentStep(flowRunId: string): Promise<FlowRunState> {
    const state = this.activeRuns.get(flowRunId);
    if (!state) {
      throw new NotFoundError(`Flow run '${flowRunId}' not found`);
    }

    if (state.currentStepIndex >= state.steps.length) {
      state.status = "completed";
      state.updatedAt = new Date().toISOString();
      return state;
    }

    const currentStep = state.steps[state.currentStepIndex]!;
    currentStep.status = "running";
    currentStep.startedAt = new Date().toISOString();

    let augmentedTask = currentStep.inputTask;
    if (state.currentStepIndex > 0) {
      const priorStep = state.steps[state.currentStepIndex - 1]!;
      if (priorStep.output) {
        augmentedTask += `\n\nUpstream Intelligence from ${priorStep.name}:\n${JSON.stringify(priorStep.output, null, 2)}`;
      }
    }

    try {
      const result = await this.runner.run({
        tenantId: state.tenantId,
        employeeId: currentStep.employeeId,
        task: augmentedTask
      });

      currentStep.output = result.output;
      currentStep.tokenCount = result.tokenReport.totalTokensUsed;
      currentStep.completedAt = new Date().toISOString();
      state.finalArtifacts[currentStep.stepId] = result.output;

      if (result.status === "awaiting_approval") {
        currentStep.status = "awaiting_approval";
        state.status = "awaiting_approval";
        state.updatedAt = new Date().toISOString();
        return state;
      }

      currentStep.status = "completed";
      state.currentStepIndex += 1;
      state.updatedAt = new Date().toISOString();

      if (state.currentStepIndex < state.steps.length) {
        return await this.executeCurrentStep(flowRunId);
      } else {
        state.status = "completed";
        return state;
      }
    } catch (err: unknown) {
      currentStep.status = "failed";
      state.status = "failed";
      state.updatedAt = new Date().toISOString();
      logger.error("Flow step execution failed", { flowRunId, stepId: currentStep.stepId, error: String(err) });
      return state;
    }
  }

  public async approveStep(flowRunId: string, approvedBy: string = "founder"): Promise<FlowRunState> {
    const state = this.activeRuns.get(flowRunId);
    if (!state) {
      throw new NotFoundError(`Flow run '${flowRunId}' not found`);
    }

    if (state.status !== "awaiting_approval") {
      throw new DomainError(
        `Flow run '${flowRunId}' is not awaiting approval (status: ${state.status})`,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const currentStep = state.steps[state.currentStepIndex]!;
    currentStep.status = "completed";
    currentStep.approvedBy = approvedBy;
    state.currentStepIndex += 1;
    state.status = "running";
    state.updatedAt = new Date().toISOString();

    if (state.currentStepIndex < state.steps.length) {
      return await this.executeCurrentStep(flowRunId);
    } else {
      state.status = "completed";
      return state;
    }
  }

  public getFlowRun(flowRunId: string): FlowRunState {
    const state = this.activeRuns.get(flowRunId);
    if (!state) {
      throw new NotFoundError(`Flow run '${flowRunId}' not found`);
    }
    return state;
  }
}

export const flowEngine = new FlowEngine();
