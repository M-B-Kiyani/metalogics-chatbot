/**
 * Web Scraper for Metalogics.io
 * Extracts content and creates knowledge base with embeddings
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Import embedding service
import { embeddingService } from "../services/embeddingService.js";

interface ScrapedPage {
  url: string;
  title: string;
  content: string;
}

interface KnowledgeChunk {
  id: string;
  content: string;
  url: string;
  title: string;
  embedding?: number[];
}

const METALOGICS_URL = "https://metalogics.io";
const OUTPUT_FILE = path.join(process.cwd(), "public", "knowledge-base.json");

// Check API key
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn(
    "⚠️  Warning: API_KEY not set - embeddings will not be generated"
  );
  console.log("   The system will still work with keyword-based search\n");
}

/**
 * Fetch and parse HTML content from a URL
 */
async function fetchPage(url: string): Promise<ScrapedPage | null> {
  try {
    console.log(`Fetching: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "Metalogics";

    // Remove script and style tags
    let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

    // Extract text content from HTML
    const textContent = cleanHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();

    return {
      url,
      title,
      content: textContent,
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Split content into chunks for better retrieval
 */
function chunkContent(
  page: ScrapedPage,
  maxChunkSize: number = 1000
): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const sentences = page.content.split(/[.!?]+\s+/);

  let currentChunk = "";
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if (
      currentChunk.length + sentence.length > maxChunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push({
        id: `${page.url}-chunk-${chunkIndex}`,
        content: currentChunk.trim(),
        url: page.url,
        title: page.title,
      });
      currentChunk = sentence;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? ". " : "") + sentence;
    }
  }

  // Add remaining content
  if (currentChunk.trim()) {
    chunks.push({
      id: `${page.url}-chunk-${chunkIndex}`,
      content: currentChunk.trim(),
      url: page.url,
      title: page.title,
    });
  }

  return chunks;
}

/**
 * Generate embeddings for chunks using REST API
 */
async function generateEmbeddings(
  chunks: KnowledgeChunk[]
): Promise<KnowledgeChunk[]> {
  console.log(`\nGenerating embeddings for ${chunks.length} chunks...`);

  const chunksWithEmbeddings: KnowledgeChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);

      // Use the new embedding service with REST API
      const embedding = await embeddingService.generateEmbedding(chunk.content);

      if (embedding) {
        chunksWithEmbeddings.push({
          ...chunk,
          embedding,
        });
        console.log(
          `  ✅ Embedding generated (${embedding.length} dimensions)`
        );
      } else {
        // Add chunk without embedding
        chunksWithEmbeddings.push(chunk);
        console.log(`  ⚠️  No embedding (will use keyword search)`);
      }

      // Rate limiting - wait 150ms between requests
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (error) {
      console.error(
        `  ❌ Error generating embedding for chunk ${chunk.id}:`,
        error
      );
      // Add chunk without embedding
      chunksWithEmbeddings.push(chunk);
    }
  }

  return chunksWithEmbeddings;
}

/**
 * Main scraping function
 */
async function scrapeWebsite() {
  console.log("Starting Metalogics.io web scraping...\n");

  // URLs to scrape (add more as needed)
  const urlsToScrape = [
    METALOGICS_URL,
    `${METALOGICS_URL}/about`,
    `${METALOGICS_URL}/services`,
    `${METALOGICS_URL}/solutions`,
    `${METALOGICS_URL}/contact`,
    `${METALOGICS_URL}/blog`,
  ];

  const pages: ScrapedPage[] = [];

  // Fetch all pages
  for (const url of urlsToScrape) {
    const page = await fetchPage(url);
    if (page && page.content.length > 100) {
      pages.push(page);
    }
    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\nScraped ${pages.length} pages successfully\n`);

  // Create chunks
  const allChunks: KnowledgeChunk[] = [];
  for (const page of pages) {
    const chunks = chunkContent(page);
    allChunks.push(...chunks);
  }

  console.log(`Created ${allChunks.length} content chunks\n`);

  // Generate embeddings
  const chunksWithEmbeddings = await generateEmbeddings(allChunks);

  // Create knowledge base
  const knowledgeBase = {
    chunks: chunksWithEmbeddings,
    lastUpdated: new Date().toISOString(),
  };

  // Ensure public directory exists
  const publicDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(knowledgeBase, null, 2));

  console.log(`\n✅ Knowledge base created successfully!`);
  console.log(`📁 Saved to: ${OUTPUT_FILE}`);
  console.log(`📊 Total chunks: ${chunksWithEmbeddings.length}`);
  console.log(
    `📊 Chunks with embeddings: ${
      chunksWithEmbeddings.filter((c) => c.embedding).length
    }`
  );
}

// Run scraper
scrapeWebsite().catch(console.error);
