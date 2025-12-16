/**
 * Embedding Service - Direct REST API implementation
 * Uses Google Gemini API for generating text embeddings
 */

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

class EmbeddingService {
  private apiKey: string | null = null;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  private model = "text-embedding-004";
  private cache: Map<string, number[]> = new Map();
  private initialized = false;

  constructor() {
    // Don't initialize API key in constructor - do it lazily
  }

  /**
   * Initialize API key (lazy loading)
   */
  private initializeApiKey(): void {
    if (this.initialized) return;

    this.apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || null;
    this.initialized = true;

    if (!this.apiKey) {
      console.warn("⚠️  Embedding API key not configured");
    }
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    // Initialize API key on first use
    this.initializeApiKey();

    if (!this.apiKey) {
      return null;
    }

    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const url = `${this.baseUrl}/models/${this.model}:embedContent?key=${this.apiKey}`;

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
        const error = await response.text();
        console.error(
          `Embedding API error: ${response.status}`,
          error.substring(0, 200)
        );
        return null;
      }

      const result = await response.json();

      if (result.embedding && result.embedding.values) {
        const embedding = result.embedding.values;

        // Cache the result
        this.cache.set(cacheKey, embedding);

        return embedding;
      } else {
        console.error("Unexpected embedding response format");
        return null;
      }
    } catch (error) {
      console.error("Error generating embedding:", error);
      return null;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddingsBatch(
    texts: string[]
  ): Promise<Array<number[] | null>> {
    // Initialize API key on first use
    this.initializeApiKey();

    if (!this.apiKey) {
      return texts.map(() => null);
    }

    const results: Array<number[] | null> = [];

    // Process in batches of 100 (API limit)
    const batchSize = 100;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      try {
        const url = `${this.baseUrl}/models/${this.model}:batchEmbedContents?key=${this.apiKey}`;

        const requests = batch.map((text) => ({
          model: `models/${this.model}`,
          content: {
            parts: [{ text }],
          },
        }));

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requests }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(
            `Batch embedding API error: ${response.status}`,
            error.substring(0, 200)
          );
          // Add nulls for failed batch
          results.push(...batch.map(() => null));
          continue;
        }

        const result = await response.json();

        if (result.embeddings && Array.isArray(result.embeddings)) {
          for (let j = 0; j < batch.length; j++) {
            const embedding = result.embeddings[j]?.values || null;
            results.push(embedding);

            // Cache successful embeddings
            if (embedding) {
              const cacheKey = batch[j].toLowerCase().trim();
              this.cache.set(cacheKey, embedding);
            }
          }
        } else {
          console.error("Unexpected batch embedding response format");
          results.push(...batch.map(() => null));
        }
      } catch (error) {
        console.error("Error generating batch embeddings:", error);
        results.push(...batch.map(() => null));
      }

      // Rate limiting between batches
      if (i + batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      configured: this.apiKey !== null,
    };
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();
