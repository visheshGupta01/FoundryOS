import { env } from "../backend/config/env.js";
import { logger } from "../backend/shared/logger.js";

export class EmbeddingService {
  private static instance: EmbeddingService;
  private readonly dimension = 128;

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA.length || !vecB.length || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i]! * vecB[i]!;
      normA += vecA[i]! * vecA[i]!;
      normB += vecB[i]! * vecB[i]!;
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return new Array(this.dimension).fill(0);
    }

    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.startsWith("sk-")) {
      try {
        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            input: text.slice(0, 4000),
            model: "text-embedding-3-small"
          })
        });

        if (response.ok) {
          const json = (await response.json()) as any;
          const vector = json?.data?.[0]?.embedding;
          if (Array.isArray(vector) && vector.length > 0) {
            return this.normalizeVector(vector);
          }
        }
      } catch (err) {
        logger.debug("OpenAI embedding skipped, falling back to local semantic encoder", { error: String(err) });
      }
    }

    return this.generateSemanticFeatureVector(text);
  }

  private generateSemanticFeatureVector(text: string): number[] {
    const vector = new Array(this.dimension).fill(0);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const words = cleaned.split(/\s+/).filter((w) => w.length > 1);

    if (words.length === 0) return vector;

    for (let i = 0; i < words.length; i++) {
      const word = words[i]!;
      const hash1 = this.hashString(word);
      const idx1 = Math.abs(hash1) % this.dimension;
      const weight = 1.0 + Math.min(word.length / 5, 1.5);
      vector[idx1] += weight;

      if (i < words.length - 1) {
        const bigram = `${word}_${words[i + 1]}`;
        const hash2 = this.hashString(bigram);
        const idx2 = Math.abs(hash2) % this.dimension;
        vector[idx2] += weight * 1.5;
      }
    }

    return this.normalizeVector(vector);
  }

  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  private normalizeVector(vec: number[]): number[] {
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vec;
    return vec.map((val) => val / norm);
  }
}

export const embeddingService = EmbeddingService.getInstance();
