export function formatAgentOutputToMarkdown(output: unknown): string {
  if (!output) {
    return 'Task executed successfully with no additional output.';
  }

  if (typeof output === 'string') {
    return output;
  }

  if (typeof output !== 'object') {
    return String(output);
  }

  const data = output as Record<string, any>;

  if (data.advice) {
    const parts: string[] = [];
    if (data.summary) {
      parts.push(`### ${data.summary}\n`);
    }
    parts.push(data.advice);
    if (Array.isArray(data.specialistContributions) && data.specialistContributions.length > 0) {
      parts.push('\n\n#### 👥 Specialist Synchronizations:');
      data.specialistContributions.forEach(sc => {
        parts.push(`- **${sc.agent}** (${sc.role}): *${sc.status}*`);
      });
    }
    return parts.join('\n');
  }

  const lines: string[] = [];

  if (data.marketTrends || data.targetSegments) {
    lines.push('### 📊 Strategic Market Intelligence Audit');
    if (data.summary) {
      lines.push(`\n**Executive Summary**:\n${data.summary}\n`);
    }
    if (Array.isArray(data.marketTrends) && data.marketTrends.length > 0) {
      lines.push('#### Key Market Trends:');
      data.marketTrends.forEach(trend => lines.push(`- ${trend}`));
      lines.push('');
    }
    if (Array.isArray(data.targetSegments) && data.targetSegments.length > 0) {
      lines.push('#### High-Priority Target Segments:');
      data.targetSegments.forEach(seg => {
        const title = seg.segmentName || seg.name || 'Segment';
        const urgency = seg.urgency ? ` [${String(seg.urgency).toUpperCase()}]` : '';
        const opp = seg.opportunity || seg.description || '';
        lines.push(`- **${title}**${urgency}: ${opp}`);
      });
      lines.push('');
    }
    if (Array.isArray(data.macroRisks) && data.macroRisks.length > 0) {
      lines.push('#### Macro Risks & Headwinds:');
      data.macroRisks.forEach(risk => lines.push(`- ${risk}`));
      lines.push('');
    }
    if (typeof data.confidenceScore === 'number') {
      lines.push(`*Model Confidence Score: ${(data.confidenceScore * 100).toFixed(0)}%*`);
    }
    return lines.join('\n');
  }

  if (data.competitorTeardowns || data.featureGaps) {
    lines.push('### ⚔️ Competitor Intelligence Teardown');
    if (data.summary) {
      lines.push(`\n**Executive Takeaway**:\n${data.summary}\n`);
    }
    if (Array.isArray(data.competitorTeardowns) && data.competitorTeardowns.length > 0) {
      lines.push('#### Competitor Teardowns:');
      data.competitorTeardowns.forEach(comp => {
        const name = comp.name || comp.competitorName || 'Competitor';
        lines.push(`##### 🎯 ${name}`);
        if (comp.pricingModel) {
          lines.push(`- **Pricing Model**: ${comp.pricingModel}`);
        }
        if (Array.isArray(comp.advantages) && comp.advantages.length > 0) {
          lines.push(`- **Advantages**: ${comp.advantages.join(', ')}`);
        }
        if (Array.isArray(comp.vulnerabilities) && comp.vulnerabilities.length > 0) {
          lines.push(`- **Vulnerabilities**: ${comp.vulnerabilities.join(', ')}`);
        } else if (typeof comp.vulnerabilities === 'string') {
          lines.push(`- **Vulnerabilities**: ${comp.vulnerabilities}`);
        }
        lines.push('');
      });
    }
    if (Array.isArray(data.featureGaps) && data.featureGaps.length > 0) {
      lines.push('#### Exploitable Feature & Context Gaps:');
      data.featureGaps.forEach(gap => lines.push(`- ${gap}`));
      lines.push('');
    }
    if (Array.isArray(data.counterTactics) && data.counterTactics.length > 0) {
      lines.push('#### Recommended Counter-Tactics:');
      data.counterTactics.forEach(tactic => lines.push(`- ${tactic}`));
      lines.push('');
    }
    if (data.threatLevel) {
      lines.push(`*Overall Threat Level: ${String(data.threatLevel).toUpperCase()}*`);
    }
    return lines.join('\n');
  }

  if (data.positioningStatement || data.valueProposition) {
    lines.push('### 🎯 Brand Positioning & Strategic Pillars');
    if (data.positioningStatement) {
      lines.push(`\n**Core Positioning Statement**:\n> ${data.positioningStatement}\n`);
    }
    if (data.valueProposition) {
      lines.push(`**Unique Value Proposition**:\n${data.valueProposition}\n`);
    }
    if (Array.isArray(data.strategicPillars) && data.strategicPillars.length > 0) {
      lines.push('#### Strategic Pillars:');
      data.strategicPillars.forEach(p => {
        if (typeof p === 'string') {
          lines.push(`- ${p}`);
        } else {
          lines.push(`- **${p.pillar || p.title || 'Pillar'}**: ${p.description || p.detail || ''}`);
        }
      });
      lines.push('');
    }
    if (Array.isArray(data.goalAlignment) && data.goalAlignment.length > 0) {
      lines.push('#### Strategic Goal Alignment:');
      data.goalAlignment.forEach(ga => {
        lines.push(`- **${ga.goal}**: ${ga.initiative} *(Target: ${ga.targetMetric})*`);
      });
      lines.push('');
    }
    if (Array.isArray(data.channelPriorities) && data.channelPriorities.length > 0) {
      lines.push('#### Priority GTM Channels:');
      data.channelPriorities.forEach(ch => lines.push(`- ${ch}`));
      lines.push('');
    }
    if (Array.isArray(data.brandToneChecks) && data.brandToneChecks.length > 0) {
      lines.push('#### Brand Voice & Tone Governance:');
      data.brandToneChecks.forEach(tc => lines.push(`- ${tc}`));
      lines.push('');
    }
    return lines.join('\n');
  }

  if (data.campaignTheme || data.funnelStages) {
    lines.push('### 📈 Go-To-Market Funnel Architecture');
    if (data.campaignTheme) {
      lines.push(`\n**Campaign Theme**:\n${data.campaignTheme}\n`);
    }
    if (data.funnelStages && typeof data.funnelStages === 'object' && !Array.isArray(data.funnelStages)) {
      lines.push('#### Funnel Stages:');
      const stages = [
        { key: 'tofu', label: 'Top-of-Funnel (TOFU) Awareness' },
        { key: 'mofu', label: 'Middle-of-Funnel (MOFU) Consideration' },
        { key: 'bofu', label: 'Bottom-of-Funnel (BOFU) Conversion' }
      ];
      stages.forEach(({ key, label }) => {
        const stage = data.funnelStages[key];
        if (stage) {
          lines.push(`##### ${label}`);
          if (stage.focus) lines.push(`- **Focus**: ${stage.focus}`);
          if (Array.isArray(stage.tactics) && stage.tactics.length > 0) {
            lines.push(`- **Tactics**:`);
            stage.tactics.forEach((t: string) => lines.push(`  - ${t}`));
          }
          lines.push('');
        }
      });
    } else if (Array.isArray(data.funnelStages) && data.funnelStages.length > 0) {
      lines.push('#### Funnel Stages:');
      data.funnelStages.forEach(st => {
        lines.push(`- **${st.stageName || st.stage || 'Stage'}**: ${st.strategy || st.offer || ''}`);
      });
      lines.push('');
    }
    if (data.offerArchitecture && typeof data.offerArchitecture === 'object') {
      lines.push('#### High-Converting Offer Architecture:');
      if (data.offerArchitecture.coreOffer) {
        lines.push(`- **Core Offer**: ${data.offerArchitecture.coreOffer}`);
      }
      if (data.offerArchitecture.incentive) {
        lines.push(`- **Value Add / Incentive**: ${data.offerArchitecture.incentive}`);
      }
      if (data.offerArchitecture.riskReversal) {
        lines.push(`- **Risk Reversal Guarantee**: ${data.offerArchitecture.riskReversal}`);
      }
      lines.push('');
    }
    if (Array.isArray(data.kpis) && data.kpis.length > 0) {
      lines.push('#### Success Metrics & KPIs:');
      data.kpis.forEach(kpi => lines.push(`- ${kpi}`));
      lines.push('');
    }
    return lines.join('\n');
  }

  for (const [key, value] of Object.entries(data)) {
    if (key === 'tokenReport' || key === 'status' || key === 'executionId') continue;
    const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    if (typeof value === 'string') {
      lines.push(`**${readableKey}**:\n${value}\n`);
    } else if (Array.isArray(value)) {
      lines.push(`#### ${readableKey}:`);
      value.forEach(item => {
        if (typeof item === 'string') lines.push(`- ${item}`);
        else lines.push(`- ${JSON.stringify(item)}`);
      });
      lines.push('');
    }
  }

  return lines.length > 0 ? lines.join('\n') : JSON.stringify(output, null, 2);
}
