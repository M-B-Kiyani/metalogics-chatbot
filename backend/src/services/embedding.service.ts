import { config } from "../config";
import { logger } from "../utils/logger";
import fetch from "node-fetch"; // Assuming node-fetch is available or I should use native fetch in Node 18+

// Node 18+ has native fetch, so we might not need import.
// If it fails, I'll switch to axios (which is in package.json)

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

export class EmbeddingService {
  private apiKey: string | null = null;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  private model = "text-embedding-004";
  private cache: Map<string, number[]> = new Map();

  constructor() {
    this.apiKey = config.gemini.apiKey || null;
    if (!this.apiKey) {
      logger.warn("Embedding API key not configured");
    }
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.apiKey) {
      logger.warn("Cannot generate embedding: No API Key");
      return null;
    }

    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const url = `${this.baseUrl}/models/${this.model}:embedContent?key=${this.apiKey}`;

      // Use native fetch (Node 18+)
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }],
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Embedding API error: ${response.status}`, {
          error: errorText,
        });
        return null;
      }

      const result = (await response.json()) as any;

      if (result.embedding && result.embedding.values) {
        const embedding = result.embedding.values;
        // Cache the result
        this.cache.set(cacheKey, embedding);
        return embedding;
      } else {
        logger.error("Unexpected embedding response format", { result });
        return null;
      }
    } catch (error) {
      logger.error("Error generating embedding", { error });
      return null;
    }
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const embeddingService = new EmbeddingService();
