import * as fs from "fs";
import * as path from "path";
import { embeddingService } from "./embedding.service";
import { logger } from "../utils/logger";

export interface KnowledgeChunk {
  id: string;
  content: string;
  url: string;
  title: string;
  source: "website" | "curated";
  priority: number;
  embedding?: number[];
}

export interface KnowledgeBase {
  chunks: KnowledgeChunk[];
  lastUpdated: string;
}

export class KnowledgeService {
  private knowledgeBase: KnowledgeBase | null = null;
  private dataDir = path.join(process.cwd(), "data");

  constructor() {
    this.loadKnowledgeBase();
  }

  /**
   * Load knowledge base from JSON files in data directory
   */
  private loadKnowledgeBase(): void {
    const allChunks: KnowledgeChunk[] = [];

    // Load scraped website data
    try {
      const websiteFile = path.join(this.dataDir, "knowledge-base.json");
      if (fs.existsSync(websiteFile)) {
        const content = fs.readFileSync(websiteFile, "utf-8");
        const websiteData: KnowledgeBase = JSON.parse(content);
        
        if (websiteData.chunks && websiteData.chunks.length > 0) {
          const websiteChunks = websiteData.chunks.map((chunk) => ({
            ...chunk,
            source: "website" as const,
            priority: 1,
          }));
          allChunks.push(...websiteChunks);
          logger.info(`Loaded ${websiteChunks.length} chunks from website knowledge base`);
        }
      }
    } catch (error) {
      logger.warn("Failed to load website knowledge base", { error });
    }

    // Load curated data
    try {
      const curatedFile = path.join(this.dataDir, "metalogicsRAG-base.json");
      if (fs.existsSync(curatedFile)) {
        const content = fs.readFileSync(curatedFile, "utf-8");
        const curatedData: KnowledgeBase = JSON.parse(content);
        
        if (curatedData.chunks && curatedData.chunks.length > 0) {
          const curatedChunks = curatedData.chunks.map((chunk) => ({
            ...chunk,
            source: "curated" as const,
            priority: 2,
          }));
          allChunks.push(...curatedChunks);
          logger.info(`Loaded ${curatedChunks.length} chunks from curated knowledge base`);
        }
      }
    } catch (error) {
      logger.warn("Failed to load curated knowledge base", { error });
    }

    if (allChunks.length > 0) {
      this.knowledgeBase = {
        chunks: allChunks,
        lastUpdated: new Date().toISOString(),
      };
      logger.info(`Knowledge base loaded with ${allChunks.length} total chunks`);
    } else {
      logger.warn("No knowledge base chunks loaded. RAG will be disabled.");
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
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
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedWord}\\b`, "gi");
      const matches = (contentLower.match(regex) || []).length;
      
      const weight = Math.min(word.length / 10, 1);
      matchCount += matches * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.min(matchCount / totalWeight, 1) : 0;
  }

  /**
   * Enhanced retrieval with hybrid search
   */
  async retrieveRelevantContext(query: string, topK: number = 3): Promise<string> {
    if (!this.knowledgeBase || this.knowledgeBase.chunks.length === 0) {
      return "";
    }

    logger.debug("Retrieving context for query", { query });

    // Get query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    let scoredChunks: Array<{
      chunk: KnowledgeChunk;
      score: number;
    }>;

    if (queryEmbedding) {
      scoredChunks = this.knowledgeBase.chunks
        .map((chunk) => {
          let semanticScore = 0;
          let keywordScore = 0;

          if (chunk.embedding && chunk.embedding.length > 0) {
            semanticScore = this.cosineSimilarity(queryEmbedding, chunk.embedding);
          }

          keywordScore = this.calculateKeywordScore(query, chunk.content);

          const priorityMultiplier = chunk.priority || 1;
          // Weighted score: 70% semantic, 30% keyword
          const combinedScore = (semanticScore * 0.7 + keywordScore * 0.3) * priorityMultiplier;

          return { chunk, score: combinedScore };
        })
        .filter(({ score }) => score > 0.15) // Slightly higher threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    } else {
      // Fallback to keyword search
      logger.info("Fallback to keyword search (no query embedding)");
      scoredChunks = this.knowledgeBase.chunks
        .map((chunk) => {
          const keywordScore = this.calculateKeywordScore(query, chunk.content);
          return {
            chunk,
            score: keywordScore * (chunk.priority || 1),
          };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    }

    if (scoredChunks.length === 0) {
      return "";
    }

    const context = scoredChunks
      .map(({ chunk, score }) => {
        const sourceLabel = chunk.source === "curated" ? "OFFICIAL" : "WEBSITE";
        return `[Source: ${sourceLabel} | Title: ${chunk.title}]\n${chunk.content}`;
      })
      .join("\n\n---\n\n");

    logger.info("Context retrieved", { chunksFound: scoredChunks.length });
    return context;
  }
}

export const knowledgeService = new KnowledgeService();
