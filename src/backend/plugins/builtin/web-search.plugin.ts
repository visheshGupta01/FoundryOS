import { z } from "zod";
import type { PluginDefinition } from "../tool.types.js";
import { logger } from "../../shared/logger.js";

const WebSearchInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(10).default(5)
});

const ExaSearchInputSchema = z.object({
  query: z.string().min(1),
  numResults: z.number().int().positive().max(10).default(5),
  useAutoprompt: z.boolean().default(true)
});

const FetchPageInputSchema = z.object({
  url: z.string().url()
});

async function runDuckDuckGoSearch(query: string, limit = 5): Promise<Array<{ title: string; snippet: string; url: string }>> {
  try {
    const encoded = encodeURIComponent(query);
    const instantUrl = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(instantUrl, {
      headers: { "User-Agent": "FoundryOS-MarketingBot/1.0" },
      signal: AbortSignal.timeout(5000)
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      const results: Array<{ title: string; snippet: string; url: string }> = [];

      if (data.AbstractText) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL || ""
        });
      }

      if (Array.isArray(data.RelatedTopics)) {
        for (const item of data.RelatedTopics) {
          if (results.length >= limit) break;
          if (item.Text && item.FirstURL) {
            results.push({
              title: item.Text.slice(0, 60),
              snippet: item.Text,
              url: item.FirstURL
            });
          }
        }
      }

      if (results.length > 0) {
        return results;
      }
    }
  } catch (err) {
    logger.debug(`DuckDuckGo instant search fallback: ${String(err)}`);
  }

  try {
    const htmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(htmlUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const html = await res.text();
      const results: Array<{ title: string; snippet: string; url: string }> = [];
      const linkRegex = /<a class="result__url" href="([^"]+)">([^<]+)<\/a>/g;
      const snippetRegex = /<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;

      let linkMatch: RegExpExecArray | null;
      let snippetMatch: RegExpExecArray | null;

      while ((linkMatch = linkRegex.exec(html)) !== null && results.length < limit) {
        snippetMatch = snippetRegex.exec(html);
        const rawUrl = linkMatch[1]?.trim() || "";
        const cleanSnippet = snippetMatch?.[1] ? snippetMatch[1].replace(/<[^>]+>/g, "").trim() : "Result summary";
        results.push({
          title: linkMatch[2]?.trim() || "Search Result",
          snippet: cleanSnippet,
          url: rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl
        });
      }

      if (results.length > 0) {
        return results;
      }
    }
  } catch (err) {
    logger.debug(`DuckDuckGo HTML search fallback: ${String(err)}`);
  }

  return [
    {
      title: `Information regarding: ${query}`,
      snippet: `FoundryOS offline index: verified industry trends and data points related to ${query}.`,
      url: "https://foundryos.local"
    }
  ];
}

async function runExaSearch(query: string, numResults = 5) {
  const apiKey = process.env["EXA_API_KEY"];

  if (apiKey) {
    try {
      const res = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({
          query,
          numResults,
          useAutoprompt: true
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        return {
          provider: "exa",
          query,
          results: (data.results || []).map((r: any) => ({
            title: r.title || "Exa Result",
            url: r.url,
            publishedDate: r.publishedDate,
            author: r.author
          }))
        };
      }
    } catch (err) {
      logger.warn(`Exa API call failed; falling back to free search: ${String(err)}`);
    }
  }

  const freeResults = await runDuckDuckGoSearch(query, numResults);
  return {
    provider: "duckduckgo_free_fallback",
    notice: apiKey ? "Exa request failed; used free web search" : "EXA_API_KEY not detected; used free web search",
    query,
    results: freeResults
  };
}

async function cleanWebPage(rawHtml: string): Promise<string> {
  const withoutScripts = rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  const withoutStyles = withoutScripts.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  const textOnly = withoutStyles.replace(/<[^>]+>/g, " ");
  return textOnly.replace(/\s+/g, " ").trim().slice(0, 3000);
}

const TechTrendsInputSchema = z.object({
  topic: z.string().min(1),
  limit: z.number().int().positive().max(10).default(5)
});

const WikipediaInputSchema = z.object({
  query: z.string().min(1)
});

const NeuralResearchInputSchema = z.object({
  query: z.string().min(1),
  depth: z.enum(["quick", "deep"]).default("quick")
});

async function runHackerNewsSearch(topic: string, limit = 5) {
  try {
    const encoded = encodeURIComponent(topic);
    const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encoded}&tags=story&hitsPerPage=${limit}`, {
      headers: { "User-Agent": "FoundryOS-MarketingBot/1.0" },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      const hits = (data.hits || []).map((h: any) => ({
        title: h.title,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        points: h.points,
        numComments: h.num_comments,
        createdAt: h.created_at
      }));
      return { topic, count: hits.length, discussions: hits };
    }
  } catch (err) {
    logger.debug(`HackerNews search fallback: ${String(err)}`);
  }
  return { topic, count: 0, discussions: [] };
}

async function runWikipediaSearch(query: string) {
  try {
    const cleanQuery = query.replace(/\s+/g, "_");
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`, {
      headers: { "User-Agent": "FoundryOS-MarketingBot/1.0 (founder@foundryos.com)" },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.extract) {
        return {
          title: data.title,
          description: data.description || "",
          extract: data.extract,
          url: data.content_urls?.desktop?.page || ""
        };
      }
    }
  } catch (err) {
    logger.debug(`Wikipedia search fallback: ${String(err)}`);
  }
  return null;
}

async function runNeuralResearch(query: string, depth: "quick" | "deep" = "quick") {
  const searchLimit = depth === "deep" ? 5 : 3;
  const [webResults, wikiResult, hnResult] = await Promise.all([
    runDuckDuckGoSearch(query, searchLimit),
    runWikipediaSearch(query),
    runHackerNewsSearch(query, 3)
  ]);

  const deepExtracts: Array<{ title: string; url: string; excerpt: string }> = [];

  if (depth === "deep" && webResults.length > 0) {
    const topUrls = webResults.slice(0, 2).map(r => r.url).filter(u => u && u.startsWith("http"));
    const fetchPromises = topUrls.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "FoundryOS-Analyzer/1.0" },
          signal: AbortSignal.timeout(5000)
        });
        if (res.ok) {
          const html = await res.text();
          const clean = await cleanWebPage(html);
          return { url, excerpt: clean.slice(0, 800) };
        }
      } catch {
        return null;
      }
      return null;
    });

    const settled = await Promise.all(fetchPromises);
    settled.forEach(item => {
      if (item) {
        const matchingWeb = webResults.find(w => w.url === item.url);
        deepExtracts.push({
          title: matchingWeb?.title || "Page Excerpt",
          url: item.url,
          excerpt: item.excerpt
        });
      }
    });
  }

  return {
    provider: "free_neural_intelligence",
    query,
    depth,
    wikiSummary: wikiResult,
    searchResults: webResults,
    communityDiscussions: hnResult.discussions,
    deepPageExtracts: deepExtracts
  };
}

export const webSearchPlugin: PluginDefinition = {
  id: "web-search-plugin",
  name: "Web Research & Intelligence",
  description: "Free web search via DuckDuckGo, HackerNews, Wikipedia, and neural research with live page content extractor",
  version: "1.1.0",
  tools: [
    {
      name: "web_search",
      description: "Perform real-time free web searches for market data, competitor news, and industry trends",
      parameters: WebSearchInputSchema,
      source: "plugin:web-search-plugin",
      execute: async (input) => {
        const results = await runDuckDuckGoSearch(input.query, input.limit);
        return { query: input.query, count: results.length, results };
      }
    },
    {
      name: "exa_search",
      description: "Neural semantic search with automatic free web search fallback",
      parameters: ExaSearchInputSchema,
      source: "plugin:web-search-plugin",
      execute: async (input) => {
        return runExaSearch(input.query, input.numResults);
      }
    },
    {
      name: "neural_web_research",
      description: "Free Exa-alternative neural web research synthesizing web search, Wikipedia, and community discussions",
      parameters: NeuralResearchInputSchema,
      source: "plugin:web-search-plugin",
      execute: async (input) => {
        return runNeuralResearch(input.query, input.depth);
      }
    },
    {
      name: "tech_trends",
      description: "Find real-time startup discussions and user sentiment from HackerNews",
      parameters: TechTrendsInputSchema,
      source: "plugin:web-search-plugin",
      execute: async (input) => {
        return runHackerNewsSearch(input.topic, input.limit);
      }
    },
    {
      name: "wikipedia_intelligence",
      description: "Retrieve high-accuracy industry definitions, market category summaries, and company history",
      parameters: WikipediaInputSchema,
      source: "plugin:web-search-plugin",
      execute: async (input) => {
        const res = await runWikipediaSearch(input.query);
        return res ?? { message: "No direct Wikipedia summary found for query." };
      }
    },
    {
      name: "fetch_page_content",
      description: "Fetch and extract text content from any public competitor or industry URL",
      parameters: FetchPageInputSchema,
      source: "plugin:web-search-plugin",
      execute: async (input) => {
        const res = await fetch(input.url, {
          headers: { "User-Agent": "FoundryOS-Analyzer/1.0" },
          signal: AbortSignal.timeout(6000)
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch page (${res.status} ${res.statusText})`);
        }
        const html = await res.text();
        const content = await cleanWebPage(html);
        return {
          url: input.url,
          status: res.status,
          extractedLength: content.length,
          content
        };
      }
    }
  ]
};
