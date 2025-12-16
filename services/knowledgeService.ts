/**
 * Enhanced Knowledge Service - Dual-Source RAG Implementation
 * Combines website scraping + curated metalogicsRAG markdown files
 */

import { embeddingService } from "./embeddingService";

export interface KnowledgeChunk {
  id: string;
  content: string;
  url: string;
  title: string;
  source: "website" | "curated"; // Track source type
  priority: number; // Higher priority for curated content
  embedding?: number[];
}

export interface KnowledgeBase {
  chunks: KnowledgeChunk[];
  lastUpdated: string;
}

class KnowledgeService {
  private knowledgeBase: KnowledgeBase | null = null;

  constructor() {
    this.loadKnowledgeBase();
  }

  /**
   * Load knowledge base from both sources:
   * 1. Scraped website data (knowledge-base.json)
   * 2. Curated markdown files (metalogicsRAG-base.json)
   */
  private async loadKnowledgeBase(): Promise<void> {
    const allChunks: KnowledgeChunk[] = [];

    // Load scraped website data
    try {
      const response = await fetch("/knowledge-base.json");
      if (response.ok) {
        const websiteData: KnowledgeBase = await response.json();
        if (websiteData.chunks && websiteData.chunks.length > 0) {
          const websiteChunks = websiteData.chunks.map((chunk) => ({
            ...chunk,
            source: "website" as const,
            priority: 1, // Lower priority for scraped content
          }));
          allChunks.push(...websiteChunks);
          console.log(
            `✓ Loaded ${websiteChunks.length} chunks from website scraping`
          );
        } else {
          console.log(
            "ℹ️ Website knowledge base is empty (run: npm run build:knowledge)"
          );
        }
      }
    } catch (error) {
      console.log("ℹ️ Website knowledge base not found (optional)");
    }

    // Load curated metalogicsRAG data
    try {
      const response = await fetch("/metalogicsRAG-base.json");
      if (response.ok) {
        const curatedData: KnowledgeBase = await response.json();
        if (curatedData.chunks && curatedData.chunks.length > 0) {
          const curatedChunks = curatedData.chunks.map((chunk) => ({
            ...chunk,
            source: "curated" as const,
            priority: 2, // Higher priority for curated content
          }));
          allChunks.push(...curatedChunks);
          console.log(
            `✅ Loaded ${curatedChunks.length} chunks from curated knowledge base`
          );
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ Curated knowledge base not found (run: npm run build:curated)"
      );
    }

    if (allChunks.length > 0) {
      this.knowledgeBase = {
        chunks: allChunks,
        lastUpdated: new Date().toISOString(),
      };
      console.log(
        `📚 Total knowledge base: ${allChunks.length} chunks from ${
          new Set(allChunks.map((c) => c.source)).size
        } sources`
      );
    } else {
      console.warn(
        "⚠️ No knowledge base loaded, chatbot will have limited knowledge"
      );
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Get embedding for a query using the embedding service
   */
  private async getEmbedding(text: string): Promise<number[] | null> {
    return await embeddingService.generateEmbedding(text);
  }

  /**
   * Enhanced retrieval with hybrid search (semantic + keyword + priority)
   */
  async retrieveRelevantContext(
    query: string,
    topK: number = 5
  ): Promise<string> {
    if (!this.knowledgeBase || this.knowledgeBase.chunks.length === 0) {
      return "";
    }

    // Get query embedding
    const queryEmbedding = await this.getEmbedding(query);

    let scoredChunks: Array<{
      chunk: KnowledgeChunk;
      score: number;
      matchType: string;
    }>;

    if (queryEmbedding) {
      // Hybrid search: semantic + keyword + priority
      scoredChunks = this.knowledgeBase.chunks
        .map((chunk) => {
          let semanticScore = 0;
          let keywordScore = 0;

          // Semantic similarity (if embedding exists)
          if (chunk.embedding && chunk.embedding.length > 0) {
            semanticScore = this.cosineSimilarity(
              queryEmbedding,
              chunk.embedding
            );
          }

          // Keyword matching score
          keywordScore = this.calculateKeywordScore(query, chunk.content);

          // Combined score with priority boost
          // Curated content gets 1.5x boost, semantic gets 70% weight, keyword gets 30%
          const priorityMultiplier = chunk.priority || 1;
          const combinedScore =
            (semanticScore * 0.7 + keywordScore * 0.3) * priorityMultiplier;

          return {
            chunk,
            score: combinedScore,
            matchType: semanticScore > 0.5 ? "semantic" : "keyword",
          };
        })
        .filter(({ score }) => score > 0.1) // Filter low-relevance results
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } else {
      // Fallback to keyword search only
      scoredChunks = this.keywordSearchWithScores(query, topK);
    }

    // Format context with source attribution
    if (scoredChunks.length === 0) {
      return "";
    }

    const context = scoredChunks
      .map(({ chunk, score, matchType }, index) => {
        const sourceLabel =
          chunk.source === "curated" ? "📌 Official" : "🌐 Website";
        return `[${sourceLabel} | ${chunk.title}]\n${
          chunk.content
        }\n(Relevance: ${(score * 100).toFixed(0)}% | ${matchType})`;
      })
      .join("\n\n---\n\n");

    return context;
  }

  /**
   * Calculate keyword matching score
   */
  private calculateKeywordScore(query: string, content: string): number {
    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const contentLower = content.toLowerCase();

    if (queryWords.length === 0) return 0;

    let matchCount = 0;
    let totalWeight = 0;

    queryWords.forEach((word) => {
      // Escape special regex characters
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedWord}\\b`, "gi");
      const matches = (contentLower.match(regex) || []).length;

      // Weight longer words more heavily
      const weight = Math.min(word.length / 10, 1);
      matchCount += matches * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.min(matchCount / totalWeight, 1) : 0;
  }

  /**
   * Keyword-based search with scores (fallback method)
   */
  private keywordSearchWithScores(
    query: string,
    topK: number
  ): Array<{ chunk: KnowledgeChunk; score: number; matchType: string }> {
    if (!this.knowledgeBase) return [];

    const scoredChunks = this.knowledgeBase.chunks
      .map((chunk) => {
        const keywordScore = this.calculateKeywordScore(query, chunk.content);
        const priorityMultiplier = chunk.priority || 1;

        return {
          chunk,
          score: keywordScore * priorityMultiplier,
          matchType: "keyword" as const,
        };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scoredChunks;
  }

  /**
   * Check if knowledge base is loaded
   */
  isLoaded(): boolean {
    return this.knowledgeBase !== null && this.knowledgeBase.chunks.length > 0;
  }

  /**
   * Get knowledge base stats
   */
  getStats() {
    return {
      loaded: this.isLoaded(),
      chunks: this.knowledgeBase?.chunks.length || 0,
      lastUpdated: this.knowledgeBase?.lastUpdated || "Never",
    };
  }
}

// Singleton instance
export const knowledgeService = new KnowledgeService();
