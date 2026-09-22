import { toSql } from "pgvector";
import { type DatabasePool, db } from "../databases/postgres.client.js";
import {
  type DocumentChunk,
  type DocumentRecord,
  DocumentRecordSchema,
  type VectorSearchQuery,
  type VectorSearchResult,
  type CompanyProfile,
  type CompanyProfileInput,
  type CompanyProduct,
  type CompanyProductInput,
  type BusinessIcp,
  type BusinessIcpInput,
  type Persona,
  type PersonaInput,
  type BrandProfile,
  type BrandProfileInput,
  type Competitor,
  type CompetitorInput,
  type CompetitorHistory,
  type CompanyGoal,
  type CompanyGoalInput,
  type StrategyVersion,
  type StrategyVersionInput,
  type CampaignExecution,
  type CampaignExecutionInput,
  type BrainMemoryRecord,
  type BrainMemoryInput
} from "./brain.contracts.js";

export class BrainRepository {
  constructor(private readonly pool: DatabasePool = db) {}

  public async upsertCompanyProfile(profile: CompanyProfileInput): Promise<void> {
    const sql = `
      INSERT INTO companies (
        tenant_id, company_name, website, industry, business_model,
        business_stage, description, founded_year, location, company_size,
        target_geography, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        website = EXCLUDED.website,
        industry = EXCLUDED.industry,
        business_model = EXCLUDED.business_model,
        business_stage = EXCLUDED.business_stage,
        description = EXCLUDED.description,
        founded_year = EXCLUDED.founded_year,
        location = EXCLUDED.location,
        company_size = EXCLUDED.company_size,
        target_geography = EXCLUDED.target_geography,
        updated_at = NOW();
    `;
    await this.pool.query(sql, [
      profile.tenantId,
      profile.companyName,
      profile.website ?? null,
      profile.industry ?? null,
      profile.businessModel ?? null,
      profile.businessStage ?? null,
      profile.description ?? null,
      profile.foundedYear ?? null,
      profile.location ?? null,
      profile.companySize ?? null,
      profile.targetGeography ?? null
    ]);
  }

  public async getCompanyProfile(tenantId: string): Promise<CompanyProfile | null> {
    const sql = `SELECT * FROM companies WHERE tenant_id = $1 LIMIT 1;`;
    const res = await this.pool.query<any>(sql, [tenantId]);
    const row = res.rows[0];
    if (!row) return null;
    return {
      tenantId: row.tenant_id,
      companyName: row.company_name,
      website: row.website ?? undefined,
      industry: row.industry ?? undefined,
      businessModel: row.business_model ?? undefined,
      businessStage: row.business_stage ?? undefined,
      description: row.description ?? undefined,
      foundedYear: row.founded_year ?? undefined,
      location: row.location ?? undefined,
      companySize: row.company_size ?? undefined,
      targetGeography: row.target_geography ?? undefined
    };
  }

  public async upsertProduct(product: CompanyProductInput): Promise<void> {
    const sql = `
      INSERT INTO company_products (
        tenant_id, product_name, category, description, problem_statement,
        problem_severity, solution_statement, differentiation, features,
        benefits, use_cases, pricing_model, pricing_details, product_stage,
        unique_features, limitations, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW());
    `;
    await this.pool.query(sql, [
      product.tenantId,
      product.productName,
      product.category ?? null,
      product.description ?? null,
      product.problemStatement ?? null,
      product.problemSeverity ?? null,
      product.solutionStatement ?? null,
      product.differentiation ?? null,
      JSON.stringify(product.features ?? []),
      JSON.stringify(product.benefits ?? []),
      JSON.stringify(product.useCases ?? []),
      product.pricingModel ?? null,
      JSON.stringify(product.pricingDetails ?? {}),
      product.productStage ?? null,
      JSON.stringify(product.uniqueFeatures ?? []),
      JSON.stringify(product.limitations ?? [])
    ]);
  }

  public async getProducts(tenantId: string): Promise<CompanyProduct[]> {
    const sql = `SELECT * FROM company_products WHERE tenant_id = $1 ORDER BY created_at ASC;`;
    const res = await this.pool.query<any>(sql, [tenantId]);
    return res.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      productName: row.product_name,
      category: row.category ?? undefined,
      description: row.description ?? undefined,
      problemStatement: row.problem_statement ?? undefined,
      problemSeverity: row.problem_severity ?? undefined,
      solutionStatement: row.solution_statement ?? undefined,
      differentiation: row.differentiation ?? undefined,
      features: row.features ?? [],
      benefits: row.benefits ?? [],
      useCases: row.use_cases ?? [],
      pricingModel: row.pricing_model ?? undefined,
      pricingDetails: row.pricing_details ?? {},
      productStage: row.product_stage ?? undefined,
      uniqueFeatures: row.unique_features ?? [],
      limitations: row.limitations ?? []
    }));
  }

  public async upsertIcp(icp: BusinessIcpInput): Promise<void> {
    const sql = `
      INSERT INTO business_icp (
        tenant_id, customer_type, company_size, industry, job_roles,
        budget_range, buying_power, location, pain_points, needs,
        goals, objections, buying_triggers, decision_criteria, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        customer_type = EXCLUDED.customer_type,
        company_size = EXCLUDED.company_size,
        industry = EXCLUDED.industry,
        job_roles = EXCLUDED.job_roles,
        budget_range = EXCLUDED.budget_range,
        buying_power = EXCLUDED.buying_power,
        location = EXCLUDED.location,
        pain_points = EXCLUDED.pain_points,
        needs = EXCLUDED.needs,
        goals = EXCLUDED.goals,
        objections = EXCLUDED.objections,
        buying_triggers = EXCLUDED.buying_triggers,
        decision_criteria = EXCLUDED.decision_criteria,
        updated_at = NOW();
    `;
    await this.pool.query(sql, [
      icp.tenantId,
      icp.customerType ?? null,
      icp.companySize ?? null,
      icp.industry ?? null,
      JSON.stringify(icp.jobRoles ?? []),
      icp.budgetRange ?? null,
      icp.buyingPower ?? null,
      icp.location ?? null,
      JSON.stringify(icp.painPoints ?? []),
      JSON.stringify(icp.needs ?? []),
      JSON.stringify(icp.goals ?? []),
      JSON.stringify(icp.objections ?? []),
      JSON.stringify(icp.buyingTriggers ?? []),
      JSON.stringify(icp.decisionCriteria ?? [])
    ]);
  }

  public async getIcp(tenantId: string): Promise<BusinessIcp | null> {
    const sql = `SELECT * FROM business_icp WHERE tenant_id = $1 LIMIT 1;`;
    const res = await this.pool.query<any>(sql, [tenantId]);
    const row = res.rows[0];
    if (!row) return null;
    return {
      tenantId: row.tenant_id,
      customerType: row.customer_type ?? undefined,
      companySize: row.company_size ?? undefined,
      industry: row.industry ?? undefined,
      jobRoles: row.job_roles ?? [],
      budgetRange: row.budget_range ?? undefined,
      buyingPower: row.buying_power ?? undefined,
      location: row.location ?? undefined,
      painPoints: row.pain_points ?? [],
      needs: row.needs ?? [],
      goals: row.goals ?? [],
      objections: row.objections ?? [],
      buyingTriggers: row.buying_triggers ?? [],
      decisionCriteria: row.decision_criteria ?? []
    };
  }

  public async upsertPersona(persona: PersonaInput): Promise<void> {
    const sql = `
      INSERT INTO personas (tenant_id, name, role, pain_points, goals, objections, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW());
    `;
    await this.pool.query(sql, [
      persona.tenantId,
      persona.name,
      persona.role,
      JSON.stringify(persona.painPoints ?? []),
      JSON.stringify(persona.goals ?? []),
      JSON.stringify(persona.objections ?? [])
    ]);
  }

  public async getPersonas(tenantId: string): Promise<Persona[]> {
    const sql = `SELECT * FROM personas WHERE tenant_id = $1 ORDER BY created_at ASC;`;
    const res = await this.pool.query<any>(sql, [tenantId]);
    return res.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      role: row.role,
      painPoints: row.pain_points ?? [],
      goals: row.goals ?? [],
      objections: row.objections ?? []
    }));
  }

  public async upsertBrandProfile(brand: BrandProfileInput): Promise<void> {
    const sql = `
      INSERT INTO brand_profiles (
        tenant_id, brand_name, brand_positioning, mission, vision,
        values, personality, brand_promise, differentiators,
        tone_positive, tone_avoid, core_message, value_proposition,
        primary_message, secondary_messages, taglines, key_benefits,
        proof_points, objection_handling, claims, content_rules, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, NOW()
      )
      ON CONFLICT (tenant_id) DO UPDATE SET
        brand_name = EXCLUDED.brand_name,
        brand_positioning = EXCLUDED.brand_positioning,
        mission = EXCLUDED.mission,
        vision = EXCLUDED.vision,
        values = EXCLUDED.values,
        personality = EXCLUDED.personality,
        brand_promise = EXCLUDED.brand_promise,
        differentiators = EXCLUDED.differentiators,
        tone_positive = EXCLUDED.tone_positive,
        tone_avoid = EXCLUDED.tone_avoid,
        core_message = EXCLUDED.core_message,
        value_proposition = EXCLUDED.value_proposition,
        primary_message = EXCLUDED.primary_message,
        secondary_messages = EXCLUDED.secondary_messages,
        taglines = EXCLUDED.taglines,
        key_benefits = EXCLUDED.key_benefits,
        proof_points = EXCLUDED.proof_points,
        objection_handling = EXCLUDED.objection_handling,
        claims = EXCLUDED.claims,
        content_rules = EXCLUDED.content_rules,
        updated_at = NOW();
    `;
    await this.pool.query(sql, [
      brand.tenantId,
      brand.brandName,
      brand.brandPositioning ?? null,
      brand.mission ?? null,
      brand.vision ?? null,
      JSON.stringify(brand.values ?? []),
      JSON.stringify(brand.personality ?? []),
      brand.brandPromise ?? null,
      JSON.stringify(brand.differentiators ?? []),
      JSON.stringify(brand.tonePositive ?? ["professional", "confident", "clear", "human"]),
      JSON.stringify(brand.toneAvoid ?? ["overly corporate", "generic AI language", "excessive hype", "buzzwords"]),
      brand.coreMessage ?? null,
      brand.valueProposition ?? null,
      brand.primaryMessage ?? null,
      JSON.stringify(brand.secondaryMessages ?? []),
      JSON.stringify(brand.taglines ?? []),
      JSON.stringify(brand.keyBenefits ?? []),
      JSON.stringify(brand.proofPoints ?? []),
      JSON.stringify(brand.objectionHandling ?? {}),
      JSON.stringify(brand.claims ?? []),
      JSON.stringify(brand.contentRules ?? [])
    ]);
  }

  public async getBrandProfile(tenantId: string): Promise<BrandProfile | null> {
    const sql = `SELECT * FROM brand_profiles WHERE tenant_id = $1 LIMIT 1;`;
    const res = await this.pool.query<any>(sql, [tenantId]);
    const row = res.rows[0];
    if (!row) return null;
    return {
      tenantId: row.tenant_id,
      brandName: row.brand_name,
      brandPositioning: row.brand_positioning ?? undefined,
      mission: row.mission ?? undefined,
      vision: row.vision ?? undefined,
      values: row.values ?? [],
      personality: row.personality ?? [],
      brandPromise: row.brand_promise ?? undefined,
      differentiators: row.differentiators ?? [],
      tonePositive: row.tone_positive ?? [],
      toneAvoid: row.tone_avoid ?? [],
      coreMessage: row.core_message ?? undefined,
      valueProposition: row.value_proposition ?? undefined,
      primaryMessage: row.primary_message ?? undefined,
      secondaryMessages: row.secondary_messages ?? [],
      taglines: row.taglines ?? [],
      keyBenefits: row.key_benefits ?? [],
      proofPoints: row.proof_points ?? [],
      objectionHandling: row.objection_handling ?? {},
      claims: row.claims ?? [],
      contentRules: row.content_rules ?? []
    };
  }

  public async upsertCompetitor(competitor: CompetitorInput): Promise<string> {
    const sql = `
      INSERT INTO competitors (
        tenant_id, name, website, product_name, category, current_pricing,
        positioning, target_audience, features, strengths, weaknesses,
        messaging, marketing_channels, content_strategy, ads_summary,
        seo_focus, social_presence, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()
      )
      ON CONFLICT (tenant_id, name) DO UPDATE SET
        website = EXCLUDED.website,
        product_name = EXCLUDED.product_name,
        category = EXCLUDED.category,
        current_pricing = EXCLUDED.current_pricing,
        positioning = EXCLUDED.positioning,
        target_audience = EXCLUDED.target_audience,
        features = EXCLUDED.features,
        strengths = EXCLUDED.strengths,
        weaknesses = EXCLUDED.weaknesses,
        messaging = EXCLUDED.messaging,
        marketing_channels = EXCLUDED.marketing_channels,
        content_strategy = EXCLUDED.content_strategy,
        ads_summary = EXCLUDED.ads_summary,
        seo_focus = EXCLUDED.seo_focus,
        social_presence = EXCLUDED.social_presence,
        updated_at = NOW()
      RETURNING id;
    `;
    const res = await this.pool.query<{ id: string }>(sql, [
      competitor.tenantId,
      competitor.name,
      competitor.website ?? null,
      competitor.productName ?? null,
      competitor.category ?? null,
      competitor.currentPricing ?? null,
      competitor.positioning ?? null,
      competitor.targetAudience ?? null,
      JSON.stringify(competitor.features ?? []),
      JSON.stringify(competitor.strengths ?? []),
      JSON.stringify(competitor.weaknesses ?? []),
      competitor.messaging ?? null,
      JSON.stringify(competitor.marketingChannels ?? []),
      competitor.contentStrategy ?? null,
      competitor.adsSummary ?? null,
      competitor.seoFocus ?? null,
      competitor.socialPresence ?? null
    ]);
    return res.rows[0]!.id;
  }

  public async recordCompetitorHistory(history: CompetitorHistory): Promise<void> {
    const sql = `
      INSERT INTO competitor_history (
        competitor_id, tenant_id, attribute_name, old_value, new_value,
        valid_from, valid_until, source_notes
      ) VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), $7, $8);
    `;
    await this.pool.query(sql, [
      history.competitorId,
      history.tenantId,
      history.attributeName,
      history.oldValue ?? null,
      history.newValue,
      history.validFrom ?? null,
      history.validUntil ?? null,
      history.sourceNotes ?? null
    ]);
  }

  public async getCompetitors(tenantId: string): Promise<Competitor[]> {
    const sql = `SELECT * FROM competitors WHERE tenant_id = $1 ORDER BY name ASC;`;
    const res = await this.pool.query<any>(sql, [tenantId]);
    return res.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      website: row.website ?? undefined,
      productName: row.product_name ?? undefined,
      category: row.category ?? undefined,
      currentPricing: row.current_pricing ?? undefined,
      positioning: row.positioning ?? undefined,
      targetAudience: row.target_audience ?? undefined,
      features: row.features ?? [],
      strengths: row.strengths ?? [],
      weaknesses: row.weaknesses ?? [],
      messaging: row.messaging ?? undefined,
      marketingChannels: row.marketing_channels ?? [],
      contentStrategy: row.content_strategy ?? undefined,
      adsSummary: row.ads_summary ?? undefined,
      seoFocus: row.seo_focus ?? undefined,
      socialPresence: row.social_presence ?? undefined
    }));
  }

  public async getCompetitorHistory(tenantId: string, competitorId: string): Promise<CompetitorHistory[]> {
    const sql = `
      SELECT * FROM competitor_history
      WHERE tenant_id = $1 AND competitor_id = $2
      ORDER BY detected_at DESC;
    `;
    const res = await this.pool.query<any>(sql, [tenantId, competitorId]);
    return res.rows.map((row) => ({
      id: row.id,
      competitorId: row.competitor_id,
      tenantId: row.tenant_id,
      attributeName: row.attribute_name,
      oldValue: row.old_value ?? null,
      newValue: row.new_value,
      detectedAt: row.detected_at,
      validFrom: row.valid_from,
      validUntil: row.valid_until ?? null,
      sourceNotes: row.source_notes ?? undefined
    }));
  }

  public async upsertGoal(goal: CompanyGoalInput): Promise<string> {
    const sql = `
      INSERT INTO company_goals (
        tenant_id, objective, timeframe, deadline, priority,
        target_audience, channels, success_metric, target_metric_value,
        current_metric_value, status, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id;
    `;
    const res = await this.pool.query<{ id: string }>(sql, [
      goal.tenantId,
      goal.objective,
      goal.timeframe ?? null,
      goal.deadline ?? null,
      goal.priority ?? "medium",
      goal.targetAudience ?? null,
      JSON.stringify(goal.channels ?? []),
      goal.successMetric,
      goal.targetMetricValue ?? null,
      goal.currentMetricValue ?? null,
      goal.status ?? "active"
    ]);
    return res.rows[0]!.id;
  }

  public async getGoals(tenantId: string, status?: string): Promise<CompanyGoal[]> {
    const sql = status
      ? `SELECT * FROM company_goals WHERE tenant_id = $1 AND status = $2 ORDER BY created_at DESC;`
      : `SELECT * FROM company_goals WHERE tenant_id = $1 ORDER BY created_at DESC;`;
    const params = status ? [tenantId, status] : [tenantId];
    const res = await this.pool.query<any>(sql, params);
    return res.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      objective: row.objective,
      timeframe: row.timeframe ?? undefined,
      deadline: row.deadline ?? undefined,
      priority: row.priority,
      targetAudience: row.target_audience ?? undefined,
      channels: row.channels ?? [],
      successMetric: row.success_metric,
      targetMetricValue: row.target_metric_value ?? undefined,
      currentMetricValue: row.current_metric_value ?? undefined,
      status: row.status
    }));
  }

  public async recordStrategyVersion(strategy: StrategyVersionInput): Promise<void> {
    const isCurrent = strategy.isCurrent ?? true;
    const version = strategy.version ?? 1;
    const status = strategy.status ?? "active";

    await this.pool.withTransaction(async (client) => {
      if (isCurrent) {
        await client.query(
          `UPDATE strategy_versions SET is_current = FALSE WHERE tenant_id = $1 AND strategy_key = $2;`,
          [strategy.tenantId, strategy.strategyKey]
        );
      }

      await client.query(
        `INSERT INTO strategy_versions (
          tenant_id, strategy_key, version, title, content, rationale,
          decision_maker, is_current, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [
          strategy.tenantId,
          strategy.strategyKey,
          version,
          strategy.title,
          strategy.content,
          strategy.rationale ?? null,
          strategy.decisionMaker ?? null,
          isCurrent,
          status
        ]
      );
    });
  }

  public async getStrategies(tenantId: string, onlyCurrent: boolean = true): Promise<StrategyVersion[]> {
    const sql = onlyCurrent
      ? `SELECT * FROM strategy_versions WHERE tenant_id = $1 AND is_current = TRUE ORDER BY created_at DESC;`
      : `SELECT * FROM strategy_versions WHERE tenant_id = $1 ORDER BY strategy_key ASC, version DESC;`;
    const res = await this.pool.query<any>(sql, [tenantId]);
    return res.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      strategyKey: row.strategy_key,
      version: row.version,
      title: row.title,
      content: row.content,
      rationale: row.rationale ?? undefined,
      decisionMaker: row.decision_maker ?? undefined,
      isCurrent: row.is_current,
      status: row.status,
      createdAt: row.created_at
    }));
  }

  public async recordCampaignExecution(campaign: CampaignExecutionInput): Promise<string> {
    const sql = `
      INSERT INTO campaign_executions (
        tenant_id, goal_id, campaign_name, channel, objective, target_audience,
        spend_amount, currency, impressions, clicks, ctr, conversions,
        leads_generated, qualified_leads, customers_acquired, status, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      RETURNING id;
    `;
    const res = await this.pool.query<{ id: string }>(sql, [
      campaign.tenantId,
      campaign.goalId ?? null,
      campaign.campaignName,
      campaign.channel,
      campaign.objective ?? null,
      campaign.targetAudience ?? null,
      campaign.spendAmount ?? 0,
      campaign.currency ?? "INR",
      campaign.impressions ?? 0,
      campaign.clicks ?? 0,
      campaign.ctr ?? 0,
      campaign.conversions ?? 0,
      campaign.leadsGenerated ?? 0,
      campaign.qualifiedLeads ?? 0,
      campaign.customersAcquired ?? 0,
      campaign.status ?? "draft"
    ]);
    return res.rows[0]!.id;
  }

  public async getCampaigns(tenantId: string): Promise<CampaignExecution[]> {
    const sql = `SELECT * FROM campaign_executions WHERE tenant_id = $1 ORDER BY created_at DESC;`;
    const res = await this.pool.query<any>(sql, [tenantId]);
    return res.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      goalId: row.goal_id ?? undefined,
      campaignName: row.campaign_name,
      channel: row.channel,
      objective: row.objective ?? undefined,
      targetAudience: row.target_audience ?? undefined,
      spendAmount: Number(row.spend_amount),
      currency: row.currency,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: Number(row.ctr),
      conversions: row.conversions,
      leadsGenerated: row.leads_generated,
      qualifiedLeads: row.qualified_leads,
      customersAcquired: row.customers_acquired,
      status: row.status
    }));
  }

  public async saveMemory(memory: BrainMemoryInput): Promise<string> {
    const sql = `
      INSERT INTO brain_memories (
        tenant_id, memory_type, statement, rationale, confidence_level,
        confidence_score, evidence_count, evidence, status, validated_by,
        validated_at, source_priority, valid_from, valid_until, is_current,
        metadata, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, COALESCE($13, NOW()), $14, $15, $16, NOW())
      RETURNING id;
    `;
    const res = await this.pool.query<{ id: string }>(sql, [
      memory.tenantId,
      memory.memoryType,
      memory.statement,
      memory.rationale ?? null,
      memory.confidenceLevel ?? "MEDIUM",
      memory.confidenceScore ?? 0.5,
      memory.evidenceCount ?? 1,
      JSON.stringify(memory.evidence ?? []),
      memory.status ?? "unvalidated",
      memory.validatedBy ?? null,
      memory.validatedAt ?? null,
      memory.sourcePriority ?? 5,
      memory.validFrom ?? null,
      memory.validUntil ?? null,
      memory.isCurrent ?? true,
      JSON.stringify(memory.metadata ?? {})
    ]);
    return res.rows[0]!.id;
  }

  public async updateMemoryStatus(
    tenantId: string,
    memoryId: string,
    status: string,
    validatedBy?: string,
    newType?: string,
    newConfidenceLevel?: string
  ): Promise<void> {
    const sql = `
      UPDATE brain_memories SET
        status = $3,
        validated_by = COALESCE($4, validated_by),
        validated_at = CASE WHEN $3 = 'validated' THEN NOW() ELSE validated_at END,
        memory_type = COALESCE($5, memory_type),
        confidence_level = COALESCE($6, confidence_level),
        confidence_score = CASE WHEN $6 = 'HIGH' THEN 0.95 WHEN $6 = 'MEDIUM' THEN 0.70 ELSE confidence_score END,
        updated_at = NOW()
      WHERE tenant_id = $1 AND id = $2;
    `;
    await this.pool.query(sql, [
      tenantId,
      memoryId,
      status,
      validatedBy ?? null,
      newType ?? null,
      newConfidenceLevel ?? null
    ]);
  }

  public async queryMemories(
    tenantId: string,
    options: {
      memoryType?: string;
      status?: string;
      onlyCurrent?: boolean;
      minConfidence?: number;
    } = {}
  ): Promise<BrainMemoryRecord[]> {
    let sql = `SELECT * FROM brain_memories WHERE tenant_id = $1`;
    const params: unknown[] = [tenantId];

    if (options.memoryType) {
      params.push(options.memoryType);
      sql += ` AND memory_type = $${params.length}`;
    }

    if (options.status) {
      params.push(options.status);
      sql += ` AND status = $${params.length}`;
    }

    if (options.onlyCurrent !== false) {
      sql += ` AND is_current = TRUE`;
    }

    if (options.minConfidence !== undefined) {
      params.push(options.minConfidence);
      sql += ` AND confidence_score >= $${params.length}`;
    }

    sql += ` ORDER BY source_priority ASC, confidence_score DESC, created_at DESC;`;

    const res = await this.pool.query<any>(sql, params);
    return res.rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      memoryType: row.memory_type,
      statement: row.statement,
      rationale: row.rationale ?? undefined,
      confidenceLevel: row.confidence_level,
      confidenceScore: Number(row.confidence_score),
      evidenceCount: row.evidence_count,
      evidence: row.evidence ?? [],
      status: row.status,
      validatedBy: row.validated_by ?? undefined,
      validatedAt: row.validated_at ?? undefined,
      sourcePriority: row.source_priority,
      validFrom: row.valid_from,
      validUntil: row.valid_until ?? undefined,
      isCurrent: row.is_current,
      metadata: row.metadata ?? {}
    }));
  }

  public async upsertDocument(
    tenantId: string,
    title: string,
    contentHash: string,
    sourceUri?: string,
    metadata: Record<string, unknown> = {},
    provenance?: string
  ): Promise<DocumentRecord> {
    const sql = `
      INSERT INTO documents (
        tenant_id, title, content_hash, source_uri, metadata, provenance, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (tenant_id, content_hash) DO UPDATE SET
        title = EXCLUDED.title,
        source_uri = EXCLUDED.source_uri,
        metadata = EXCLUDED.metadata,
        provenance = COALESCE(EXCLUDED.provenance, documents.provenance),
        updated_at = NOW()
      RETURNING
        id, tenant_id AS "tenantId", title, source_uri AS "sourceUri",
        content_hash AS "contentHash", document_type AS "documentType",
        author, department, tags, confidence_score AS "confidenceScore",
        provenance, valid_from AS "validFrom", valid_until AS "validUntil",
        is_current AS "isCurrent", status, metadata,
        created_at AS "createdAt", updated_at AS "updatedAt";
    `;
    const res = await this.pool.query<any>(sql, [
      tenantId,
      title,
      contentHash,
      sourceUri ?? null,
      JSON.stringify(metadata),
      provenance ?? null
    ]);
    const row = res.rows[0];
    return DocumentRecordSchema.parse({
      ...row,
      tags: row.tags ?? [],
      confidenceScore: Number(row.confidenceScore)
    });
  }

  public async insertChunks(chunks: readonly DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    await this.pool.withTransaction(async (client) => {
      const sql = `
        INSERT INTO document_chunks (
          document_id, tenant_id, chunk_index, content, token_count, embedding, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (document_id, chunk_index) DO UPDATE SET
          content = EXCLUDED.content,
          token_count = EXCLUDED.token_count,
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata;
      `;
      for (const chunk of chunks) {
        await client.query(sql, [
          chunk.documentId,
          chunk.tenantId,
          chunk.chunkIndex,
          chunk.content,
          chunk.tokenCount,
          toSql(chunk.embedding),
          JSON.stringify(chunk.metadata)
        ]);
      }
    });
  }

  public async searchSimilarChunks(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    const vectorSql = toSql(query.embedding);
    const sql = `
      SELECT
        c.id AS chunk_id,
        c.document_id,
        c.tenant_id,
        c.content,
        c.chunk_index,
        d.title AS document_title,
        d.provenance,
        c.metadata,
        1 - (c.embedding <=> $1) AS similarity
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE c.tenant_id = $2
        AND ($4::boolean IS FALSE OR d.is_current = TRUE)
        AND 1 - (c.embedding <=> $1) >= $3
      ORDER BY similarity DESC
      LIMIT $5;
    `;
    const res = await this.pool.query<any>(sql, [
      vectorSql,
      query.tenantId,
      query.minSimilarity,
      query.onlyCurrent,
      query.limit
    ]);

    return res.rows.map((row) => ({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      tenantId: row.tenant_id,
      content: row.content,
      similarity: Number(row.similarity),
      chunkIndex: row.chunk_index,
      provenance: row.provenance ?? undefined,
      documentTitle: row.document_title ?? undefined,
      metadata: row.metadata ?? {}
    }));
  }
}

export const brainRepository = new BrainRepository();
