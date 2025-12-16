/**
 * Test script to debug Gemini embedding API
 */

import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: API_KEY not set");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testEmbedding() {
  console.log("Testing Gemini Embedding API...\n");
  console.log("SDK Version: @google/genai@1.30.0\n");

  const testText = "Metalogics offers web development services";

  console.log(`Test text: "${testText}"`);
  console.log("=".repeat(70) + "\n");

  // Method 1: content as string
  try {
    console.log("Method 1: content as string");
    const result = await ai.models.embedContent({
      model: "text-embedding-004",
      content: testText,
    });
    console.log(`✅ SUCCESS! Dimensions: ${result.embedding.length}`);
    console.log(
      `   First 5 values: ${result.embedding.slice(0, 5).join(", ")}\n`
    );
    return;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  // Method 2: content as object with parts
  try {
    console.log("Method 2: content as { parts: [{ text }] }");
    const result = await ai.models.embedContent({
      model: "text-embedding-004",
      content: { parts: [{ text: testText }] },
    });
    console.log(`✅ SUCCESS! Dimensions: ${result.embedding.length}`);
    console.log(
      `   First 5 values: ${result.embedding.slice(0, 5).join(", ")}\n`
    );
    return;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  // Method 3: Using model.embedContent directly
  try {
    console.log("Method 3: Using model instance");
    const model = ai.models.get({ model: "text-embedding-004" });
    const result = await model.embedContent({ content: testText });
    console.log(`✅ SUCCESS! Dimensions: ${result.embedding.length}`);
    console.log(
      `   First 5 values: ${result.embedding.slice(0, 5).join(", ")}\n`
    );
    return;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  // Method 4: Try batchEmbedContents
  try {
    console.log("Method 4: Using batchEmbedContents");
    const result = await (ai.models as any).batchEmbedContents({
      model: "text-embedding-004",
      requests: [{ content: { parts: [{ text: testText }] } }],
    });
    console.log(`✅ SUCCESS!`);
    console.log(
      `   Result:`,
      JSON.stringify(result, null, 2).substring(0, 200)
    );
    return;
  } catch (error: any) {
    console.log(`❌ Failed: ${error.message}\n`);
  }

  // Method 5: Check available methods
  console.log("Method 5: Checking available methods on ai.models");
  console.log(
    "Available methods:",
    Object.getOwnPropertyNames(Object.getPrototypeOf(ai.models))
  );

  console.log("\n" + "=".repeat(70));
  console.log("❌ All methods failed - API may have changed");
  console.log("Check: https://github.com/google/generative-ai-js");
}

testEmbedding().catch(console.error);
