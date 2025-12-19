/**
 * Build Curated Knowledge Base from metalogicsRAG markdown files
 * Processes structured markdown files and generates embeddings
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Import embedding service
import { embeddingService } from "../services/embeddingService.js";

interface KnowledgeChunk {
  id: string;
  content: string;
  url: string;
  title: string;
  source: "curated";
  priority: number;
  embedding?: number[];
}

const METALOGICS_RAG_DIR = path.join(process.cwd(), "metalogicsRAG");
const OUTPUT_FILE = path.join(
  process.cwd(),
  "public",
  "metalogicsRAG-base.json"
);

// Check API key
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(
    "⚠️  Warning: API_KEY not set - embeddings will not be generated"
  );
  console.log("   The system will still work with keyword-based search\n");
}

/**
 * Read and parse markdown files from metalogicsRAG directory
 */
function readMarkdownFiles(): Array<{
  filename: string;
  content: string;
  title: string;
}> {
  const files: Array<{ filename: string; content: string; title: string }> = [];

  if (!fs.existsSync(METALOGICS_RAG_DIR)) {
    console.error(
      `Error: metalogicsRAG directory not found at ${METALOGICS_RAG_DIR}`
    );
    return files;
  }

  const markdownFiles = fs
    .readdirSync(METALOGICS_RAG_DIR)
    .filter((f) => f.endsWith(".md"));

  console.log(
    `Found ${markdownFiles.length} markdown files in metalogicsRAG/\n`
  );

  for (const filename of markdownFiles) {
    const filePath = path.join(METALOGICS_RAG_DIR, filename);
    const content = fs.readFileSync(filePath, "utf-8");

    // Extract title from filename or first heading
    let title = filename.replace(".md", "").replace(/_/g, " ");
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      title = headingMatch[1];
    }

    files.push({ filename, content, title });
    console.log(`✓ Read: ${filename} (${content.length} chars)`);
  }

  return files;
}

/**
 * Split markdown content into semantic chunks
 */
function chunkMarkdownContent(
  file: { filename: string; content: string; title: string },
  maxChunkSize: number = 1200
): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];

  // Split by sections (## headings) first
  const sections = file.content.split(/(?=^##\s)/m);

  let chunkIndex = 0;

  for (const section of sections) {
    const trimmedSection = section.trim();
    if (!trimmedSection || trimmedSection.length < 50) continue;

    // If section is small enough, keep it as one chunk
    if (trimmedSection.length <= maxChunkSize) {
      chunks.push({
        id: `curated-${file.filename}-${chunkIndex}`,
        content: trimmedSection,
        url: `metalogicsRAG/${file.filename}`,
        title: file.title,
        source: "curated",
        priority: 2, // Higher priority for curated content
      });
      chunkIndex++;
    } else {
      // Split large sections by paragraphs
      const paragraphs = trimmedSection.split(/\n\n+/);
      let currentChunk = "";

      for (const para of paragraphs) {
        if (
          currentChunk.length + para.length > maxChunkSize &&
          currentChunk.length > 0
        ) {
          chunks.push({
            id: `curated-${file.filename}-${chunkIndex}`,
            content: currentChunk.trim(),
            url: `metalogicsRAG/${file.filename}`,
            title: file.title,
            source: "curated",
            priority: 2,
          });
          currentChunk = para;
          chunkIndex++;
        } else {
          currentChunk += (currentChunk ? "\n\n" : "") + para;
        }
      }

      // Add remaining content
      if (currentChunk.trim()) {
        chunks.push({
          id: `curated-${file.filename}-${chunkIndex}`,
          content: currentChunk.trim(),
          url: `metalogicsRAG/${file.filename}`,
          title: file.title,
          source: "curated",
          priority: 2,
        });
        chunkIndex++;
      }
    }
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
      console.log(
        `Processing chunk ${i + 1}/${chunks.length} - ${chunk.title}`
      );

      // Use the new embedding service with REST API
      const embedding = await embeddingService.generateEmbedding(
        chunk.content.substring(0, 2000)
      );

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
 * Main build function
 */
async function buildCuratedKnowledge() {
  console.log("🚀 Building Curated Knowledge Base from metalogicsRAG/\n");
  console.log("=".repeat(60) + "\n");

  // Read markdown files
  const markdownFiles = readMarkdownFiles();

  if (markdownFiles.length === 0) {
    console.error("No markdown files found. Exiting.");
    process.exit(1);
  }

  console.log(`\n${"=".repeat(60)}\n`);

  // Create chunks from all files
  const allChunks: KnowledgeChunk[] = [];
  for (const file of markdownFiles) {
    const chunks = chunkMarkdownContent(file);
    allChunks.push(...chunks);
    console.log(`✓ Created ${chunks.length} chunks from ${file.filename}`);
  }

  console.log(`\n📊 Total chunks created: ${allChunks.length}\n`);
  console.log("=".repeat(60));

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

  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n✅ Curated knowledge base created successfully!`);
  console.log(`📁 Saved to: ${OUTPUT_FILE}`);
  console.log(`📊 Total chunks: ${chunksWithEmbeddings.length}`);
  console.log(
    `📊 Chunks with embeddings: ${
      chunksWithEmbeddings.filter((c) => c.embedding).length
    }`
  );
  console.log(`📊 Source files: ${markdownFiles.length}`);
  console.log(`\n${"=".repeat(60)}\n`);
}

// Run builder
buildCuratedKnowledge().catch(console.error);
