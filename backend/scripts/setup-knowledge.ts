import * as fs from "fs";
import * as path from "path";

async function setupKnowledge() {
  console.log("🚀 Setting up Knowledge Base for Backend...");

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("Included 'data' directory.");
  }

  // Paths to look for knowledge files (adjust if frontend is in a different relative path)
  const frontendPublicDir = path.resolve(process.cwd(), "../frontend/public");
  
  const filesToCopy = [
    "knowledge-base.json",
    "metalogicsRAG-base.json"
  ];

  let copiedCount = 0;

  for (const file of filesToCopy) {
    const sourcePath = path.join(frontendPublicDir, file);
    const destPath = path.join(dataDir, file);

    if (fs.existsSync(sourcePath)) {
      console.log(`Copying ${file} from frontend...`);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied: ${file}`);
      copiedCount++;
    } else {
      console.warn(`⚠️  Source file not found: ${sourcePath}`);
    }
  }

  // Create placeholder if no files exist/copied
  const filesInData = fs.readdirSync(dataDir).filter(f => f.endsWith(".json"));
  if (filesInData.length === 0) {
    console.log("ℹ️  No knowledge base files found. Creating placeholder...");
    const placeholder = {
      chunks: [
        {
          id: "placeholder-1",
          content: "Metalogics is an AI consultancy firm. This is a placeholder knowledge base. Please run the knowledge build script in frontend to populate real data.",
          url: "https://metalogics.io",
          title: "Placeholder",
          source: "system",
          priority: 1
        }
      ],
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(dataDir, "knowledge-base.json"), 
      JSON.stringify(placeholder, null, 2)
    );
    console.log("✅ Created placeholder knowledge-base.json");
  } else {
    console.log(`✅ Knowledge base ready with ${copiedCount} files copied (or existing).`);
  }
}

setupKnowledge().catch(console.error);
