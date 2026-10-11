# FoundryOS

Autonomous AI Specialist Team & Operations Platform. FoundryOS coordinates specialized autonomous AI agents, semantic knowledge bases ("Company Brain" with pgvector), Model Context Protocol (MCP) tools, Human-In-The-Loop (HITL) governance, and multi-provider LLM routing (OpenAI GPT, Ollama local fallback, TrueForge agents).

---

## Key Architecture & Capabilities

1. **Autonomous AI Specialist Team**:
   - Pre-configured agent personas: Market Research Analyst, Competitive Intelligence Specialist, Chief Brand Strategist, GTM Funnel Architect, and Foundry Assistant.
   - Dynamic prompt synthesis tailored to company profile, ICP, tone, and strategic goals.

2. **Human-In-The-Loop (HITL) Steering & Governance**:
   - High-stakes action approval gate before brand commitments, external broadcasts, or memory validations.
   - Multi-option strategic branching: 3 curated strategic paths + custom prompt input field.
   - Reactive re-planning: when a direction is rejected, agents immediately recalculate alternative solutions based on feedback.

3. **Modern High-Contrast Glassmorphic UI (`client/`)**:
   - React + TypeScript + Vite frontend with smooth view transitions and micro-animations.
   - Theme-adaptive glowing circuit brain branding with dark and light mode support.
   - Real-time token usage analytics, daily credit budgeting, and session vaults.
   - Client-side and server-side PDF deliverable export engine.

4. **Model Context Protocol (MCP) Integration**:
   - Extensible MCP tool registry and client harness (`src/backend/mcp/`).
   - Built-in MCP servers: Market Intel, Document Archive, SEO Audits, Brain Memory, Google Drive, and Slack broadcasts.

5. **Company Brain (Semantic Memory & RAG)**:
   - PostgreSQL schema with `pgvector` HNSW index support.
   - Token-budget-aware context builder with dynamic memory vector weighting.
   - Active memory and directives dashboard injecting ICP, tone, and guardrails directly into agent runtimes.

6. **Multi-Provider LLM Engine**:
   - **Primary**: OpenAI GPT-4o-mini (fast routing & chat) and GPT-4o (deep strategy generation).
   - **Fallback**: Local Ollama (`llama3.2:1b`, `nomic-embed-text`) for offline/development use.
   - Native structured JSON output via OpenAI's JSON Schema mode.
   - Provider-agnostic `LLMClient` interface — swap providers with a single environment variable.
   - TrueForge SDK agent harness for cloud session management and execution turns.

7. **Distributed Task Queue**:
   - BullMQ & Redis-backed job queues for resilient asynchronous task execution and background workflows.

---

## Project Structure

```
FoundryOs/
├── client/                     # Modern React + Vite frontend workspace
│   ├── src/
│   │   ├── components/         # Workspace, Approvals, Brain, Employees, Analytics
│   │   ├── context/            # Global AppContext and state management
│   │   ├── types/              # TypeScript interface definitions
│   │   └── utils/              # Output formatting & PDF generation
│   ├── public/                 # Static assets & logos
│   └── vite.config.ts          # Vite build & proxy configuration
├── src/
│   ├── index.ts                # Application startup entry point
│   ├── server.ts               # Server entry export
│   ├── backend/
│   │   ├── agents/             # Agent runner & workflow execution logic
│   │   ├── config/             # Zod-validated environment config & demo profiles
│   │   ├── credits/            # Token tracking & credit calculation services
│   │   ├── documents/          # Document archive store & PDF generator
│   │   ├── employees/          # Employee persona catalog & prompts
│   │   ├── errors/             # Custom domain error hierarchies
│   │   ├── hitl/               # Human-In-The-Loop approval lifecycle service
│   │   ├── integrations/       # Slack, Google Drive, and API key management
│   │   ├── mcp/                # Model Context Protocol client & server handlers
│   │   ├── models/             # LLM client interface, OpenAI, Ollama & resolver
│   │   ├── plugins/            # Extensible tool registry & plugins
│   │   ├── queue/              # BullMQ queue managers & worker jobs
│   │   ├── routes/             # REST API routers & endpoint handlers
│   │   └── server.ts           # HTTP server & static bundle provider
│   ├── brain/                  # RAG context builder & semantic vector store
│   ├── databases/              # PostgreSQL client, schema.sql & migrations
│   └── trueforge/              # TrueForge agent session & turn services
├── public/                     # Compiled production UI bundle served by Express
├── tests/                      # Vitest test suites (agents, credits, mcp, flows)
├── .env.example                # Environment variable configuration template
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js**: `>= 20.0.0`
- **npm**: `>= 9.0.0`
- **PostgreSQL**: `>= 15` with the `pgvector` extension installed (`CREATE EXTENSION IF NOT EXISTS vector;`)
- **Redis**: `>= 6.0` (for BullMQ queues)
- **OpenAI API Key** (Recommended): Get from [platform.openai.com](https://platform.openai.com)
- **Ollama** (Optional / local fallback):
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

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to match your local database, Redis, and LLM credentials:
   ```env
   NODE_ENV=development
   PORT=3000
   LOG_LEVEL=info
   DATABASE_URL=postgresql://foundry:foundry_pass@localhost:5432/foundry_os
   REDIS_URL=redis://localhost:6379
   TRUEFORGE_API_URL=http://localhost:8080
   TRUEFORGE_API_KEY=tf_dev_placeholder_key
   EMBEDDING_MODEL=text-embedding-3-small
   EMBEDDING_DIMENSIONS=1536
   # LLM Provider ("openai" or "ollama")
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   OPENAI_MODEL=gpt-4o-mini
   OPENAI_STRATEGY_MODEL=gpt-4o
   ```

4. **Initialize Database Schema**:
   Run `src/databases/schema.sql` against your PostgreSQL database:
   ```bash
   psql -U foundry -d foundry_os -f src/databases/schema.sql
   ```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| **Build Full System** | `npm run build:all` | Compiles backend TypeScript and builds the production React bundle into `public/` |
| **Build Backend** | `npm run build` | Compiles backend TypeScript into `dist/` |
| **Build Client** | `npm run build:client` | Builds Vite client production bundle |
| **Dev Client** | `npm run dev:client` | Runs Vite frontend with live Hot Module Replacement |
| **Start Server** | `npm run serve` | Builds and serves the unified API & Dashboard on port 3000 |
| **Test** | `npm test` | Runs all Vitest test suites |
| **Test Watch** | `npm run test:watch` | Runs Vitest in interactive watch mode |
| **Typecheck** | `npm run typecheck` | Validates TypeScript types across the backend |

---

## Testing

FoundryOS uses Vitest for unit and integration testing. Run:

```bash
npm test
```

Test suites cover:
- Agent execution pipeline & routing
- Context Builder token budgeting & memory vectors
- Model Context Protocol (MCP) tool registrations
- Human-In-The-Loop approval workflows
- Token & credit quota limits
- TrueForge agent session lifecycles
- Multi-document upload & PDF deliverable compilation
