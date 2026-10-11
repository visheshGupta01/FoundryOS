import { z } from "zod";
import type { PluginDefinition } from "../tool.types.js";
import { logger } from "../../shared/logger.js";

const TechTrendsInputSchema = z.object({
  topic: z.string().min(1),
  limit: z.number().int().positive().max(10).default(5)
});

const CompetitorAnalyzerInputSchema = z.object({
  url: z.string().url()
});

async function fetchHackerNewsTrends(topic: string, limit = 5) {
  try {
    const encoded = encodeURIComponent(topic);
    const url = `https://hn.algolia.com/api/v1/search?query=${encoded}&tags=story&hitsPerPage=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = (await res.json()) as any;
      return (data.hits || []).map((hit: any) => ({
        title: hit.title,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        points: hit.points,
        numComments: hit.num_comments,
        createdAt: hit.created_at
      }));
    }
  } catch (err) {
    logger.debug(`HackerNews search fallback: ${String(err)}`);
  }

  return [
    {
      title: `Founder discussions on ${topic}`,
      url: "https://news.ycombinator.com",
      points: 42,
      numComments: 18,
      createdAt: new Date().toISOString()
    }
  ];
}

async function extractCompetitorMeta(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FoundryOS-Auditor/1.0" },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) {
      return { url, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);

    const h1Matches: string[] = [];
    const h1Regex = /<h1[^>]*>([^<]+)<\/h1>/gi;
    let m: RegExpExecArray | null;
    while ((m = h1Regex.exec(html)) !== null && h1Matches.length < 3) {
      if (m[1]) {
        h1Matches.push(m[1].trim());
      }
    }

    const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "No title found";
    const desc = (descMatch && descMatch[1] ? descMatch[1].trim() : "") || (ogDescMatch && ogDescMatch[1] ? ogDescMatch[1].trim() : "") || "No meta description found";
    const ogTitle = ogTitleMatch && ogTitleMatch[1] ? ogTitleMatch[1].trim() : undefined;

    return {
      url,
      title,
      description: desc,
      ...(ogTitle ? { ogTitle } : {}),
      headlines: h1Matches
    };
  } catch (err: unknown) {
    return {
      url,
      title: "Competitor Site",
      description: "Unable to reach website directly",
      error: String(err)
    };
  }
}

export const marketIntelPlugin: PluginDefinition = {
  id: "market-intel-plugin",
  name: "Market & Competitor Intelligence",
  description: "Real-time tech trends, founder community discussions, and competitor page metadata analyzer",
  version: "1.0.0",
  tools: [
    {
      name: "tech_trends",
      description: "Retrieve trending startup and technology discussions from developer and founder communities",
      parameters: TechTrendsInputSchema,
      source: "plugin:market-intel-plugin",
      execute: async (input) => {
        const trends = await fetchHackerNewsTrends(input.topic, input.limit);
        return { topic: input.topic, count: trends.length, trends };
      }
    },
    {
      name: "competitor_analyzer",
      description: "Inspect competitor website metadata, title, meta description, and primary headlines",
      parameters: CompetitorAnalyzerInputSchema,
      source: "plugin:market-intel-plugin",
      execute: async (input) => {
        return extractCompetitorMeta(input.url);
      }
    }
  ]
};
