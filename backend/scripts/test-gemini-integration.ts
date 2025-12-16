import { geminiService } from "../src/services/gemini.service";
import { logger } from "../src/utils/logger";

async function testGeminiIntegration() {
  console.log("🧪 Testing Gemini Integration\n");

  // Check if service is available
  if (!geminiService.isAvailable()) {
    console.error("❌ Gemini service is not available. Check your API key.");
    process.exit(1);
  }

  console.log("✅ Gemini service is available\n");

  // Test session creation and message sending
  const testSessionId = "test-session-" + Date.now();

  try {
    console.log("📤 Sending test message...");
    const response = await geminiService.sendMessage(
      testSessionId,
      "Hello! Can you tell me about Metalogics services?"
    );

    console.log("\n📥 Response received:");
    console.log("-".repeat(60));
    console.log(response);
    console.log("-".repeat(60));

    // Test streaming
    console.log("\n📤 Testing streaming response...");
    const stream = await geminiService.sendMessageStream(
      testSessionId,
      "What are your business hours?"
    );

    console.log("\n📥 Streaming response:");
    console.log("-".repeat(60));
    for await (const chunk of stream) {
      process.stdout.write(chunk);
    }
    console.log("\n" + "-".repeat(60));

    // Clean up
    geminiService.clearSession(testSessionId);
    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testGeminiIntegration().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
