import { TrueForge } from "@truefoundry/trueforge-sdk";
import { env } from "../../config/env.js";
import { InfrastructureError, ValidationError } from "../../errors/base.error.js";
import { ErrorCode } from "../../errors/error-codes.js";
import { logger } from "../../shared/logger.js";
import { withRetry } from "../../shared/retry.js";
import {
  type AgentSessionCreateInput,
  AgentSessionCreateInputSchema,
  type AgentSessionResult,
  AgentSessionResultSchema,
  type AgentTurnExecutionInput,
  AgentTurnExecutionInputSchema,
  type AgentTurnExecutionResult,
  AgentTurnExecutionResultSchema
} from "./trueforge.contracts.js";

export class TrueForgeService {
  private readonly client: TrueForge;

  constructor(client?: TrueForge) {
    this.client =
      client ??
      new TrueForge({
        baseUrl: env.TRUEFORGE_API_URL,
        token: env.TRUEFORGE_API_KEY
      });
  }

  public async createSession(rawInput: AgentSessionCreateInput): Promise<AgentSessionResult> {
    const parseResult = AgentSessionCreateInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid session creation input", { issues: parseResult.error.issues });
    }

    const input = parseResult.data;

    try {
      const response = await withRetry(async () => {
        return await this.client.sessions.create({
          agent: {
            name: input.agentName
          },
          metadata: {
            tenantId: input.tenantId,
            ...input.metadata
          }
        });
      });

      const validated = AgentSessionResultSchema.parse({
        sessionId: response.data.id,
        agentName: input.agentName,
        tenantId: input.tenantId,
        status: "active"
      });

      logger.info("Agent session created", {
        sessionId: validated.sessionId,
        tenantId: validated.tenantId
      });

      return validated;
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error("Failed to create TrueForge agent session", error, { tenantId: input.tenantId });
      throw new InfrastructureError(
        "TrueForge session creation failed",
        ErrorCode.TRUEFORGE_SESSION_ERROR,
        error instanceof Error ? { message: error.message } : {}
      );
    }
  }

  public async executeTurn(rawInput: AgentTurnExecutionInput): Promise<AgentTurnExecutionResult> {
    const parseResult = AgentTurnExecutionInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      throw new ValidationError("Invalid turn execution input", { issues: parseResult.error.issues });
    }

    const input = parseResult.data;

    try {
      const response = await withRetry(async () => {
        return await this.client.sessions.createTurn(input.sessionId, {
          input: [
            {
              type: "user.message",
              content: input.prompt
            }
          ]
        });
      });

      let extractedOutput: string | undefined;
      if (response.data.state.status === "done" && response.data.state.output?.content) {
        const rawContent = response.data.state.output.content;
        if (typeof rawContent === "string") {
          extractedOutput = rawContent;
        } else if (Array.isArray(rawContent)) {
          extractedOutput = rawContent
            .map((item) => (typeof item === "object" && item !== null && "text" in item ? String(item.text) : ""))
            .join("\n");
        }
      }

      const validated = AgentTurnExecutionResultSchema.parse({
        turnId: response.data.id,
        sessionId: input.sessionId,
        status: response.data.state.status,
        output: extractedOutput
      });

      logger.info("Agent turn executed", {
        turnId: validated.turnId,
        sessionId: validated.sessionId,
        status: validated.status
      });

      return validated;
    } catch (error: unknown) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error("Failed to execute TrueForge agent turn", error, {
        sessionId: input.sessionId
      });
      throw new InfrastructureError(
        "TrueForge turn execution failed",
        ErrorCode.TRUEFORGE_API_ERROR,
        error instanceof Error ? { message: error.message } : {}
      );
    }
  }
}

export const trueForgeService = new TrueForgeService();
