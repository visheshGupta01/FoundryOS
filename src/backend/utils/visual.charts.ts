export interface MarketSizingVisualData {
  tam: string;
  sam: string;
  som: string;
  categoryName?: string;
}

export interface CompetitorMatrixVisualData {
  companyName: string;
  competitors: string[];
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export interface FunnelVisualData {
  tofuLabel: string;
  mofuLabel: string;
  bofuLabel: string;
  cacPayback?: string;
}

export interface StrategyPillarsVisualData {
  companyName: string;
  pillars: Array<{ title: string; subtitle: string }>;
}

function sanitizeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function encodeSvg(svg: string): string {
  const base64 = Buffer.from(svg.trim()).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export function generateMarketSizingSvg(data: MarketSizingVisualData): string {
  const category = sanitizeXml(data.categoryName || 'Market Sizing Architecture');
  const tam = sanitizeXml(data.tam || '$48.5B');
  const sam = sanitizeXml(data.sam || '$12.2B');
  const som = sanitizeXml(data.som || '$1.8B');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 260" width="100%" height="100%">
    <defs>
      <linearGradient id="tamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.05"/>
      </linearGradient>
      <linearGradient id="samGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#818cf8" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#818cf8" stop-opacity="0.08"/>
      </linearGradient>
      <linearGradient id="somGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#34d399" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#34d399" stop-opacity="0.12"/>
      </linearGradient>
    </defs>
    <rect width="760" height="260" rx="14" fill="#0d0e12" stroke="#27272a" stroke-width="1.2"/>
    <text x="32" y="38" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700" letter-spacing="-0.01em">📊 ${category} (TAM / SAM / SOM)</text>
    <text x="32" y="56" fill="#71717a" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11">Total Addressable vs Serviceable Addressable vs Obtainable Market</text>

    <!-- TAM Bar -->
    <rect x="32" y="78" width="696" height="42" rx="8" fill="url(#tamGrad)" stroke="#38bdf8" stroke-width="1"/>
    <text x="48" y="104" fill="#bae6fd" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="600">TAM (Total Addressable)</text>
    <text x="712" y="104" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" text-anchor="end">${tam}</text>

    <!-- SAM Bar -->
    <rect x="32" y="132" width="460" height="42" rx="8" fill="url(#samGrad)" stroke="#818cf8" stroke-width="1"/>
    <text x="48" y="158" fill="#e0e7ff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="600">SAM (Serviceable Market)</text>
    <text x="476" y="158" fill="#818cf8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" text-anchor="end">${sam}</text>

    <!-- SOM Bar -->
    <rect x="32" y="186" width="260" height="42" rx="8" fill="url(#somGrad)" stroke="#34d399" stroke-width="1"/>
    <text x="48" y="212" fill="#d1fae5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="600">SOM (Year 1-2 Reach)</text>
    <text x="276" y="212" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" text-anchor="end">${som}</text>
  </svg>`;

  return encodeSvg(svg);
}

export function generateCompetitorMatrixSvg(data: CompetitorMatrixVisualData): string {
  const company = sanitizeXml(data.companyName || 'Our Product');
  const comp1 = sanitizeXml(data.competitors[0] || 'Legacy Incumbents');
  const comp2 = sanitizeXml(data.competitors[1] || 'Point Solutions');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 300" width="100%" height="100%">
    <defs>
      <radialGradient id="winnerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#818cf8" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#818cf8" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="760" height="300" rx="14" fill="#0d0e12" stroke="#27272a" stroke-width="1.2"/>
    <text x="32" y="34" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700">⚔️ Competitive Moat & Positioning 2x2 Matrix</text>
    
    <!-- Quadrant background tints -->
    <rect x="390" y="52" width="338" height="105" rx="6" fill="rgba(129, 140, 248, 0.08)" stroke="rgba(129, 140, 248, 0.2)" stroke-dasharray="3,3"/>
    <text x="716" y="72" fill="#818cf8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" font-weight="600" text-anchor="end">CATEGORY LEADER (High Moat / Fast Velocity)</text>

    <!-- Axes -->
    <line x1="390" y1="52" x2="390" y2="265" stroke="#3f3f46" stroke-width="1.2"/>
    <line x1="52" y1="158" x2="728" y2="158" stroke="#3f3f46" stroke-width="1.2"/>

    <!-- Axis Labels -->
    <text x="728" y="176" fill="#a1a1aa" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" text-anchor="end">Execution Velocity →</text>
    <text x="382" y="66" fill="#a1a1aa" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" text-anchor="end">↑ Strategic Moat</text>

    <!-- Incumbent Node -->
    <circle cx="210" cy="105" r="14" fill="#ef4444" fill-opacity="0.2" stroke="#ef4444" stroke-width="1.5"/>
    <circle cx="210" cy="105" r="5" fill="#ef4444"/>
    <text x="210" y="132" fill="#fca5a5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="500" text-anchor="middle">${comp1}</text>
    <text x="210" y="145" fill="#71717a" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" text-anchor="middle">Bloated / Slow</text>

    <!-- Point Solutions Node -->
    <circle cx="270" cy="215" r="14" fill="#eab308" fill-opacity="0.2" stroke="#eab308" stroke-width="1.5"/>
    <circle cx="270" cy="215" r="5" fill="#eab308"/>
    <text x="270" y="242" fill="#fde047" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="500" text-anchor="middle">${comp2}</text>
    <text x="270" y="255" fill="#71717a" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" text-anchor="middle">Narrow Utility</text>

    <!-- Our Company Winner Node -->
    <circle cx="580" cy="98" r="32" fill="url(#winnerGlow)"/>
    <circle cx="580" cy="98" r="16" fill="#818cf8" fill-opacity="0.3" stroke="#818cf8" stroke-width="2"/>
    <circle cx="580" cy="98" r="7" fill="#818cf8"/>
    <rect x="500" y="122" width="160" height="26" rx="13" fill="#18181b" stroke="#818cf8" stroke-width="1.2"/>
    <text x="580" y="139" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" text-anchor="middle">★ ${company}</text>
  </svg>`;

  return encodeSvg(svg);
}

export function generateGtmFunnelSvg(data: FunnelVisualData): string {
  const tofu = sanitizeXml(data.tofuLabel || 'High-Intent Discovery');
  const mofu = sanitizeXml(data.mofuLabel || 'Interactive Frictionless Demo');
  const bofu = sanitizeXml(data.bofuLabel || 'Paid Conversion & Expansion');
  const payback = sanitizeXml(data.cacPayback || '< 90 Days Payback');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 220" width="100%" height="100%">
    <rect width="760" height="220" rx="14" fill="#0d0e12" stroke="#27272a" stroke-width="1.2"/>
    <text x="32" y="34" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700">📈 GTM Conversion Funnel Architecture</text>
    <text x="728" y="34" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="600" text-anchor="end">Target: ${payback}</text>

    <!-- Step 1: TOFU -->
    <rect x="32" y="62" width="216" height="126" rx="10" fill="rgba(56, 189, 248, 0.06)" stroke="#38bdf8" stroke-width="1"/>
    <rect x="44" y="74" width="60" height="20" rx="4" fill="rgba(56, 189, 248, 0.2)"/>
    <text x="74" y="88" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" font-weight="700" text-anchor="middle">STAGE 1</text>
    <text x="44" y="116" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="600">TOFU: Acquisition</text>
    <text x="44" y="138" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11">${tofu}</text>

    <!-- Arrow 1 -->
    <path d="M 256 125 L 268 125 M 264 120 L 270 125 L 264 130" stroke="#52525b" stroke-width="2" fill="none"/>

    <!-- Step 2: MOFU -->
    <rect x="272" y="62" width="216" height="126" rx="10" fill="rgba(129, 140, 248, 0.06)" stroke="#818cf8" stroke-width="1"/>
    <rect x="284" y="74" width="60" height="20" rx="4" fill="rgba(129, 140, 248, 0.2)"/>
    <text x="314" y="88" fill="#818cf8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" font-weight="700" text-anchor="middle">STAGE 2</text>
    <text x="284" y="116" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="600">MOFU: Activation</text>
    <text x="284" y="138" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11">${mofu}</text>

    <!-- Arrow 2 -->
    <path d="M 496 125 L 508 125 M 504 120 L 510 125 L 504 130" stroke="#52525b" stroke-width="2" fill="none"/>

    <!-- Step 3: BOFU -->
    <rect x="512" y="62" width="216" height="126" rx="10" fill="rgba(52, 211, 153, 0.06)" stroke="#34d399" stroke-width="1"/>
    <rect x="524" y="74" width="60" height="20" rx="4" fill="rgba(52, 211, 153, 0.2)"/>
    <text x="554" y="88" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" font-weight="700" text-anchor="middle">STAGE 3</text>
    <text x="524" y="116" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="600">BOFU: Conversion</text>
    <text x="524" y="138" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11">${bofu}</text>
  </svg>`;

  return encodeSvg(svg);
}

export function generatePillarsSvg(data: StrategyPillarsVisualData): string {
  const company = sanitizeXml(data.companyName || 'Company');
  const p1 = data.pillars[0] || { title: 'Pillar 1', subtitle: 'Unfair Advantage' };
  const p2 = data.pillars[1] || { title: 'Pillar 2', subtitle: 'Defensible Moat' };
  const p3 = data.pillars[2] || { title: 'Pillar 3', subtitle: 'Scale Acceleration' };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 210" width="100%" height="100%">
    <rect width="760" height="210" rx="14" fill="#0d0e12" stroke="#27272a" stroke-width="1.2"/>
    <text x="32" y="34" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700">🎯 Strategic Positioning Blueprint (${company})</text>

    <!-- Pillar 1 -->
    <rect x="32" y="58" width="216" height="126" rx="10" fill="#18181b" stroke="#38bdf8" stroke-width="1.2"/>
    <circle cx="56" cy="82" r="12" fill="rgba(56, 189, 248, 0.2)"/>
    <text x="56" y="86" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" text-anchor="middle">1</text>
    <text x="78" y="86" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700">${sanitizeXml(p1.title)}</text>
    <text x="44" y="118" fill="#a1a1aa" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11">${sanitizeXml(p1.subtitle)}</text>

    <!-- Pillar 2 -->
    <rect x="272" y="58" width="216" height="126" rx="10" fill="#18181b" stroke="#818cf8" stroke-width="1.2"/>
    <circle cx="296" cy="82" r="12" fill="rgba(129, 140, 248, 0.2)"/>
    <text x="296" y="86" fill="#818cf8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" text-anchor="middle">2</text>
    <text x="318" y="86" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700">${sanitizeXml(p2.title)}</text>
    <text x="284" y="118" fill="#a1a1aa" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11">${sanitizeXml(p2.subtitle)}</text>

    <!-- Pillar 3 -->
    <rect x="512" y="58" width="216" height="126" rx="10" fill="#18181b" stroke="#34d399" stroke-width="1.2"/>
    <circle cx="536" cy="82" r="12" fill="rgba(52, 211, 153, 0.2)"/>
    <text x="536" y="86" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" text-anchor="middle">3</text>
    <text x="558" y="86" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700">${sanitizeXml(p3.title)}</text>
    <text x="524" y="118" fill="#a1a1aa" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11">${sanitizeXml(p3.subtitle)}</text>
  </svg>`;

  return encodeSvg(svg);
}
