CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  website TEXT,
  industry VARCHAR(128),
  business_model VARCHAR(128),
  business_stage VARCHAR(64),
  description TEXT,
  founded_year INTEGER,
  location VARCHAR(255),
  company_size VARCHAR(64),
  target_geography VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_companies_tenant UNIQUE (tenant_id)
);

CREATE TABLE IF NOT EXISTS company_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(128),
  description TEXT,
  problem_statement TEXT,
  problem_severity VARCHAR(64),
  solution_statement TEXT,
  differentiation TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  use_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing_model VARCHAR(64),
  pricing_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  product_stage VARCHAR(64),
  unique_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_icp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  customer_type VARCHAR(128),
  company_size VARCHAR(128),
  industry VARCHAR(128),
  job_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget_range VARCHAR(128),
  buying_power VARCHAR(128),
  location VARCHAR(128),
  pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  needs JSONB NOT NULL DEFAULT '[]'::jsonb,
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  objections JSONB NOT NULL DEFAULT '[]'::jsonb,
  buying_triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_business_icp_tenant UNIQUE (tenant_id)
);

CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  role VARCHAR(128) NOT NULL,
  pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  objections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  brand_name VARCHAR(128) NOT NULL,
  brand_positioning TEXT,
  mission TEXT,
  vision TEXT,
  values JSONB NOT NULL DEFAULT '[]'::jsonb,
  personality JSONB NOT NULL DEFAULT '[]'::jsonb,
  brand_promise TEXT,
  differentiators JSONB NOT NULL DEFAULT '[]'::jsonb,
  tone_positive JSONB NOT NULL DEFAULT '["professional","confident","clear","human"]'::jsonb,
  tone_avoid JSONB NOT NULL DEFAULT '["overly corporate","generic AI language","excessive hype","buzzwords"]'::jsonb,
  core_message TEXT,
  value_proposition TEXT,
  primary_message TEXT,
  secondary_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  taglines JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  proof_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  objection_handling JSONB NOT NULL DEFAULT '{}'::jsonb,
  claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_brand_profiles_tenant UNIQUE (tenant_id)
);

CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  website TEXT,
  product_name VARCHAR(128),
  category VARCHAR(128),
  current_pricing TEXT,
  positioning TEXT,
  target_audience TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  messaging TEXT,
  marketing_channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_strategy TEXT,
  ads_summary TEXT,
  seo_focus TEXT,
  social_presence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_competitors_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS competitor_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  tenant_id VARCHAR(64) NOT NULL,
  attribute_name VARCHAR(64) NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  source_notes TEXT
);

CREATE TABLE IF NOT EXISTS company_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  objective TEXT NOT NULL,
  timeframe VARCHAR(64),
  deadline DATE,
  priority VARCHAR(32) NOT NULL DEFAULT 'medium',
  target_audience TEXT,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  success_metric VARCHAR(128) NOT NULL,
  target_metric_value TEXT,
  current_metric_value TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strategy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  strategy_key VARCHAR(128) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  rationale TEXT,
  decision_maker VARCHAR(128),
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_strategy_tenant_key_version UNIQUE (tenant_id, strategy_key, version)
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  document_type VARCHAR(64) NOT NULL DEFAULT 'document',
  source_uri TEXT,
  author VARCHAR(128),
  department VARCHAR(64),
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  provenance TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(provenance, ''))) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_content_hash UNIQUE (tenant_id, content_hash)
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tenant_id VARCHAR(64) NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_doc_chunk_index UNIQUE (document_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS campaign_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  goal_id UUID REFERENCES company_goals(id) ON DELETE SET NULL,
  campaign_name VARCHAR(255) NOT NULL,
  channel VARCHAR(64) NOT NULL,
  objective TEXT,
  target_audience TEXT,
  spend_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(8) NOT NULL DEFAULT 'INR',
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
  conversions INTEGER NOT NULL DEFAULT 0,
  leads_generated INTEGER NOT NULL DEFAULT 0,
  qualified_leads INTEGER NOT NULL DEFAULT 0,
  customers_acquired INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brain_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(64) NOT NULL,
  memory_type VARCHAR(32) NOT NULL,
  statement TEXT NOT NULL,
  rationale TEXT,
  confidence_level VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  evidence_count INTEGER NOT NULL DEFAULT 1,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(32) NOT NULL DEFAULT 'unvalidated',
  validated_by VARCHAR(128),
  validated_at TIMESTAMPTZ,
  source_priority INTEGER NOT NULL DEFAULT 5,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', statement || ' ' || coalesce(rationale, ''))) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON company_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_icp_tenant ON business_icp(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personas_tenant ON personas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brand_tenant ON brand_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_competitors_tenant ON competitors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_competitor_history_comp ON competitor_history(competitor_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_goals_tenant ON company_goals(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_strategies_tenant ON strategy_versions(tenant_id, strategy_key, is_current);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id, is_current);
CREATE INDEX IF NOT EXISTS idx_documents_tsv ON documents USING gin(tsv);
CREATE INDEX IF NOT EXISTS idx_chunks_tenant ON document_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON document_chunks USING gin(tsv);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaign_executions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_memories_tenant ON brain_memories(tenant_id, memory_type, status, is_current);
CREATE INDEX IF NOT EXISTS idx_memories_tsv ON brain_memories USING gin(tsv);
