/**
 * Test script to verify knowledge base functionality
 */

import * as fs from "fs";
import * as path from "path";

const KNOWLEDGE_BASE_PATH = path.join(
  process.cwd(),
  "public",
  "knowledge-base.json"
);

console.log("🔍 Testing Knowledge Base...\n");

// Check if knowledge base exists
if (!fs.existsSync(KNOWLEDGE_BASE_PATH)) {
  console.error("❌ Knowledge base not found!");
  console.log("📝 Run: npm run build:knowledge");
  process.exit(1);
}

// Load and validate knowledge base
try {
  const data = fs.readFileSync(KNOWLEDGE_BASE_PATH, "utf-8");
  const knowledgeBase = JSON.parse(data);

  console.log("✅ Knowledge base loaded successfully!\n");
  console.log("📊 Statistics:");
  console.log(`   - Total chunks: ${knowledgeBase.chunks.length}`);
  console.log(`   - Last updated: ${knowledgeBase.lastUpdated}`);

  const chunksWithEmbeddings = knowledgeBase.chunks.filter(
    (c: any) => c.embedding && c.embedding.length > 0
  );
  console.log(`   - Chunks with embeddings: ${chunksWithEmbeddings.length}`);

  if (chunksWithEmbeddings.length > 0) {
    console.log(
      `   - Embedding dimensions: ${chunksWithEmbeddings[0].embedding.length}`
    );
  }

  console.log("\n📄 Sample chunks:");
  knowledgeBase.chunks.slice(0, 3).forEach((chunk: any, i: number) => {
    console.log(`\n   ${i + 1}. ${chunk.title}`);
    console.log(`      URL: ${chunk.url}`);
    console.log(`      Content: ${chunk.content.substring(0, 100)}...`);
    console.log(`      Has embedding: ${chunk.embedding ? "Yes" : "No"}`);
  });

  console.log("\n✅ Knowledge base is ready to use!");
  console.log("💡 Start the dev server: npm run dev");
} catch (error) {
  console.error("❌ Error loading knowledge base:", error);
  process.exit(1);
}
