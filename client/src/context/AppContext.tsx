import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ViewType,
  SettingsSectionType,
  CreditStatus,
  Employee,
  AttachedDocument,
  Message,
  Artifact,
  McpServerInfo,
  ToolDefinition,
  BrainData,
  BrainHealth,
  ChatSession,
  ArchivedDocumentItem,
  IntegrationPublicStatus,
  IntegrationConfigItem,
  StartupProfile,
  HitlApprovalDetail
} from '../types';
import { formatAgentOutputToMarkdown } from '../utils/formatOutput';

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

interface AppContextValue {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  creditStatus: CreditStatus | null;
  refreshCredits: () => Promise<void>;
  resetCredits: () => Promise<void>;
  employees: Employee[];
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  isExecuting: boolean;
  attachedFiles: AttachedDocument[];
  addAttachedFile: (file: AttachedDocument) => { success: boolean; error?: string };
  removeAttachedFile: (index: number) => void;
  clearAttachedFiles: () => void;
  brainData: BrainData;
  setBrainData: React.Dispatch<React.SetStateAction<BrainData>>;
  brainHealth: BrainHealth;
  saveBrainData: (data: BrainData) => Promise<{ success: boolean; error?: string }>;
  artifacts: Artifact[];
  activeArtifact: Artifact | null;
  setActiveArtifact: (art: Artifact | null) => void;
  isArtifactModalOpen: boolean;
  setIsArtifactModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  settingsSection: SettingsSectionType;
  setSettingsSection: (section: SettingsSectionType) => void;
  mcpServers: McpServerInfo[];
  tools: ToolDefinition[];
  refreshMcp: () => Promise<void>;
  executeAgentRun: (promptText: string, agentOverride?: string) => Promise<void>;
  recentChats: ChatSession[];
  currentSessionId: string | null;
  loadChatSession: (sessionId: string) => void;
  deleteChatSession: (sessionId: string) => void;
  clearAllRecentChats: () => void;
  archivedDocuments: ArchivedDocumentItem[];
  fetchArchivedDocuments: (category?: string, query?: string) => Promise<void>;
  uploadDocumentToArchive: (title: string, fileName: string, content: string) => Promise<ArchivedDocumentItem | null>;
  generatePdfInArchive: (title: string, content: string, subtitle?: string) => Promise<ArchivedDocumentItem | null>;
  deleteArchivedDocument: (id: string) => Promise<boolean>;
  resolveHitlApproval: (
    approvalId: string,
    decision: 'approve' | 'reject',
    comment?: string,
    selectedOptionId?: string,
    customAnswer?: string,
    chosenOptionLabel?: string,
    autoContinuePlan?: boolean
  ) => Promise<boolean>;
  integrationStatus: IntegrationPublicStatus | null;
  refreshIntegrations: () => Promise<void>;
  integrationsConfig: Record<string, IntegrationConfigItem>;
  connectIntegration: (id: string, apiKey: string, secondaryValue?: string) => Promise<{ success: boolean; message?: string }>;
  disconnectIntegration: (id: string) => Promise<boolean>;
  connectedIntegrationsCount: number;
  configureSlack: (botToken: string, defaultChannel: string, signingSecret?: string) => Promise<{ success: boolean; error?: string }>;
  disconnectSlack: () => Promise<boolean>;
  configureDrive: (accessToken?: string, apiKey?: string, folderName?: string) => Promise<{ success: boolean; error?: string }>;
  disconnectDrive: () => Promise<boolean>;
  testSlackIntegration: (token: string) => Promise<{ ok: boolean; message: string }>;
  testDriveIntegration: (token?: string, apiKey?: string) => Promise<{ ok: boolean; message: string }>;
  approvals: HitlApprovalDetail[];
  pendingApprovalsCount: number;
  refreshApprovals: () => Promise<void>;
  demoProfiles: StartupProfile[];
  activeProfileId: string;
  applyDemoProfile: (profileId: string) => Promise<boolean>;
  generatePdfDeliverable: (title: string, content: string, subtitle?: string) => Promise<string | null>;
  isTourOpen: boolean;
  setIsTourOpen: React.Dispatch<React.SetStateAction<boolean>>;
  startTour: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_BRAIN_DATA: BrainData = {
  name: '',
  website: '',
  oneLiner: '',
  audience: '',
  problem: '',
  competitors: '',
  tone: '',
  avoidTone: '',
  pricing: '',
  goal: ''
};

const DEFAULT_RECENT_CHATS: ChatSession[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('foundry_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [activeView, setActiveView] = useState<ViewType>('chat');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('auto');
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedDocument[]>([]);
  const [brainData, setBrainData] = useState<BrainData>(DEFAULT_BRAIN_DATA);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('foundryos_onboarded_v1');
    } catch {
      return false;
    }
  });
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  const startTour = useCallback(() => {
    setActiveView('chat');
    setIsTourOpen(true);
  }, []);
  const [settingsSection, setSettingsSection] = useState<SettingsSectionType>('general');
  const [mcpServers, setMcpServers] = useState<McpServerInfo[]>([]);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [archivedDocuments, setArchivedDocuments] = useState<ArchivedDocumentItem[]>([]);
  const [approvals, setApprovals] = useState<HitlApprovalDetail[]>([]);
  const [demoProfiles, setDemoProfiles] = useState<StartupProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');

  // Persistent Recent Chats
  const [recentChats, setRecentChats] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('foundry_recent_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy dummy placeholder chats
          return parsed.filter(c => !c.id.startsWith('chat-hdlc') && !c.id.startsWith('chat-booths') && !c.id.startsWith('chat-avr') && !c.id.startsWith('chat-shoreline') && !c.id.startsWith('chat-song') && !c.id.startsWith('chat-network') && !c.id.startsWith('chat-sketch') && !c.id.startsWith('chat-session-plan') && !c.id.startsWith('chat-aesthetic') && !c.id.startsWith('chat-insta') && !c.id.startsWith('chat-assignment') && !c.id.startsWith('chat-backend-1'));
        }
      }
      return DEFAULT_RECENT_CHATS;
    } catch {
      return DEFAULT_RECENT_CHATS;
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('foundry_recent_chats', JSON.stringify(recentChats));
    } catch {
      // Ignored
    }
  }, [recentChats]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('foundry_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const refreshCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/credits?tenantId=default-tenant');
      if (res.ok) {
        const data: CreditStatus = await res.json();
        setCreditStatus(data);
      }
    } catch {
      // Offline fallback
    }
  }, []);

  const resetCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/credits/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: 'default-tenant' })
      });
      if (res.ok) {
        const data: CreditStatus = await res.json();
        setCreditStatus(data);
      }
    } catch {
      // Ignored
    }
  }, []);

  const refreshMcp = useCallback(async () => {
    try {
      const [mcpRes, toolsRes] = await Promise.all([
        fetch('/api/mcp/servers'),
        fetch('/api/tools')
      ]);
      if (mcpRes.ok) {
        const data = await mcpRes.json();
        setMcpServers(data.servers || []);
      }
      if (toolsRes.ok) {
        const data = await toolsRes.json();
        setTools(data.tools || []);
      }
    } catch {
      // Fallback
    }
  }, []);

  const refreshEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch {
      // Fallback
    }
  }, []);

  const fetchArchivedDocuments = useCallback(async (category?: string, query?: string) => {
    try {
      const params = new URLSearchParams({ tenantId: 'default-tenant' });
      if (category && category !== 'all') params.append('category', category);
      if (query) params.append('query', query);

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setArchivedDocuments(data.documents || []);
      }
    } catch {
      // Fallback
    }
  }, []);

  const uploadDocumentToArchive = useCallback(async (title: string, fileName: string, content: string) => {
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'default-tenant',
          title,
          fileName,
          content,
          category: 'uploaded'
        })
      });
      if (res.ok) {
        const doc: ArchivedDocumentItem = await res.json();
        setArchivedDocuments(prev => [doc, ...prev]);
        return doc;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const generatePdfInArchive = useCallback(async (title: string, content: string, subtitle?: string) => {
    try {
      const res = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'default-tenant',
          title,
          subtitle,
          content,
          author: 'FoundryOS AI'
        })
      });
      if (res.ok) {
        const doc: ArchivedDocumentItem = await res.json();
        setArchivedDocuments(prev => [doc, ...prev]);
        return doc;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const deleteArchivedDocument = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArchivedDocuments(prev => prev.filter(d => d.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const [integrationStatus, setIntegrationStatus] = useState<IntegrationPublicStatus | null>(null);

  const [integrationsConfig, setIntegrationsConfig] = useState<Record<string, IntegrationConfigItem>>(() => {
    try {
      const saved = localStorage.getItem('foundryos_integrations_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const refreshIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations?tenantId=default-tenant');
      if (res.ok) {
        const data: IntegrationPublicStatus = await res.json();
        setIntegrationStatus(data);
      }
    } catch {
      // Offline fallback
    }
  }, []);

  const connectIntegration = useCallback(async (id: string, apiKey: string, secondaryValue?: string) => {
    const nextItem: IntegrationConfigItem = {
      id,
      connected: true,
      apiKey: apiKey.trim(),
      secondaryValue: secondaryValue?.trim(),
      connectedAt: new Date().toISOString()
    };
    const nextConfig = { ...integrationsConfig, [id]: nextItem };
    setIntegrationsConfig(nextConfig);
    try {
      localStorage.setItem('foundryos_integrations_v1', JSON.stringify(nextConfig));
    } catch {}

    try {
      await fetch(`/api/integrations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          botToken: apiKey,
          accessToken: apiKey,
          secondaryValue,
          defaultChannel: secondaryValue || '#marketing',
          folderName: secondaryValue || 'FoundryOS Documents',
          tenantId: 'default-tenant'
        })
      });
      await refreshIntegrations();
    } catch {}

    return { success: true, message: `Connected successfully.` };
  }, [integrationsConfig, refreshIntegrations]);

  const disconnectIntegration = useCallback(async (id: string) => {
    const nextConfig = { ...integrationsConfig };
    delete nextConfig[id];
    setIntegrationsConfig(nextConfig);
    try {
      localStorage.setItem('foundryos_integrations_v1', JSON.stringify(nextConfig));
    } catch {}

    try {
      await fetch(`/api/integrations/${id}?tenantId=default-tenant`, { method: 'DELETE' });
      await refreshIntegrations();
    } catch {}

    return true;
  }, [integrationsConfig, refreshIntegrations]);

  const connectedIntegrationsCount = useMemo(() => {
    return Object.values(integrationsConfig).filter((i) => i.connected).length;
  }, [integrationsConfig]);

  const configureSlack = useCallback(async (botToken: string, defaultChannel: string, signingSecret?: string) => {
    try {
      const res = await fetch('/api/integrations/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, defaultChannel, signingSecret, tenantId: 'default-tenant' })
      });
      const data = (await safeJson(res)) as { success?: boolean; error?: string };
      await refreshIntegrations();
      return { success: Boolean(data.success), error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [refreshIntegrations]);

  const disconnectSlack = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/slack?tenantId=default-tenant', { method: 'DELETE' });
      const data = (await safeJson(res)) as { success?: boolean };
      await refreshIntegrations();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }, [refreshIntegrations]);

  const configureDrive = useCallback(async (accessToken?: string, apiKey?: string, folderName?: string) => {
    try {
      const res = await fetch('/api/integrations/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, apiKey, folderName, tenantId: 'default-tenant' })
      });
      const data = (await safeJson(res)) as { success?: boolean; error?: string };
      await refreshIntegrations();
      return { success: Boolean(data.success), error: data.error };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }, [refreshIntegrations]);

  const disconnectDrive = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/drive?tenantId=default-tenant', { method: 'DELETE' });
      const data = (await safeJson(res)) as { success?: boolean };
      await refreshIntegrations();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }, [refreshIntegrations]);

  const testSlackIntegration = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/integrations/test/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: token })
      });
      return (await res.json()) as { ok: boolean; message: string };
    } catch (err) {
      return { ok: false, message: String(err) };
    }
  }, []);

  const testDriveIntegration = useCallback(async (token?: string, apiKey?: string) => {
    try {
      const res = await fetch('/api/integrations/test/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, apiKey })
      });
      return (await res.json()) as { ok: boolean; message: string };
    } catch (err) {
      return { ok: false, message: String(err) };
    }
  }, []);

  const refreshApprovals = useCallback(async () => {
    try {
      const res = await fetch('/api/hitl/approvals');
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data.approvals)) {
          setApprovals(data.approvals as HitlApprovalDetail[]);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  const refreshDemoProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/profiles/demo');
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data.profiles)) {
          setDemoProfiles(data.profiles as StartupProfile[]);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  const applyDemoProfile = useCallback(async (profileId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/profiles/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (data.profile) {
          const p = data.profile as StartupProfile;
          setBrainData({
            name: p.name,
            website: p.website,
            oneLiner: p.oneLiner,
            audience: p.audience,
            problem: p.problem,
            competitors: p.competitors,
            tone: p.tone,
            avoidTone: p.avoidTone,
            pricing: p.pricing,
            goal: p.goal
          });
          setActiveProfileId(profileId);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const generatePdfDeliverable = useCallback(async (title: string, content: string, subtitle?: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle: subtitle || 'FoundryOS Autonomous Marketing Intelligence Brief',
          content,
          author: 'FoundryOS AI'
        })
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (data && (data as any).id) {
          await fetchArchivedDocuments();
          const downloadUrl = `/api/documents/${(data as any).id}/download`;
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = (data as any).fileName || `${title.replace(/\s+/g, '_')}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return downloadUrl;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, [fetchArchivedDocuments]);

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  useEffect(() => {
    refreshCredits();
    refreshEmployees();
    refreshMcp();
    fetchArchivedDocuments();
    refreshIntegrations();
    refreshApprovals();
    refreshDemoProfiles();
  }, [refreshCredits, refreshEmployees, refreshMcp, fetchArchivedDocuments, refreshIntegrations, refreshApprovals, refreshDemoProfiles]);

  const addAttachedFile = useCallback((file: AttachedDocument) => {
    if (attachedFiles.length >= 5) {
      return { success: false, error: 'Maximum 5 files can be attached at once.' };
    }
    setAttachedFiles(prev => [...prev, file]);
    return { success: true };
  }, [attachedFiles.length]);

  const removeAttachedFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAttachedFiles = useCallback(() => {
    setAttachedFiles([]);
  }, []);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
  }, []);

  const loadChatSession = useCallback((sessionId: string) => {
    const session = recentChats.find(s => s.id === sessionId);
    if (session) {
      if (session.messages && session.messages.length > 0) {
        setMessages(session.messages);
      } else {
        setMessages([
          {
            id: `msg-${session.id}-1`,
            sender: 'You',
            avatar: 'YOU',
            content: session.title,
            isUser: true,
            timestamp: session.createdAt
          },
          {
            id: `msg-${session.id}-2`,
            sender: session.agentName || 'FoundryOS AI',
            avatar: 'FOS',
            content: session.lastMessagePreview || `Session discussion for: ${session.title}`,
            isUser: false,
            timestamp: session.updatedAt
          }
        ]);
      }
      setSelectedAgentId(session.agentId || 'auto');
      setCurrentSessionId(session.id);
      setActiveView('chat');
    }
  }, [recentChats]);

  const deleteChatSession = useCallback((sessionId: string) => {
    setRecentChats(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const clearAllRecentChats = useCallback(() => {
    setRecentChats([]);
    setCurrentSessionId(null);
  }, []);

  const saveBrainData = useCallback(async (data: BrainData) => {
    try {
      const res = await fetch('/api/brain/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'default-tenant',
          name: data.name,
          website: data.website,
          oneLiner: data.oneLiner,
          audience: data.audience,
          problem: data.problem,
          competitors: data.competitors,
          tone: data.tone,
          avoidTone: data.avoidTone,
          pricing: data.pricing,
          goal: data.goal
        })
      });
      if (res.ok) {
        setBrainData(data);
        return { success: true };
      }
      const err = await safeJson(res);
      return { success: false, error: (err.error as string) || 'Failed to save brain setup' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }, []);

  const brainHealth: BrainHealth = React.useMemo(() => {
    const fields = [
      { key: 'name', label: 'Company Name' },
      { key: 'website', label: 'Website URL' },
      { key: 'oneLiner', label: 'One Liner' },
      { key: 'audience', label: 'Target Audience' },
      { key: 'problem', label: 'Core Problem' },
      { key: 'competitors', label: 'Competitors' },
      { key: 'tone', label: 'Brand Voice' },
      { key: 'avoidTone', label: 'Negative Constraints' },
      { key: 'pricing', label: 'Pricing Model' },
      { key: 'goal', label: 'Primary Goal' }
    ];
    const configured: string[] = [];
    const missing: string[] = [];
    fields.forEach(f => {
      const val = (brainData as any)[f.key];
      if (val && String(val).trim().length > 0) {
        configured.push(f.label);
      } else {
        missing.push(f.label);
      }
    });

    const docCount = archivedDocuments.length + attachedFiles.length;
    const sessionCount = recentChats.length;
    const artifactCount = artifacts.length;
    const integrationsCount = connectedIntegrationsCount;

    const anchorsScore = Math.min(40, configured.length * 4);
    const docsScore = Math.min(30, docCount * 10);
    const executionScore = Math.min(20, (sessionCount + artifactCount) * 5);
    const integrationScore = Math.min(10, integrationsCount * 5);

    const completenessPercent = Math.min(100, Math.max(0, Math.round(anchorsScore + docsScore + executionScore + integrationScore)));

    let levelLabel = 'Emerging Base';
    if (completenessPercent >= 80) levelLabel = 'Sovereign AGI';
    else if (completenessPercent >= 55) levelLabel = 'Deeply Informed';
    else if (completenessPercent >= 25) levelLabel = 'Context Active';

    const totalSignals = configured.length + docCount + sessionCount + artifactCount + integrationsCount;

    return {
      completenessPercent,
      configuredFields: configured,
      missingFields: missing,
      docCount,
      memoryCount: sessionCount + artifactCount,
      anchorsCount: configured.length,
      totalSignals,
      levelLabel
    };
  }, [brainData, archivedDocuments, attachedFiles, recentChats, artifacts, connectedIntegrationsCount]);

  const executeAgentRun = useCallback(async (promptText: string, agentOverride?: string) => {
    const targetAgentId = agentOverride || selectedAgentId;
    const currentFiles = [...attachedFiles];

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'You',
      avatar: 'YOU',
      content: promptText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    clearAttachedFiles();
    setIsExecuting(true);

    try {
      const payload: Record<string, unknown> = {
        tenantId: 'default-tenant',
        task: promptText,
        enableTools: true
      };

      if (targetAgentId && targetAgentId !== 'auto') {
        payload.employeeId = targetAgentId;
      }

      if (currentFiles.length === 1) {
        payload.attachedDocument = {
          fileName: currentFiles[0].fileName,
          content: currentFiles[0].content
        };
      } else if (currentFiles.length > 1) {
        payload.attachedDocuments = currentFiles.map(f => ({
          fileName: f.fileName,
          content: f.content
        }));
      }

      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 429) {
        addMessage({
          sender: 'System Guardrail',
          avatar: 'SYS',
          content: '⚠️ **Daily Compute Capacity Reached (100% Utilized)**.\n\nYour daily multi-agent compute allowance has been fully allocated. Capacity resets automatically at midnight UTC.',
          isUser: false
        });
        await refreshCredits();
        return;
      }

      if (!res.ok) {
        const errJson = await safeJson(res);
        addMessage({
          sender: 'FoundryOS',
          avatar: 'FOS',
          content: `Execution error: ${(errJson.error as string) || 'Server error'}`,
          isUser: false
        });
        return;
      }

      const data = await res.json();
      const employee = employees.find(e => (e.identity?.id || e.id) === data.employeeId);
      const senderName = (employee ? (employee.identity?.name || employee.name) : (data.employeeId || 'FoundryOS AI')) || 'FoundryOS AI';
      const senderAvatar = (employee ? (employee.identity?.avatar || employee.avatar) : 'AI') || 'AI';

      const responseArtifacts: Artifact[] = [];
      if (data.artifacts && Array.isArray(data.artifacts)) {
        data.artifacts.forEach((art: any) => {
          const newArt: Artifact = {
            id: art.id || `art-${Date.now()}`,
            title: art.title || 'Marketing Deliverable',
            type: art.type || 'Deliverable',
            agentId: data.employeeId,
            content: art.content || art.markdown || '',
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          responseArtifacts.push(newArt);
          setArtifacts(prev => [newArt, ...prev]);
        });
      }

      // CRITICAL FIX: Safe conversion of output to Markdown string to prevent any black-screen crash!
      const rawOutput = data.output !== undefined ? data.output : (data.response || 'Task executed successfully.');
      const formattedContent = typeof rawOutput === 'string'
        ? rawOutput
        : formatAgentOutputToMarkdown(rawOutput);

      const agentMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: senderName,
        avatar: senderAvatar,
        content: formattedContent,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: data.toolCalls,
        tokenUsage: {
          promptTokens: data.tokenReport?.systemPromptTokens,
          completionTokens: data.tokenReport?.completionBudget,
          totalTokens: data.tokensUsed || data.tokenReport?.totalTokensUsed,
          creditsDeducted: data.creditUsage?.creditsDeducted ?? data.creditsDeducted ?? 0
        },
        artifacts: responseArtifacts,
        pendingApproval: data.pendingApproval,
        isLightweight: Boolean(data.isLightweight),
        runtimeMode: data.runtimeMode,
        routedBy: data.routedBy,
        routingReason: data.routingReason,
        suggestions: data.suggestions,
        isStreaming: true
      };

      if (data.creditUsage) {
        setCreditStatus({
          tenantId: 'default-tenant',
          remainingCredits: data.creditUsage.creditsRemaining,
          creditsRemaining: data.creditUsage.creditsRemaining,
          maxDailyCredits: data.creditUsage.dailyLimit,
          dailyLimit: data.creditUsage.dailyLimit,
          tokensUsedToday: data.creditUsage.tokensConsumed || 0,
          dailyTokensRemaining: data.creditUsage.creditsRemaining * 800,
          tokensPerCredit: 800,
          isExhausted: data.creditUsage.creditsRemaining <= 0,
          resetsAt: new Date(Date.now() + 86400000).toISOString()
        } as any);
      }

      setMessages(prev => {
        const nextMessages = [...prev, agentMessage];

        // Session Persistence into Recent Chats
        const sessionId = currentSessionId || `session-${Date.now()}`;
        if (!currentSessionId) setCurrentSessionId(sessionId);

        const isAgentSpecific = Boolean(targetAgentId && targetAgentId !== 'auto' && targetAgentId !== 'foundryos-assistant');
        const agentDisplayName = employee ? (employee.identity?.name || employee.name || 'Specialist') : (targetAgentId === 'auto' ? 'Auto Route' : 'Specialist Agent');

        setRecentChats(existingChats => {
          const existingIdx = existingChats.findIndex(s => s.id === sessionId);
          const sessionData: ChatSession = {
            id: sessionId,
            title: promptText.slice(0, 55) + (promptText.length > 55 ? '...' : ''),
            agentId: targetAgentId || 'auto',
            agentName: agentDisplayName,
            isAgentSpecific,
            messages: nextMessages,
            messageCount: nextMessages.length,
            lastMessagePreview: formattedContent.slice(0, 90).replace(/[#*`]/g, '') + '...',
            createdAt: existingIdx >= 0 ? existingChats[existingIdx].createdAt : new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          if (existingIdx >= 0) {
            const updated = [...existingChats];
            updated[existingIdx] = sessionData;
            return updated;
          }
          return [sessionData, ...existingChats];
        });

        return nextMessages;
      });

      await refreshCredits();
      refreshApprovals();
    } catch (err) {
      addMessage({
        sender: 'FoundryOS',
        avatar: 'FOS',
        content: `Communication error: ${String(err)}`,
        isUser: false
      });
    } finally {
      setIsExecuting(false);
    }
  }, [selectedAgentId, attachedFiles, addMessage, clearAttachedFiles, employees, refreshCredits, refreshApprovals, currentSessionId]);

  const resolveHitlApproval = useCallback(async (
    approvalId: string,
    decision: 'approve' | 'reject',
    comment?: string,
    selectedOptionId?: string,
    customAnswer?: string,
    chosenOptionLabel?: string,
    _autoContinuePlan: boolean = false
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/hitl/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId,
          decision,
          comment,
          selectedOptionId,
          customAnswer,
          reviewer: 'founder'
        })
      });

      if (res.ok) {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.pendingApproval && msg.pendingApproval.approvalId === approvalId) {
              return {
                ...msg,
                pendingApproval: {
                  ...msg.pendingApproval,
                  status: decision === 'approve' ? 'approved' : 'rejected',
                  selectedOptionId,
                  customAnswer,
                  decisionComment: comment
                }
              };
            }
            return msg;
          })
        );
        await refreshApprovals();

        const chosenDirective = customAnswer
          ? `Custom Direction: "${customAnswer}"`
          : (chosenOptionLabel ? `Selected Strategy: "${chosenOptionLabel}"` : (selectedOptionId ? `Option: ${selectedOptionId}` : 'Approved direction'));

        addMessage({
          isUser: false,
          sender: 'Foundry Governance',
          avatar: 'SYS',
          content: decision === 'approve'
            ? `Strategic direction confirmed: **${chosenDirective}**.\n\nApproval recorded. Workspace is ready for your next instruction.`
            : `Direction rejected${comment ? `: *"${comment}"*` : ''}. Proposal cancelled.`
        });

        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [refreshApprovals, addMessage]);

  const value: AppContextValue = {
    theme,
    toggleTheme,
    activeView,
    setActiveView,
    selectedAgentId,
    setSelectedAgentId,
    creditStatus,
    refreshCredits,
    resetCredits,
    employees,
    messages,
    addMessage,
    clearMessages,
    isExecuting,
    attachedFiles,
    addAttachedFile,
    removeAttachedFile,
    clearAttachedFiles,
    brainData,
    setBrainData,
    brainHealth,
    saveBrainData,
    artifacts,
    activeArtifact,
    setActiveArtifact,
    isArtifactModalOpen,
    setIsArtifactModalOpen,
    isOnboardingOpen,
    setIsOnboardingOpen,
    settingsSection,
    setSettingsSection,
    mcpServers,
    tools,
    refreshMcp,
    executeAgentRun,
    recentChats,
    currentSessionId,
    loadChatSession,
    deleteChatSession,
    clearAllRecentChats,
    archivedDocuments,
    fetchArchivedDocuments,
    uploadDocumentToArchive,
    generatePdfInArchive,
    deleteArchivedDocument,
    resolveHitlApproval,
    integrationStatus,
    refreshIntegrations,
    integrationsConfig,
    connectIntegration,
    disconnectIntegration,
    connectedIntegrationsCount,
    configureSlack,
    disconnectSlack,
    configureDrive,
    disconnectDrive,
    testSlackIntegration,
    testDriveIntegration,
    approvals,
    pendingApprovalsCount,
    refreshApprovals,
    demoProfiles,
    activeProfileId,
    applyDemoProfile,
    generatePdfDeliverable,
    isTourOpen,
    setIsTourOpen,
    startTour
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
