/**
 * Test Gemini Embedding API using direct REST calls
 */

import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: API_KEY not set");
  process.exit(1);
}

async function testEmbeddingREST() {
  console.log("Testing Gemini Embedding API via REST...\n");

  const testText = "Metalogics offers web development services";
  const model = "text-embedding-004";

  console.log(`Text: "${testText}"`);
  console.log(`Model: ${model}\n`);
  console.log("=".repeat(70) + "\n");

  // Method 1: embedContent endpoint
  try {
    console.log("Method 1: POST to embedContent endpoint");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: {
          parts: [{ text: testText }],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${error.substring(0, 200)}\n`);
    } else {
      const result = await response.json();
      if (result.embedding && result.embedding.values) {
        console.log(`✅ SUCCESS!`);
        console.log(`   Dimensions: ${result.embedding.values.length}`);
        console.log(
          `   First 5 values: ${result.embedding.values
            .slice(0, 5)
            .join(", ")}\n`
        );
        return result;
      } else {
        console.log(
          `❌ Unexpected response format:`,
          JSON.stringify(result).substring(0, 200)
        );
      }
    }
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  // Method 2: batchEmbedContents endpoint
  try {
    console.log("Method 2: POST to batchEmbedContents endpoint");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            model: `models/${model}`,
            content: {
              parts: [{ text: testText }],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${error.substring(0, 200)}\n`);
    } else {
      const result = await response.json();
      if (result.embeddings && result.embeddings[0]) {
        console.log(`✅ SUCCESS!`);
        console.log(`   Dimensions: ${result.embeddings[0].values.length}`);
        console.log(
          `   First 5 values: ${result.embeddings[0].values
            .slice(0, 5)
            .join(", ")}\n`
        );
        return result;
      } else {
        console.log(
          `❌ Unexpected response format:`,
          JSON.stringify(result).substring(0, 200)
        );
      }
    }
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  console.log("=".repeat(70));
  console.log("❌ All REST methods failed");
}

testEmbeddingREST().catch(console.error);
