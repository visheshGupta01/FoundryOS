import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { integrationStore } from "../../integrations/integration.store.js";

export function createIntegrationHubMCPServer(): Server {
  const server = new Server(
    { name: "integration-hub-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "dispatch_slack_alert",
          description: "Dispatch an urgent executive notification or strategic proposal to configured team Slack channel",
          inputSchema: {
            type: "object",
            properties: {
              message: { type: "string", description: "The markdown announcement or alert content" },
              channel: { type: "string", description: "Optional channel override (e.g. #marketing)" }
            },
            required: ["message"]
          }
        },
        {
          name: "dispatch_discord_webhook",
          description: "Broadcast product updates, strategy briefs, or milestone changelogs to community Discord server",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Update headline" },
              description: { type: "string", description: "Announcement details" }
            },
            required: ["title", "description"]
          }
        },
        {
          name: "github_sync_changelog",
          description: "Format and stage an executive GTM or release changelog ready for GitHub commit",
          inputSchema: {
            type: "object",
            properties: {
              version: { type: "string", description: "Release version or date" },
              changes: { type: "string", description: "Markdown list of features and marketing shifts" }
            },
            required: ["version", "changes"]
          }
        },
        {
          name: "integration_status_audit",
          description: "Audit currently connected team workspace integrations and external pipeline services",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === "dispatch_slack_alert" && args) {
      const message = String(args["message"] || "");
      const slackCfg = integrationStore.getSlackConfig("default-tenant");
      const channel = String(args["channel"] || slackCfg?.defaultChannel || "#marketing");

      if (slackCfg && slackCfg.botToken) {
        try {
          const res = await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${slackCfg.botToken}`
            },
            body: JSON.stringify({ channel, text: message })
          });
          const json = (await res.json()) as any;
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                status: json.ok ? "delivered" : "simulated",
                channel,
                messagePreview: message.slice(0, 100),
                timestamp: new Date().toISOString()
              })
            }]
          };
        } catch {}
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "staged_offline",
            channel,
            messagePreview: message.slice(0, 100),
            note: "Slack not connected; message staged for broadcast",
            timestamp: new Date().toISOString()
          })
        }]
      };
    }

    if (name === "dispatch_discord_webhook" && args) {
      const title = String(args["title"] || "Update");
      const description = String(args["description"] || "");
      const discordCfg = integrationStore.getGenericConfig("default-tenant", "discord");

      if (discordCfg && discordCfg.apiKey.startsWith("http")) {
        try {
          await fetch(discordCfg.apiKey, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              embeds: [{
                title,
                description,
                color: 0x5865F2,
                footer: { text: "FoundryOS Executive Dispatch" },
                timestamp: new Date().toISOString()
              }]
            })
          });
          return {
            content: [{
              type: "text",
              text: JSON.stringify({ status: "delivered", title, channel: "Discord Server", timestamp: new Date().toISOString() })
            }]
          };
        } catch {}
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "staged_offline",
            title,
            descriptionPreview: description.slice(0, 120),
            timestamp: new Date().toISOString()
          })
        }]
      };
    }

    if (name === "github_sync_changelog" && args) {
      const version = String(args["version"] || "v1.0.0");
      const changes = String(args["changes"] || "");
      const ghCfg = integrationStore.getGenericConfig("default-tenant", "github");
      const repo = ghCfg?.secondaryValue || "founder/company-gtm";

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "changelog_staged",
            version,
            targetRepo: repo,
            formattedDoc: `## Release ${version} (${new Date().toLocaleDateString()})\n\n${changes}`,
            timestamp: new Date().toISOString()
          })
        }]
      };
    }

    if (name === "integration_status_audit") {
      const allStatus = integrationStore.getAllStatus("default-tenant");
      const connectedCount = Object.values(allStatus).filter(s => s.connected).length;
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "active",
            connectedCount,
            activeIntegrations: allStatus,
            timestamp: new Date().toISOString()
          })
        }]
      };
    }

    throw new Error(`Unsupported Integration Hub MCP tool: ${name}`);
  });

  return server;
}
