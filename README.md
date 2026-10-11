# FoundryOS

Autonomous AI Marketing & Operations Operating System. FoundryOS coordinates specialized autonomous AI employees, semantic knowledge bases ("Company Brain" with pgvector), multi-provider LLM routing (OpenAI GPT primary, Ollama local fallback, TrueForge agents), and distributed queue execution.

---

## Key Architecture & Capabilities

1. **Autonomous AI Employees Catalog**:
   - Pre-configured agent personas: Content Creator, SEO Specialist, Analytics Auditor, Campaign Strategist, and more.
   - Dynamic prompt synthesis tailored to company profile, ICP, tone, and goals.

2. **Intelligent Agent Router**:
   - Two-tier query classification: fast heuristic keyword matching backed by model-driven routing.
   - Fallback to dedicated FoundryOS general assistant when queries span multiple domains.

3. **Company Brain (Semantic Memory & RAG)**:
   - PostgreSQL schema with `pgvector` HNSW index support.
   - Token-budget-aware context builder with dynamic prioritization.

4. **Multi-Provider LLM Engine**:
   - **Primary**: OpenAI GPT-4o-mini (fast routing & chat) and GPT-4o (deep strategy generation).
   - **Fallback**: Local Ollama (`llama3.2:1b`, `nomic-embed-text`) for offline/development use.
   - Native structured JSON output via OpenAI's JSON Schema mode (~99% parse rate vs ~60% with Ollama).
   - Provider-agnostic `LLMClient` interface — swap providers with a single env variable.
   - TrueForge SDK agent harness for cloud session management and execution turns.

5. **Distributed Task Queue**:
   - BullMQ & Redis-backed job queues for resilient asynchronous task execution and background workflows.

6. **Web Dashboard & REST API**:
   - Complete front-end user interface with real-time analytics, company profile management, and interactive agent chats.
   - Clean Node.js HTTP REST API backend.

---

## Project Structure

```
FoundryOs/
├── src/
│   ├── index.ts                # Application startup entry point
│   ├── server.ts               # Server entry export
│   ├── backend/
│   │   ├── agents/             # Agent runner & workflow execution logic
│   │   ├── config/             # Zod-validated environment config
│   │   ├── employees/          # Employee persona catalog & prompts
│   │   ├── errors/             # Custom domain error hierarchies
│   │   ├── flows/              # Multi-step business flows & pipelines
│   │   ├── models/             # LLM client interface, OpenAI, Ollama & resolver
│   │   ├── queue/              # BullMQ queue managers & worker jobs
│   │   ├── routes/             # REST API routers & endpoint handlers
│   │   ├── server.ts           # HTTP server & static file server
│   │   └── shared/             # Logging (structured JSON), retry & utilities
│   ├── brain/                  # RAG context builder & semantic search
│   ├── databases/              # PostgreSQL client, schema.sql & migrations
│   └── trueforge/              # TrueForge agent session & turn services
├── frontend/                   # UI assets (HTML, CSS, JS)
├── public/                     # Public static files served by server
├── tests/                      # Vitest test suites (14 suites, 73+ tests)
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
| **Build** | `npm run build` | Compiles TypeScript into `dist/` |
| **Typecheck** | `npm run typecheck` | Validates TypeScript types without emitting files |
| **Test** | `npm test` | Runs all Vitest test suites once |
| **Test Watch** | `npm run test:watch` | Runs Vitest in interactive watch mode |
| **Start Server** | `npm run serve` | Builds project and starts the HTTP server & UI on port 3000 |
| **Start CLI** | `npm start` | Runs the initialization and connectivity check cycle |
| **Start Dev** | `npm run start:dev` | Compiles and runs the CLI initialization cycle |

---

## Testing

FoundryOS uses Vitest for unit and integration testing. Run:

```bash
npm test
```

All 14 test suites cover:
- Environment configuration & schema validation
- Custom error handling & logging
- PostgreSQL connection resilience
- Context Builder token budgeting
- TrueForge agent session lifecycles
- OpenAI & Ollama completions & embeddings
- BullMQ queue & worker execution
- Agent Router (heuristic + model routing)
- End-to-end execution flows
