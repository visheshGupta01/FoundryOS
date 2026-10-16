# FoundryOS

<p align="center">
  <strong>Local-First Autonomous AI Specialist Team & Enterprise Operations Platform</strong><br>
  <em>Powered by Ollama, Model Context Protocol (MCP), 7-Layer Semantic Brain RAG, and Human-In-The-Loop Governance</em>
</p>

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Complete System Architecture](#complete-system-architecture)
3. [Autonomous AI Specialist Team](#autonomous-ai-specialist-team)
4. [Model Context Protocol (MCP) Infrastructure](#model-context-protocol-mcp-infrastructure)
   - [MCP Architecture & Transports](#mcp-architecture--transports)
   - [All Connected MCP Servers & Tool Schemas](#all-connected-mcp-servers--tool-schemas)
5. [Builtin Tool Plugins & Extensible Registry](#builtin-tool-plugins--extensible-registry)
   - [Real-Time Tracking & Telemetry Tools](#real-time-tracking--telemetry-tools)
   - [Web Search & Intelligence Tools](#web-search--intelligence-tools)
   - [Brain & Document Vault Tools](#brain--document-vault-tools)
6. [Company Brain: 7-Layer Semantic RAG](#company-brain-7-layer-semantic-rag)
7. [Human-In-The-Loop (HITL) Steering & Governance](#human-in-the-loop-hitl-steering--governance)
8. [Dynamic Visual Chart Engines](#dynamic-visual-chart-engines)
9. [Modern Web Client & Landing Page Experience](#modern-web-client--landing-page-experience)
10. [Authentication, Security & Tenant Isolation](#authentication-security--tenant-isolation)
11. [Project Directory Structure](#project-directory-structure)
12. [Getting Started & Local Setup](#getting-started--local-setup)
13. [Available Scripts & Testing](#available-scripts--testing)

---

## Executive Overview

**FoundryOS** is an autonomous AI operations platform that deploys an elite, specialized team of AI employees to execute research, competitive teardowns, brand positioning, and go-to-market funnels. 

Unlike conventional cloud-tethered wrapper apps, FoundryOS is engineered as a **local-first, privacy-preserving enterprise runtime**:
- **Zero Cloud LLM Billing / Zero Data Leakage**: Powered natively by local **Ollama** (`llama3.2:1b` for reasoning, `nomic-embed-text` for vector embeddings).
- **Model Context Protocol (MCP) First**: Connects specialized tools across standard JSON-RPC 2.0 transports (Stdio & In-Memory).
- **7-Layer Institutional Memory**: Persistent Company Brain backed by PostgreSQL and `pgvector` with HNSW cosine similarity search.
- **Human-In-The-Loop (HITL) Steering**: Multi-path strategic branching where critical actions are paused for human executive steering.

---

## Complete System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FoundryOS Modern Web UI                                  │
│   (React + TypeScript + Vite + Vanilla CSS Glassmorphism + Dark/Light Mode)            │
│   • Interactive Hero Canvas & Glowing Circuit Brain Shader                             │
│   • Live Interactive Agent Simulator & ROI Profitability Calculator                   │
│   • Apple-Inspired Bento Showcase Grid & Pricing Matrix                                │
│   • Multi-Document Drag & Drop Uploader (Up to 5 PDFs / Briefs per Run)               │
│   • Real-Time Thought Streaming, Execution Blobs & Markdown Deliverables               │
│   • HITL Strategic Branching Gates (3 Paths + Custom Director Override)               │
│   • Tenant Settings, API Key Management & Token Quota Telemetry                        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / SSE / REST
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                              Express Gateway & Core API                                │
│   • JWT Auth & Multi-Tenant Scoping             • PDF Deliverable Export Engine        │
│   • Distributed BullMQ Task Queues (Redis)     • Rate Limiting & Token Accounting     │
└─────────────────────┬─────────────────────┬─────────────────────┬──────────────────────┘
                      │                     │                     │
┌─────────────────────▼───────┐ ┌───────────▼───────────┐ ┌───────▼──────────────────────┐
│   Autonomous Agent Engine   │ │     Company Brain     │ │ Model Context Protocol (MCP) │
│ • Maya Lin (Market Intel)   │ │  (7-Layer Vector RAG) │ │ 6 Active Servers             │
│ • Alex Chen (Competitor)    │ │ • pgvector HNSW Index │ │ • Market Intel Server        │
│ • Marcus Vance (Strategist) │ │ • Token Budget Engine │ │ • SEO & Competitor Server    │
│ • Elena Rostova (GTM Funnel)│ │ • Context Package     │ │ • Growth & GTM Server        │
│ • Foundry Assistant (Ops)   │ │ • Memory Proposal Hub │ │ • Brain Memory Server        │
│ • Dynamic Synthesizer       │ │ • Institutional Graph │ │ • Document Archive Server    │
│ • Direct & Auto Routing     │ │ • 1536-dim Embeddings │ │ • Integration Hub Server     │
└─────────────────────┬───────┘ └───────────┬───────────┘ └───────┬──────────────────────┘
                      │                     │                     │
┌─────────────────────▼─────────────────────▼─────────────────────▼──────────────────────┐
│                    Local-First LLM & Tool Execution Layer                              │
│   • Primary Chat Model: Local Ollama (llama3.2:1b @ localhost:11434)                  │
│   • Local Embeddings: Ollama nomic-embed-text (1536 dimensions)                        │
│   • Extensible Tool Registry: 19 Built-in Realtime Tracking & Scraping Plugins         │
│   • Cloud Session Persistence: TrueForge Agent Runtime Harness                        │
│   • Graceful Fallback: Deterministic Resilient Execution State Machine                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Autonomous AI Specialist Team

FoundryOS replaces generic "chatbots" with a team of pre-configured, specialized AI employees possessing distinct operating contracts, system prompts, required context layers, tool sets, and approval rules:

| Specialist | Identity | Role & Mandate | Key Tools Connected | Approval Gate |
|---|---|---|---|---|
| **Maya Lin** | `market-research-analyst` | **Senior Market Intelligence Specialist**<br>TAM/SAM/SOM modeling, macro tailwinds, customer problem validation, market risk audits. | `brain_search`, `web_search`, `neural_web_research`, `reddit_community_pulse`, `hacker_news_realtime`, `company_news_sentiment`, `producthunt_daily_tracker` | None (Autonomous Research) |
| **Alex Chen** | `competitor-analyst` | **Competitive Intelligence Specialist**<br>Competitor feature parity teardowns, moat analysis, vulnerability mapping, counter-tactics. | `competitor_analyzer`, `web_search`, `competitor_pricing_audit`, `domain_tech_inspector`, `github_repo_tracker`, `whois_domain_auditor`, `security_headers_scanner` | None (Autonomous Intelligence) |
| **Marcus Vance** | `chief-marketing-strategist` | **Chief Brand Strategist**<br>High-stakes brand positioning, value proposition architecture, strategic narrative arcs. | `brain_search`, `value_prop_evaluator`, `brain_propose_memory`, `generate_pdf_report`, `dispatch_slack_alert` | **Requires Human Approval** (`commit_brand_positioning`, `publish_strategy_brief`, `pivot_target_icp`) |
| **Elena Rostova** | `gtm-funnel-architect` | **GTM Funnel Architect**<br>Multi-stage conversion funnels (TOFU/MOFU/BOFU), CAC/LTV payback models, growth loops. | `cac_ltv_calculator`, `funnel_benchmarks`, `keyword_suggester`, `npm_telemetry`, `sitemap_crawler`, `dispatch_discord_webhook` | None (Autonomous Planning) |
| **Foundry Assistant** | `foundry-assistant` | **Universal Operations Partner**<br>Cross-functional document digestion, operational workflows, general coordination. | Full Tool Suite (`brain_search`, `web_search`, `pdf_archive_generate`, etc.) | Context-dependent |

---

## Model Context Protocol (MCP) Infrastructure

### MCP Architecture & Transports
FoundryOS implements the official open standard **Model Context Protocol (MCP)** using `@modelcontextprotocol/sdk`. Agents interact with tools via **JSON-RPC 2.0**:
- **`in-memory` Transport**: Zero-latency linked client-server transport instances running within the process with zero serialization lag.
- **`stdio` Transport**: Spawns external tools as isolated subprocesses via standard input (`stdin`) and output (`stdout`) for OS-level sandboxing.

### All Connected MCP Servers & Tool Schemas

The system initializes **6 active MCP servers**, providing **16 specialized tools**:

#### 1. Market Intelligence Server (`market-intel-mcp`)
* **`web_search`**: Free real-time web search for market trends, competitor insights, and industry news.
  * Inputs: `query` (string, required), `limit` (number, default: 5).
* **`exa_search`**: Neural semantic search with automatic DuckDuckGo fallback.
  * Inputs: `query` (string, required), `numResults` (number, default: 5).
* **`tech_trends`**: Extracts real-time discussions, upvotes, and founder sentiment from HackerNews.
  * Inputs: `topic` (string, required), `limit` (number, default: 5).
* **`neural_web_research`**: Deep synthesized web research combining search, Wikipedia summaries, and community boards.
  * Inputs: `query` (string, required), `depth` ("quick" | "deep", default: "quick").
* **`wikipedia_intelligence`**: Retrieves verified industry definitions, category boundaries, and corporate history.
  * Inputs: `query` (string, required).
* **`fetch_page_content`**: Scrapes and cleans raw text and metadata from any public webpage or competitor URL.
  * Inputs: `url` (string, required).

#### 2. SEO & Competitor Audit Server (`seo-competitor-mcp`)
* **`seo_audit`**: Audits page headings (H1/H2), title tag character constraints (30-65 chars), and meta description SERP preview (100-165 chars).
  * Inputs: `title` (string, required), `metaDescription` (string), `headings` (string[]).
* **`keyword_suggester`**: Generates high-converting commercial, informational, and competitor displacement SEO keywords.
  * Inputs: `seedTopic` (string, required).
* **`competitor_pricing_audit`**: Evaluates competitor pricing tiers (seat-based, usage-based, flat) to identify startup counter-tactics.
  * Inputs: `competitorName` (string, required), `modelType` (string).

#### 3. Growth & GTM Analytics Server (`growth-gtm-mcp`)
* **`value_prop_evaluator`**: Audits positioning headlines for empty hype buzzwords (`revolutionary`, `disruptive`, `all-in-one`), calculates clarity scores (0-10), and produces punchy rewrites.
  * Inputs: `statement` (string, required).
* **`cac_ltv_calculator`**: Computes Customer Lifetime Value (LTV), LTV/CAC ratio, CAC payback period in months, and benchmark health (`poor`, `healthy`, `exceptional`).
  * Inputs: `arpuMonthly` (number, required), `cac` (number, required), `churnRateMonthly` (number, default: 0.03).
* **`funnel_benchmarks`**: Retrieves industry-standard conversion benchmarks for TOFU, MOFU, and BOFU stages by business model (B2B SaaS, DevTools, Marketplaces).
  * Inputs: `businessModel` (string, default: "B2B SaaS").

#### 4. Foundry Brain Memory Server (`foundry-brain-mcp`)
* **`query_brain_context`**: Reads active Company Brain state (ICP, positioning, problem, competitors, tone, pricing).
  * Inputs: `tenantId` (string, default: "default-tenant").
* **`propose_brain_memory`**: Submits a strategic hypothesis or validated learning to the Company Brain.
  * Inputs: `statement` (string, required), `rationale` (string, required), `confidenceLevel` ("LOW" | "MEDIUM" | "HIGH").
* **`semantic_memory_search`**: Performs cosine similarity vector search over company documents, research briefs, and institutional memory.
  * Inputs: `query` (string, required), `limit` (number, default: 4), `minSimilarity` (number, default: 0.25).

#### 5. Document Archive & PDF Server (`document-archive-mcp`)
* **`pdf_archive_generate`**: Compiles formatted executive PDF reports and stores them in the document vault.
  * Inputs: `title` (string, required), `subtitle` (string), `content` (string, required), `author` (string).
* **`document_archive_list`**: Lists, filters, and searches documents stored in the tenant vault.
  * Inputs: `category` ("all" | "uploaded" | "generated" | "pdf"), `query` (string).

#### 6. Workspace Integration Hub Server (`integration-hub-mcp`)
* **`dispatch_slack_alert`**: Broadcasts strategic briefs and executive notifications directly to configured Slack channels.
  * Inputs: `message` (string, required), `channel` (string).
* **`dispatch_discord_webhook`**: Broadcasts changelogs, product announcements, and strategy summaries to Discord.
  * Inputs: `title` (string, required), `description` (string, required).
* **`github_sync_changelog`**: Formats and stages release or strategy changelogs ready for GitHub commits.
  * Inputs: `version` (string, required), `changes` (string, required).
* **`integration_status_audit`**: Audits connectivity status and credential health across all workspace integrations.

---

## Builtin Tool Plugins & Extensible Registry

In addition to MCP servers, FoundryOS features an internal `ToolRegistry` with **19 specialized plugins**:

### Real-Time Tracking & Telemetry Tools (`realtime-tracking.plugin.ts`)
1. **`domain_tech_inspector`**: Performs live DNS lookup (A, MX, TXT, CNAME) and detects CDN/hosting providers (Cloudflare, Vercel, Supabase, AWS, Netlify).
2. **`github_repo_tracker`**: Queries GitHub public telemetry (stars, forks, open issues, license, last release, last pushed date).
3. **`reddit_pulse`**: Scrapes Reddit search endpoints (r/startups, r/saas, r/entrepreneur) for organic customer sentiment and upvote ratios.
4. **`hackernews_realtime`**: Queries Algolia HackerNews API for live founder discussions, points, and comment threads.
5. **`npm_telemetry`**: Retrieves weekly/monthly download volume, package version, dependencies, author, and unpack size from NPM registry.
6. **`status_latency_probe`**: Executes live HTTP latency probes, measuring DNS time, TTFB, status codes, and SSL certificate validity.
7. **`whois_domain_auditor`**: Analyzes domain registrar, nameservers, registration dates, and domain age.
8. **`security_headers_scanner`**: Audits production HTTP response headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
9. **`pypi_telemetry`**: Inspects Python Package Index releases, downloads, and author data.
10. **`sitemap_crawler`**: Discovers XML sitemaps, counts indexed pages, and extracts URL hierarchy.
11. **`company_news_sentiment`**: Aggregates live news headlines and calculates a positive/negative/neutral sentiment score.
12. **`producthunt_daily`**: Fetches daily trending tech product launches, upvotes, and launch pitches.

### Web Search & Intelligence Tools (`web-search.plugin.ts` & `market-intel.plugin.ts`)
13. **`web_search`**: Free real-time search engine query with DuckDuckGo Instant Search.
14. **`exa_search`**: Semantic neural search engine.
15. **`fetch_page_content`**: Sanitizes webpage HTML into clean markdown.
16. **`wikipedia_intelligence`**: Wikipedia API integration for encyclopedic market summaries.
17. **`neural_web_research`**: Deep multi-source web intelligence synthesis.
18. **`competitor_analyzer`**: Deep competitor landing page analysis extracting OpenGraph meta, titles, and value props.

### Brain & Document Vault Tools (`brain.plugin.ts` & `pdf-document.plugin.ts`)
19. **`generate_pdf_report`**: Generates styled enterprise PDF reports and saves them to the tenant vault with direct download URLs.
20. **`archive_document`**: Stores uploaded or generated text/markdown documents in the database.
21. **`list_archived_documents`**: Queries the document archive with keyword and category filters.
22. **`brain_search`**: Reads active company ICP, audience, problem, and competitor parameters.
23. **`brain_propose_memory`**: Saves newly validated insights into institutional memory.

---

## Company Brain: 7-Layer Semantic RAG

The **Company Brain** represents the persistent institutional intelligence of a company. It is structured into **7 distinct architectural layers**:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 7: Institutional Memory & Validated Learnings         │ (pgvector HNSW Cosine Search)
├─────────────────────────────────────────────────────────────┤
│  Layer 6: Goals, Strategies, OKRs & Active Campaigns        │ (Quarterly Targets & Metrics)
├─────────────────────────────────────────────────────────────┤
│  Layer 5: Competitor Matrix, Teardowns & Vulnerabilities    │ (Direct/Indirect Landscape)
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Brand Voice Guidelines & Governance Content Rules │ (Tone Positive vs Tone Avoid)
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Audience Personas, Trigger Events & Acute Pains   │ (ICP Segmentation)
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Products, Pricing Tiers & Value Architecture      │ (Core Offers & Features)
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Company Profile, Vision & Operational Stage       │ (Core Foundation)
└─────────────────────────────────────────────────────────────┘
```

### Dynamic Token Budget Engine
Context packages are built dynamically on every turn:
- Evaluates total model context budget (e.g. 8,192 tokens for local Ollama).
- Reserves completion tokens for agent response generation.
- Prioritizes layers based on the specialist's contract (e.g., Alex Chen prioritizes Layer 5, Marcus Vance prioritizes Layer 4 & Layer 6).
- Injects relevant semantic chunks retrieved via `pgvector` HNSW index with minimum cosine similarity thresholds.

---

## Human-In-The-Loop (HITL) Steering & Governance

High-stakes decisions must not be executed blindly by autonomous agents. FoundryOS enforces a strict **Human-In-The-Loop Steering Gate**:

```
                         [Agent Formulates Strategy]
                                      │
                         [High-Stakes Gate Triggered]
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
      [Path 1: Aggressive]                           [Path 2: Targeted]
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      ▼
                             [Path 3: Defensive]
                                      │
                                      ▼
                        [Executive Human Approval]
                     ├── Approved: Execute & Archive
                     └── Rejected: Reactive Re-Planning with User Feedback
```

1. **Strategic Branching**: The agent presents 3 distinct strategic paths with trade-off analyses, plus a free-form custom steering prompt input.
2. **Approval Lifecycle**: Actions like `commit_brand_positioning`, `publish_strategy_brief`, and `pivot_target_icp` are held in `PENDING` state until explicitly authorized by a human.
3. **Reactive Re-Planning**: If an executive rejects a proposal or submits steering feedback, the agent instantly cancels the branch and recalculates alternative solutions.

---

## Dynamic Visual Chart Engines

FoundryOS generates high-contrast, publication-ready SVG charts directly in agent deliverables:

- **Market Sizing Architecture**: Generates layered TAM, SAM, and SOM horizontal bar infographics with exact dollar figures and percentage breakdowns.
- **2x2 Competitor Positioning Matrix**: Renders interactive 4-quadrant scatter diagrams mapping market leaders, niche innovators, legacy incumbents, and the user's venture.
- **Funnel Conversion Architecture**: Visualizes TOFU → MOFU → BOFU drop-off stages with conversion percentages and CAC payback tags.
- **Strategic Pillar Visuals**: Modern 3-column architecture cards displaying primary strategic initiatives and key performance indicators.

---

## Modern Web Client & Landing Page Experience

Built with **React**, **TypeScript**, and **Vite** using pure Vanilla CSS glassmorphism:

- **Interactive Hero Canvas**: Shader-driven circuit brain canvas that reacts to mouse movement with dynamic glowing particle nodes.
- **Live Agent Simulator**: Interactive preview allowing prospective users to test agent routing and view simulated thought logs.
- **ROI Profitability Calculator**: Real-time slider calculating cost savings of AI specialists versus hiring traditional marketing agencies.
- **Apple-Style Bento Grid**: High-contrast cards showcasing 7-layer memory, MCP tools, multi-upload analysis, and PDF exports.
- **Unified Workspace**: Split-view workspace featuring live agent thought streaming, quick-launch strategy templates, multi-file document drops, and instant deliverable exports.
- **Theme Engine**: Seamless dark and light mode toggle with glowing neon circuit accents.

---

## Authentication, Security & Tenant Isolation

- **JSON Web Tokens (JWT)**: Cryptographically signed tokens with configurable expirations and salted bcrypt password hashing.
- **Tenant Isolation**: Every database query, document archive item, memory proposal, and vector embedding is strictly scoped to the authenticated `tenant_id`.
- **API Key Management**: Generate, revoke, and monitor scoped API keys directly in the Settings dashboard.
- **Token Quota Telemetry**: Real-time daily token consumption tracking, credit budgeting, and rate limiting.

---

## Project Directory Structure

```
FoundryOs/
├── client/                     # Modern React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── approvals/      # HITL decision gates & branching views
│   │   │   ├── archive/        # Saved reports & document vaults
│   │   │   ├── auth/           # Login, registration, and route guards
│   │   │   ├── common/         # Brain logo, markdown renderer, icons
│   │   │   ├── employees/      # AI specialist roster & persona cards
│   │   │   ├── integrations/   # Third-party integrations dashboard
│   │   │   ├── landing/        # Hero canvas, simulator, ROI calculator, bento
│   │   │   ├── layout/         # Header, sidebar navigation, profile menus
│   │   │   ├── settings/       # Account, API keys, billing, quotas
│   │   │   └── workspace/      # Agent chat, quick launch, execution blobs
│   │   ├── context/            # Global AppContext & state management
│   │   ├── services/           # Frontend API and authentication services
│   │   ├── types/              # Shared TypeScript interface definitions
│   │   └── utils/              # PDF export formatting & date utilities
│   ├── public/                 # Static assets & brain branding icons
│   └── vite.config.ts          # Vite build, proxy & path alias config
├── src/
│   ├── index.ts                # Application startup entry point
│   ├── server.ts               # HTTP server bootstrap
│   ├── backend/
│   │   ├── agents/             # Agent execution runner & router
│   │   ├── auth/               # JWT authentication service & API key store
│   │   ├── config/             # Zod-validated environment config & profiles
│   │   ├── credits/            # Token tracking & credit budgeting
│   │   ├── documents/          # Document archive store & PDF generator
│   │   ├── employees/          # Employee catalog & dynamic prompt builders
│   │   ├── errors/             # Custom domain error hierarchies
│   │   ├── hitl/               # Human-In-The-Loop approval lifecycle
│   │   ├── integrations/       # Integration store & credential vault
│   │   ├── mcp/                # MCP client manager & 6 built-in servers
│   │   │   ├── servers/        # Market Intel, SEO, GTM, Brain, Archive, Hub
│   │   │   ├── mcp.client.ts   # JSON-RPC 2.0 client wrapper
│   │   │   └── mcp.manager.ts  # Multi-server lifecycle manager
│   │   ├── models/             # LLM resolver & Ollama client
│   │   ├── plugins/            # 19 Extensible tool plugins
│   │   │   └── builtin/        # Realtime tracking, search, brain, PDF
│   │   ├── queue/              # BullMQ queue managers & worker jobs
│   │   ├── routes/             # REST API routers & endpoint handlers
│   │   └── utils/              # SVG chart generators & text helpers
│   ├── brain/                  # 7-layer context builder & semantic vector store
│   ├── databases/              # PostgreSQL client, schema.sql & migrations
│   └── trueforge/              # TrueForge cloud agent session client
├── public/                     # Compiled production UI bundle served by Express
├── tests/                      # 20 Vitest test suites (108 tests)
│   ├── agents/                 # Multi-upload & agent runner tests
│   ├── auth/                   # Authentication & API key tests
│   ├── backend/                # API router & controller tests
│   ├── brain/                  # Context builder & 7-layer memory tests
│   ├── mcp/                    # MCP client & server integration tests
│   └── models/                 # Ollama LLM resolver tests
├── .env.example                # Environment variable configuration template
├── package.json
└── tsconfig.json
```

---

## Getting Started & Local Setup

### Prerequisites

- **Node.js**: `>= 20.0.0`
- **npm**: `>= 9.0.0`
- **PostgreSQL**: `>= 15` with the `pgvector` extension installed
- **Redis**: `>= 6.0` (for BullMQ asynchronous queues)
- **Ollama**:
  ```bash
  # Pull the primary chat model
  ollama pull llama3.2:1b

  # Pull the embedding model
  ollama pull nomic-embed-text
  ```

### Quickstart

1. **Clone the repository**:
   ```bash
   git clone https://github.com/visheshGupta01/FoundryOS.git
   cd FoundryOS
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Verify `.env` settings:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://foundry:foundry_pass@localhost:5432/foundry_os
   REDIS_URL=redis://localhost:6379
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2:1b
   EMBEDDING_MODEL=nomic-embed-text
   EMBEDDING_DIMENSIONS=1536
   ```

4. **Initialize database schema & pgvector**:
   ```bash
   psql -U foundry -d foundry_os -f src/databases/schema.sql
   ```

5. **Build and launch**:
   ```bash
   # Compile both frontend and backend
   npm run build:all

   # Start the production server on port 3000
   npm run serve
   ```

   For development with live hot-reloading:
   ```bash
   # Terminal 1: Backend
   npm run dev

   # Terminal 2: Vite Client (HMR)
   npm run dev:client
   ```

---

## Available Scripts & Testing

| Script | Command | Description |
|---|---|---|
| **Build All** | `npm run build:all` | Compiles backend TypeScript and bundles Vite React frontend into `public/` |
| **Build Backend** | `npm run build` | Compiles backend TypeScript into `dist/` |
| **Build Client** | `npm run build:client` | Compiles frontend React bundle |
| **Dev Backend** | `npm run dev` | Runs backend with automatic restart on file change |
| **Dev Client** | `npm run dev:client` | Runs Vite dev server with Hot Module Replacement |
| **Serve** | `npm run serve` | Launches unified production server on port 3000 |
| **Test** | `npm test` | Runs all 20 Vitest test suites (108 tests) |
| **Test Watch** | `npm run test:watch` | Runs Vitest in interactive watch mode |
| **Typecheck** | `npm run typecheck` | Validates TypeScript types across the entire project |

---

## Testing Verification

The entire FoundryOS suite is tested with Vitest:

```bash
npm test
```

### Coverage Scope:
- **Agent Execution Pipeline**: Routing accuracy, dynamic prompt synthesis, and execution timeouts.
- **Multi-Document Ingestion**: Parsing and attaching up to 5 uploaded files per turn.
- **Company Brain & Semantic RAG**: 7-layer context assembly, token budgeting, and pgvector cosine search.
- **Model Context Protocol (MCP)**: Tool registration, discovery, parameter validation, and RPC execution across all 6 servers.
- **Human-In-The-Loop (HITL)**: Action gating, strategic branching, approval lifecycles, and reactive re-planning.
- **Authentication & Security**: Password hashing, JWT token issuance, route guards, and API key management.
- **Telemetry & Quota Control**: Credit deductions, rate limits, and token quota tracking.
