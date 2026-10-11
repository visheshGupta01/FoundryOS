# Complete Guide: Model Context Protocol (MCP) in FoundryOS

This guide explains what the **Model Context Protocol (MCP)** is, how FoundryOS leverages it to empower AI employees with real-time tools, and provides a step-by-step tutorial on how to build, run, and connect custom MCP servers.

---

## 1. What is the Model Context Protocol (MCP)?

The **Model Context Protocol (MCP)** is an open standard developed to standardize how AI models and agent frameworks interact with external data sources, enterprise tools, and services.

Historically, every agent framework built custom, proprietary function-calling wrappers. MCP standardizes this with a single, universal protocol:

```
┌─────────────────────────────────┐
│     FoundryOS AI Employees      │
│  (Market Analyst, Strategist)   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│      FoundryOS MCP Client       │
│      (`src/backend/mcp/`)       │
└────────────────┬────────────────┘
                 │  (JSON-RPC 2.0 over Stdio or SSE)
     ┌───────────┼───────────┬───────────┐
     ▼           ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Market  │ │   SEO   │ │ Growth  │ │ Brain   │
│ Intel   │ │ & Comp  │ │ & GTM   │ │ Memory  │
│ Server  │ │ Server  │ │ Server  │ │ Server  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### The Three MCP Primitives
1. **Tools**: Callable functions that allow AI models to perform actions (e.g. search the web, calculate CAC/LTV, audit SEO).
2. **Resources**: Read-only contextual data documents (e.g. company profiles, customer interviews, database schemas).
3. **Prompts**: Pre-configured prompt templates and multi-step workflows.

---

## 2. How MCP Works Under the Hood

MCP relies on the standard **JSON-RPC 2.0** message specification. Communication occurs over transports:
- **`stdio`**: The host application spawns the MCP server as a subprocess and communicates via standard input (`stdin`) and standard output (`stdout`). This provides strict OS-level isolation, sandboxing, and zero-network overhead.
- **`SSE` (Server-Sent Events) / HTTP**: Transports messages over streaming HTTP. Ideal for remote microservices.
- **`InMemoryTransport`**: Connects linked client-server transport pairs within the same Node.js process with zero serialization lag.

### The Tool Lifecycle
1. **Handshake (`initialize`)**: Client sends client info and protocol version; Server responds with capabilities.
2. **Discovery (`tools/list`)**: Client queries the server for its available tools. The server returns tool names, descriptions, and input schemas formatted in JSON Schema.
3. **Registration**: FoundryOS registers all discovered tools directly into `toolRegistry`.
4. **Execution (`tools/call`)**: When an agent invokes a tool, the client dispatches `{ name, arguments }` to the server. The server executes the logic and returns `{ content: [{ type: "text", text: "..." }] }`.

---

## 3. Built-in Specialized MCP Servers in FoundryOS

FoundryOS comes pre-configured with **4 specialized MCP servers** located in `src/backend/mcp/servers/`:

| Server Name | Identifier | Exposed Tools | Purpose |
| :--- | :--- | :--- | :--- |
| **Market Intelligence** | `market-intel-mcp` | `web_search`, `exa_search`, `tech_trends`, `fetch_page_content` | Real-time web search (DuckDuckGo + Exa fallback), HackerNews/Reddit startup trend queries, and page scrapers. |
| **SEO & Competitor Audit** | `seo-competitor-mcp` | `seo_audit`, `keyword_suggester`, `competitor_pricing_audit` | Keyword intent generation, title/meta tag SERP checks, and competitor pricing teardowns. |
| **Growth & GTM Analytics** | `growth-gtm-mcp` | `cac_ltv_calculator`, `funnel_benchmarks`, `value_prop_evaluator` | SaaS unit economics, payback periods, industry conversion baselines, and buzzword stress-testing. |
| **Foundry Brain Memory** | `foundry-brain-mcp` | `query_brain_context`, `propose_brain_memory` | Exposes FoundryOS persistent company context, ICPs, and validated learnings over the MCP standard. |

---

## 4. Step-by-Step: How to Build Your Own Custom MCP Server

Here is how you can write a standalone custom MCP server in TypeScript using `@modelcontextprotocol/sdk`.

A reference implementation is included in [src/backend/mcp/example.server.ts](file:///run/media/wyrm/Files/FoundryOs/src/backend/mcp/example.server.ts).

### Step 1: Initialize the Server
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "custom-growth-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);
```

### Step 2: Register Tool Definitions (`ListToolsRequestSchema`)
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_tagline",
        description: "Generate 3 high-converting marketing taglines for a product",
        inputSchema: {
          type: "object",
          properties: {
            productName: { type: "string", description: "Name of the product" },
            targetAudience: { type: "string", description: "Target audience" }
          },
          required: ["productName", "targetAudience"]
        }
      }
    ]
  };
});
```

### Step 3: Handle Tool Invocations (`CallToolRequestSchema`)
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "generate_tagline") {
    const product = String(args?.["productName"] || "Product");
    const audience = String(args?.["targetAudience"] || "founders");

    const taglines = [
      `${product}: The unfair advantage for ${audience}.`,
      `Stop wasting hours. Let ${product} do the heavy lifting.`,
      `The easiest way for ${audience} to launch and scale.`
    ];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ product, audience, taglines }, null, 2)
        }
      ]
    };
  }

  return {
    isError: true,
    content: [{ type: "text", text: `Tool not found: ${name}` }]
  };
});
```

### Step 4: Connect Stdio Transport
```typescript
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((err) => {
  process.stderr.write(`MCP server error: ${String(err)}\n`);
  process.exit(1);
});
```

---

## 5. How to Connect a New MCP Server to FoundryOS

### Option A: Connect Dynamically via API
FoundryOS provides a dedicated endpoint to register any external command-line or stdio MCP server:

```bash
curl -X POST http://localhost:3000/api/mcp/servers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-tagline-mcp",
    "name": "Tagline Generator MCP",
    "command": "node",
    "args": ["dist/backend/mcp/example.server.js"],
    "description": "Custom tagline generator"
  }'
```

### Option B: Connect Popular Community MCP Servers
You can connect standard community MCP packages directly via `npx`:

#### 1. GitHub MCP Server
Allows AI employees to inspect repositories, issues, and PRs:
```json
{
  "id": "github-mcp",
  "name": "GitHub MCP",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_yourTokenHere"
  }
}
```

#### 2. PostgreSQL MCP Server
Allows AI employees to query marketing databases and customer analytics:
```json
{
  "id": "postgres-mcp",
  "name": "PostgreSQL MCP",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://foundry:foundry_pass@localhost:5432/foundry_os"]
}
```

#### 3. Brave Search MCP Server
Alternative web search engine:
```json
{
  "id": "brave-search-mcp",
  "name": "Brave Search MCP",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "your_api_key_here"
  }
}
```

#### 4. Filesystem MCP Server
Allows agents to safely read files in designated directories:
```json
{
  "id": "filesystem-mcp",
  "name": "Local Filesystem MCP",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/docs"]
}
```

---

## 6. Daily Credit System & Token Budget

FoundryOS implements a built-in daily credit allocation to ensure predictable performance and guard against runaway loops:

- **Daily Allowance**: **100 Credits** per tenant per day.
- **Conversion Rate**: **1 Credit = 800 Tokens** (equivalent to **80,000 tokens per day**).
- **Automated Deduction**: When an agent executes a turn, total tokens (`prompt tokens + completion tokens`) are tracked. Credits are deducted via `Math.ceil(tokens / 800)`.
- **Exhaustion Guardrail**: If balance reaches 0, execution is blocked with HTTP 429 `CREDIT_LIMIT_EXCEEDED` until the daily reset.
- **Reset Schedule**: Credits automatically reset every day at `00:00 UTC`.
- **API Status Endpoint**: `GET /api/credits?tenantId=...` returns the current credit balance, tokens consumed today, and ISO timestamp for next reset.
- **Admin/Dev Reset**: `POST /api/credits/reset` resets the tenant's daily ledger to 100 credits.
