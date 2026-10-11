import { type z } from "zod";

export interface LLMChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  format?: Record<string, unknown> | string;
}

export interface LLMGenerateOptions {
  system?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMClient {
  readonly providerName: string;

  isAvailable(): Promise<boolean>;

  chat(messages: LLMChatMessage[], options?: LLMChatOptions): Promise<string>;

  generate(prompt: string, options?: LLMGenerateOptions): Promise<string>;

  generateStructured<T>(
    prompt: string,
    schema: z.ZodType<T>,
    options?: LLMGenerateOptions
  ): Promise<T>;

  embed(text: string, model?: string): Promise<number[]>;

  embedBatch(texts: string[], model?: string): Promise<number[][]>;
}
