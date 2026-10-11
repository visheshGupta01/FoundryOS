export type ViewType = 'chat' | 'approvals' | 'employees' | 'brain' | 'recent-chats' | 'token-analytics' | 'plugins' | 'archive' | 'integrations';

export interface StartupProfile {
  id: string;
  name: string;
  website: string;
  industry: string;
  oneLiner: string;
  audience: string;
  problem: string;
  competitors: string;
  tone: string;
  avoidTone: string;
  pricing: string;
  goal: string;
  quickPrompts: Array<{
    agentId: string;
    label: string;
    prompt: string;
  }>;
}

export interface HitlApprovalDetail {
  id: string;
  tenantId: string;
  executionId?: string;
  employeeId: string;
  employeeName: string;
  actionType: string;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  decisionComment?: string;
  executionResult?: Record<string, unknown>;
}

export interface IntegrationPublicStatus {
  slack: {
    connected: boolean;
    channel?: string;
    connectedAt?: string;
  };
  drive: {
    connected: boolean;
    folder?: string;
    connectedAt?: string;
  };
}

export interface IntegrationConfigItem {
  id: string;
  connected: boolean;
  apiKey?: string;
  secondaryValue?: string;
  connectedAt?: string;
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  category: 'Communication' | 'Storage' | 'Productivity' | 'CRM' | 'Analytics' | 'AI Providers';
  description: string;
  keyLabel: string;
  keyPlaceholder: string;
  keyHelp: string;
  secondaryLabel?: string;
  secondaryPlaceholder?: string;
  secondaryHelp?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  isAgentSpecific: boolean;
  messages: Message[];
  messageCount: number;
  lastMessagePreview: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditStatus {
  tenantId: string;
  remainingCredits: number;
  maxDailyCredits: number;
  tokensPerCredit: number;
  tokensUsedToday: number;
  dailyTokensRemaining: number;
  isExhausted: boolean;
  resetsAt: string;
}

export interface Employee {
  id?: string;
  name?: string;
  role?: string;
  avatar?: string;
  description?: string;
  responsibilities?: string[];
  identity?: {
    id: string;
    name: string;
    title?: string;
    role?: string;
    avatar?: string;
    pillar?: string;
  };
  specialties?: string[];
  worksWith?: string[];
  systemPrompt?: string;
}

export interface AttachedDocument {
  fileName: string;
  content: string;
  size?: number;
}

export interface ToolCallExecution {
  toolName: string;
  input: unknown;
  result: unknown;
}

export interface Artifact {
  id: string;
  title: string;
  type: string;
  agentId?: string;
  content: string;
  createdAt: string;
}

export interface ArchivedDocumentItem {
  id: string;
  tenantId: string;
  title: string;
  category: 'uploaded' | 'generated' | 'pdf';
  fileName: string;
  content: string;
  summary: string;
  metadata: {
    author?: string;
    fileSize?: number;
    mimeType?: string;
    format?: string;
    sourceTask?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HitlOption {
  id: string;
  label: string;
  description: string;
  badge?: string;
  recommended?: boolean;
}

export interface HitlApproval {
  approvalId: string;
  actionType: string;
  title: string;
  description: string;
  options?: HitlOption[];
  selectedOptionId?: string;
  customAnswer?: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  resolvedBy?: string;
  decisionComment?: string;
}

export interface HitlApprovalDetail extends HitlApproval {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  createdAt: string;
  payload: Record<string, unknown>;
  executionResult?: Record<string, unknown>;
}

export interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  toolCalls?: ToolCallExecution[];
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    creditsDeducted?: number;
  };
  artifacts?: Artifact[];
  pendingApproval?: HitlApproval;
  isLightweight?: boolean;
  runtimeMode?: 'lightweight_fast' | 'specialist_pipeline';
  routedBy?: string;
  routingReason?: string;
}

export interface McpServerInfo {
  id: string;
  name: string;
  description?: string;
  status: string;
  toolsCount: number;
  transport: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  plugin: string;
  parameters?: Record<string, unknown>;
}

export interface BrainData {
  name: string;
  website: string;
  oneLiner: string;
  audience: string;
  problem: string;
  competitors: string;
  tone: string;
  avoidTone: string;
  pricing: string;
  goal: string;
}

export interface BrainHealth {
  completenessPercent: number;
  configuredFields: string[];
  missingFields: string[];
}

export interface TokenAnalyticsReport {
  timestamp: string;
  tenantId: string;
  employeeId: string;
  task: string;
  totalTokensUsed: number;
  reservedBudget: number;
  cacheHitRatePercent: number;
  breakdown: {
    systemPrompt: number;
    brainContext: number;
    conversationHistory: number;
    completionBudget: number;
  };
}
