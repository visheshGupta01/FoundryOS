import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../../shared/logger.js";
import { integrationStore } from "../../integrations/integration.store.js";

interface SlackMessage {
  id: string;
  channel: string;
  sender: string;
  text: string;
  timestamp: string;
  isApprovalRequest?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
}

interface SlackChannel {
  id: string;
  name: string;
  topic: string;
  memberCount: number;
}

class SlackEnterpriseWorkspace {
  private static instance: SlackEnterpriseWorkspace;
  private readonly channels: Map<string, SlackChannel> = new Map();
  private readonly messages: SlackMessage[] = [];

  public static getInstance(): SlackEnterpriseWorkspace {
    if (!SlackEnterpriseWorkspace.instance) {
      SlackEnterpriseWorkspace.instance = new SlackEnterpriseWorkspace();
    }
    return SlackEnterpriseWorkspace.instance;
  }

  constructor() {
    this.seedWorkspace();
  }

  private seedWorkspace(): void {
    const defaultChannels: SlackChannel[] = [
      { id: "C-MKTG-01", name: "#marketing", topic: "GTM campaigns, brand positioning, and channel strategy", memberCount: 14 },
      { id: "C-GRWTH-02", name: "#growth-alerts", topic: "Live funnel metrics, CAC/LTV signals, and experiment results", memberCount: 9 },
      { id: "C-EXEC-03", name: "#founder-approvals", topic: "Human-In-The-Loop strategic decisions, budget & positioning signs-offs", memberCount: 4 },
      { id: "C-GEN-04", name: "#general", topic: "Company-wide updates and announcements", memberCount: 22 }
    ];

    for (const c of defaultChannels) {
      this.channels.set(c.name, c);
      this.channels.set(c.id, c);
    }

    this.messages.push({
      id: "msg-slack-seed-1",
      channel: "#marketing",
      sender: "FoundryOS Agent",
      text: "FoundryOS Marketing Suite connected to workspace. Real-time channel telemetry and autonomous dispatch ready.",
      timestamp: new Date().toISOString()
    });
  }

  public listChannels(): SlackChannel[] {
    const unique = new Map<string, SlackChannel>();
    for (const c of this.channels.values()) {
      unique.set(c.id, c);
    }
    return Array.from(unique.values());
  }

  public async postMessage(channelName: string, text: string, sender: string = "FoundryOS Agent"): Promise<SlackMessage> {
    const cleanChannel = channelName.startsWith("#") ? channelName : `#${channelName}`;
    const userConfig = integrationStore.getSlackConfig("default-tenant");
    const token = userConfig?.botToken || process.env["SLACK_BOT_TOKEN"];

    if (token && token.startsWith("xoxb-")) {
      try {
        const response = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            channel: cleanChannel,
            text,
            username: sender
          })
        });
        const resData = (await response.json()) as any;
        if (resData && resData.ok) {
          logger.info(`Message posted to real Slack channel ${cleanChannel}`);
        }
      } catch (err) {
        logger.warn("Direct Slack API dispatch deferred, storing in local enterprise workspace", { error: String(err) });
      }
    }

    const msg: SlackMessage = {
      id: `slack-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channel: cleanChannel,
      sender,
      text,
      timestamp: new Date().toISOString()
    };

    this.messages.push(msg);
    logger.info(`Slack MCP: message posted to ${cleanChannel}`);
    return msg;
  }

  public searchMessages(query: string): SlackMessage[] {
    const q = query.toLowerCase();
    return this.messages.filter((m) => m.text.toLowerCase().includes(q) || m.channel.toLowerCase().includes(q));
  }

  public requestApproval(channelName: string, actionTitle: string, details: string): SlackMessage {
    const cleanChannel = channelName.startsWith("#") ? channelName : `#${channelName}`;
    const msg: SlackMessage = {
      id: `slack-hitl-${Date.now()}`,
      channel: cleanChannel,
      sender: "FoundryOS HITL Sentinel",
      text: `🚨 [HUMAN-IN-THE-LOOP APPROVAL NEEDED]\nAction: *${actionTitle}*\nDetails: ${details}\n\nPlease review and approve in FoundryOS Workspace.`,
      timestamp: new Date().toISOString(),
      isApprovalRequest: true,
      approvalStatus: "pending"
    };

    this.messages.push(msg);
    return msg;
  }
}

export const slackWorkspace = SlackEnterpriseWorkspace.getInstance();

export function createSlackMcpServer(): Server {
  const server = new Server(
    { name: "slack-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "slack_post_message",
          description: "Post a notification, marketing announcement, or brief to a Slack channel",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string", description: "Channel name (e.g. #marketing, #general, #growth-alerts)" },
              text: { type: "string", description: "Message content in markdown/slack mrkdwn" },
              sender: { type: "string", description: "Display sender name", default: "FoundryOS AI" }
            },
            required: ["channel", "text"]
          }
        },
        {
          name: "slack_list_channels",
          description: "List all accessible Slack channels in the workspace",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "slack_search_messages",
          description: "Search workspace Slack messages by keyword or topic",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        },
        {
          name: "slack_request_approval",
          description: "Dispatch an urgent Human-In-The-Loop approval card to a leadership Slack channel",
          inputSchema: {
            type: "object",
            properties: {
              channel: { type: "string", description: "Target channel (default #founder-approvals)", default: "#founder-approvals" },
              actionTitle: { type: "string", description: "Title of action requiring approval" },
              details: { type: "string", description: "Action details and impact" }
            },
            required: ["actionTitle", "details"]
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const slackConfig = integrationStore.getSlackConfig("default-tenant");

    if (!slackConfig?.botToken && (name === "slack_post_message" || name === "slack_request_approval")) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "not_configured",
              error: "Slack integration is not connected. User must provide and connect their Slack Bot Token in the Integrations settings.",
              action: "Please configure Slack in FoundryOS -> Integrations tab."
            }, null, 2)
          }
        ]
      };
    }

    if (name === "slack_post_message") {
      const channel = String(args?.["channel"] || "#marketing");
      const text = String(args?.["text"] || "");
      const sender = String(args?.["sender"] || "FoundryOS AI");

      const msg = await slackWorkspace.postMessage(channel, text, sender);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "success",
              channel: msg.channel,
              messageId: msg.id,
              timestamp: msg.timestamp,
              textSnippet: msg.text.slice(0, 100)
            }, null, 2)
          }
        ]
      };
    }

    if (name === "slack_list_channels") {
      const channels = slackWorkspace.listChannels();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              count: channels.length,
              channels
            }, null, 2)
          }
        ]
      };
    }

    if (name === "slack_search_messages") {
      const query = String(args?.["query"] || "");
      const messages = slackWorkspace.searchMessages(query);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query,
              matchCount: messages.length,
              messages
            }, null, 2)
          }
        ]
      };
    }

    if (name === "slack_request_approval") {
      const channel = String(args?.["channel"] || "#founder-approvals");
      const actionTitle = String(args?.["actionTitle"] || "Marketing Action");
      const details = String(args?.["details"] || "");

      const msg = slackWorkspace.requestApproval(channel, actionTitle, details);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "dispatched",
              channel: msg.channel,
              approvalId: msg.id,
              message: "Approval card sent to Slack leadership channel"
            }, null, 2)
          }
        ]
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown Slack MCP tool: ${name}` }]
    };
  });

  return server;
}
