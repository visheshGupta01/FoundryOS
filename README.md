# FoundryOS

<p align="center">
  <strong>Local-First Autonomous AI Specialist Team & Enterprise Operations Platform</strong>
</p>

FoundryOS coordinates specialized autonomous AI agents, semantic knowledge bases ("Company Brain" with `pgvector`), Model Context Protocol (MCP) tool integrations, Human-In-The-Loop (HITL) steering, and local-first LLM execution powered natively by **Ollama** (`llama3.2:1b`, `nomic-embed-text`) and the **TrueForge Agent Runtime**.

---

## Architecture Overview

FoundryOS operates on a local-first, privacy-focused autonomous execution engine designed for reliable enterprise workflows without external LLM dependencies:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FoundryOS Modern Web Client                          │
│   (React + TypeScript + Vite + Glassmorphic UI + Dark/Light Theme)      │
│   • Landing Showcase (Agent Simulator, ROI Calculator, Bento Grid)       │
│   • Unified Workspace & Multi-File Upload Deliverables                  │
│   • Human-In-The-Loop Steering Gates & Decision Branching               │
│   • Settings & Tenant API Key Governance                                │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST / SSE
┌────────────────────────────────────▼────────────────────────────────────┐
│                       Express API & Gateway                             │
│   • JWT Auth & Tenant Scoping        • Rate Limits & Quotas             │
│   • Document Archive & PDF Export     • Distributed BullMQ Task Queue   │
└──────────────────┬─────────────────┬──────────────────┬─────────────────┘
                   │                 │                  │
┌──────────────────▼──────┐ ┌────────▼────────┐ ┌───────▼─────────────────┐
│ Autonomous Agent Engine │ │  Company Brain  │ │ Model Context Protocol  │
│ • Specialist Personas   │ │  (Semantic RAG) │ │ (MCP) Integration Hub   │
│ • Dynamic Synthesizer   │ │ • 7-Layer Store │ │ • Stdio / In-Memory RPC │
│ • Auto & Direct Routing │ │ • pgvector HNSW │ │ • Market Intel Server   │
│ • HITL Approval Gates   │ │ • Context Engine│ │ • Document Vault Server │
└──────────────────┬──────┘ └────────┬────────┘ └───────┬─────────────────┘
                   │                 │                  │
┌──────────────────▼─────────────────▼──────────────────▼─────────────────┐
│                        Local LLM Runtime                                │
│   • Primary Engine: Local Ollama (llama3.2:1b)                          │
│   • Local Embeddings: nomic-embed-text via Ollama (1536 dims)           │
│   • Cloud Session & Turn Harness: TrueForge Agent Runtime               │
│   • Fallback: Deterministic graceful execution engine                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

### 1. Autonomous AI Specialist Team
- **Pre-Configured Personas**:
  - **Market Research Analyst**: Synthesizes market trends, TAM/SAM sizing, industry tailwinds, and risks.
  - **Competitive Intelligence Specialist**: Maps competitor positioning, pricing models, feature parity, and strategic moats.
  - **Chief Brand Strategist**: Creates ICP profiles, positioning frameworks, tone guidelines, and narrative arcs.
  - **GTM Funnel Architect**: Designs lead generation funnels, acquisition loops, unit economics, and pipeline stages.
  - **Foundry Assistant**: Universal operational partner for research synthesis, multi-document digestion, and execution plans.
- **Dynamic Prompt Synthesis**: Injects active tenant profile, ICP definitions, brand guidelines, and guardrails into runtime turns.
- **Multi-Document Analysis**: Allows uploading up to 5 documents simultaneously (PDF, Markdown, text briefs) to inform agent runs.

### 2. Human-In-The-Loop (HITL) Steering & Governance
- **High-Stakes Approval Gates**: Halts execution before external broadcasts, strategic pivots, or high-risk brand commitments.
- **Strategic Decision Branching**: Surfaces three distinct strategic options plus custom user steering input.
- **Reactive Re-Planning**: When a user rejects a direction or provides feedback, agents recalibrate and formulate alternative paths.

### 3. Company Brain (7-Layer Semantic RAG & pgvector)
- **Vector Indexing**: PostgreSQL with `pgvector` HNSW indexes for rapid cosine similarity retrieval.
- **Local Embeddings**: Generates dense semantic vectors locally via Ollama `nomic-embed-text`.
- **Token-Budget-Aware Context Engine**: Assembles role-tailored context packages within dynamic LLM token budgets.
- **Institutional Memory**: Automatically logs validated learnings, decisions, and outcomes to continuously improve team context.

### 4. Model Context Protocol (MCP) Integration
- **Universal Tool Standard**: Implements JSON-RPC 2.0 communication over Stdio and in-memory transports.
- **Built-in MCP Servers**:
  - **Market Intel Server**: Live web searching, competitor news, and industry trend telemetry.
  - **Document Archive Server**: Secure tenant document storage, retrieval, and metadata indexing.
  - **Brain Memory Server**: Direct semantic vector retrieval across institutional knowledge.
  - **Integration Hub Server**: Coordinates external service connections, webhooks, and third-party integrations.

### 5. Local-First LLM Architecture
- **Complete Privacy & Zero API Cost**: Runs on your infrastructure with local **Ollama** instances (`llama3.2:1b`, `gemma`, etc.).
- **TrueForge Agent Runtime**: Agent turn orchestration and persistent session state.
- **Deterministic Resilience**: Graceful fallback handling if local model instances undergo maintenance or restarts.

### 6. Modern Web UI & Authentication
- **Landing Experience**: Interactive Canvas hero, Live Agent Simulator, ROI Calculator, and Apple-inspired Bento Grid showcase.
- **Workspace**: Real-time agent thought streaming, typing indicators, expandable artifact previews, and markdown rendering.
- **Authentication & Settings**: Secure JWT tokens, tenant isolation, API key governance, and token quota monitoring.

---

## Project Structure

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
│   │   ├── mcp/                # MCP client manager & built-in servers
│   │   ├── models/             # LLM resolver & Ollama client
│   │   ├── plugins/            # Extensible tool registry & builtin plugins
│   │   ├── queue/              # BullMQ queue managers & worker jobs
│   │   ├── routes/             # REST API routers & endpoint handlers
│   │   └── utils/              # Visualization charts & helpers
│   ├── brain/                  # RAG context builder & semantic vector store
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

## Getting Started

### Prerequisites

- **Node.js**: `>= 20.0.0`
- **npm**: `>= 9.0.0`
- **PostgreSQL**: `>= 15` with `pgvector` (`CREATE EXTENSION IF NOT EXISTS vector;`)
- **Redis**: `>= 6.0` (for BullMQ queues)
- **Ollama**:
  ```bash
  ollama pull llama3.2:1b
  ollama pull nomic-embed-text
  ```

### Installation

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
   Update `.env` to match your local setup:
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

4. **Initialize database schema**:
   ```bash
   psql -U foundry -d foundry_os -f src/databases/schema.sql
   ```

5. **Build and run**:
   ```bash
   # Build frontend and backend
   npm run build:all

   # Start the production server
   npm run serve
   ```
   Or run with live reload during development:
   ```bash
   # In terminal 1 (Backend dev)
   npm run dev

   # In terminal 2 (Frontend dev)
   npm run dev:client
   ```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| **Build Full System** | `npm run build:all` | Compiles backend TypeScript and builds the production React bundle into `public/` |
| **Build Backend** | `npm run build` | Compiles backend TypeScript into `dist/` |
| **Build Client** | `npm run build:client` | Builds Vite client production bundle |
| **Dev Client** | `npm run dev:client` | Runs Vite frontend with live Hot Module Replacement (HMR) |
| **Start Server** | `npm run serve` | Serves the unified API & Dashboard on port 3000 |
| **Test** | `npm test` | Runs all 20 Vitest test suites (108 tests) |
| **Test Watch** | `npm run test:watch` | Runs Vitest in interactive watch mode |
| **Typecheck** | `npm run typecheck` | Validates TypeScript types across the entire backend |

---

## Testing

FoundryOS maintains comprehensive test coverage across all major components:

```bash
npm test
```

Test suites validate:
- Agent routing, dynamic synthesis, and execution pipeline
- Multi-file document upload & context aggregation
- 7-layer Company Brain RAG & token-budget context builder
- Model Context Protocol (MCP) tool registration & invocation
- Human-In-The-Loop (HITL) approval lifecycles & branching
- JWT authentication, password hashing, and role permissions
- Token & credit quota limits
