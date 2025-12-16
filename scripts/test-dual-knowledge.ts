/**
 * Test script to verify dual-source knowledge base functionality
 */

import * as fs from "fs";
import * as path from "path";

const WEBSITE_KB_PATH = path.join(
  process.cwd(),
  "public",
  "knowledge-base.json"
);
const CURATED_KB_PATH = path.join(
  process.cwd(),
  "public",
  "metalogicsRAG-base.json"
);

console.log("🔍 Testing Dual-Source Knowledge Base System\n");
console.log("=".repeat(70) + "\n");

let totalChunks = 0;
let totalWithEmbeddings = 0;
let sources: string[] = [];

// Check website knowledge base
console.log("📊 Source 1: Website Scraping (knowledge-base.json)");
if (!fs.existsSync(WEBSITE_KB_PATH)) {
  console.log("   ❌ Not found - Run: npm run build:knowledge\n");
} else {
  try {
    const data = fs.readFileSync(WEBSITE_KB_PATH, "utf-8");
    const kb = JSON.parse(data);
    const withEmbeddings = kb.chunks.filter(
      (c: any) => c.embedding?.length > 0
    ).length;

    console.log(`   ✅ Loaded successfully`);
    console.log(`   📦 Chunks: ${kb.chunks.length}`);
    console.log(`   🧠 With embeddings: ${withEmbeddings}`);
    console.log(`   📅 Last updated: ${kb.lastUpdated}\n`);

    totalChunks += kb.chunks.length;
    totalWithEmbeddings += withEmbeddings;
    sources.push("website");
  } catch (error) {
    console.log(`   ❌ Error loading: ${error}\n`);
  }
}

// Check curated knowledge base
console.log("📊 Source 2: Curated Content (metalogicsRAG-base.json)");
if (!fs.existsSync(CURATED_KB_PATH)) {
  console.log("   ❌ Not found - Run: npm run build:curated\n");
} else {
  try {
    const data = fs.readFileSync(CURATED_KB_PATH, "utf-8");
    const kb = JSON.parse(data);
    const withEmbeddings = kb.chunks.filter(
      (c: any) => c.embedding?.length > 0
    ).length;

    console.log(`   ✅ Loaded successfully`);
    console.log(`   📦 Chunks: ${kb.chunks.length}`);
    console.log(`   🧠 With embeddings: ${withEmbeddings}`);
    console.log(`   📅 Last updated: ${kb.lastUpdated}\n`);

    totalChunks += kb.chunks.length;
    totalWithEmbeddings += withEmbeddings;
    sources.push("curated");
  } catch (error) {
    console.log(`   ❌ Error loading: ${error}\n`);
  }
}

console.log("=".repeat(70));
console.log("\n📈 Combined Statistics:");
console.log(`   Total sources: ${sources.length}/2`);
console.log(`   Total chunks: ${totalChunks}`);
console.log(`   Total with embeddings: ${totalWithEmbeddings}`);
console.log(
  `   Coverage: ${
    totalChunks > 0 ? ((totalWithEmbeddings / totalChunks) * 100).toFixed(1) : 0
  }%\n`
);

if (sources.length === 0) {
  console.log("❌ No knowledge bases found!");
  console.log("\n📝 Build both sources:");
  console.log("   npm run build:knowledge:all");
  console.log("\nOr build separately:");
  console.log("   npm run build:knowledge  (website scraping)");
  console.log("   npm run build:curated    (metalogicsRAG files)");
  process.exit(1);
} else if (sources.length === 1) {
  console.log("⚠️  Only 1 knowledge source found!");
  console.log(
    `   Missing: ${sources.includes("website") ? "curated" : "website"}`
  );
  console.log("\n📝 Build missing source:");
  console.log(
    `   npm run build:${sources.includes("website") ? "curated" : "knowledge"}`
  );
} else {
  console.log("✅ Both knowledge sources are ready!");
  console.log("💡 Start the dev server: npm run dev");
}

console.log("\n" + "=".repeat(70) + "\n");
