import WebSocket from "ws";
import { logger } from "../src/utils/logger";

/**
 * Test Voice-to-Gemini Integration
 * Simulates a Retell WebSocket connection and tests the LLM integration
 */

const WS_URL = "ws://localhost:3000/api/retell/llm?call_id=test-integration";
const TEST_MESSAGES = [
  "Hello, what services do you offer?",
  "Can you tell me about your AI solutions?",
  "I'd like to book a consultation",
];

async function testVoiceGeminiIntegration() {
  console.log("🧪 Testing Voice-to-Gemini Integration\n");
  console.log("Connecting to WebSocket:", WS_URL);

  const ws = new WebSocket(WS_URL);

  return new Promise<void>((resolve, reject) => {
    let messageIndex = 0;
    let responseReceived = false;

    ws.on("open", () => {
      console.log("✅ WebSocket connected\n");

      // Send call details
      console.log("📤 Sending call details...");
      ws.send(
        JSON.stringify({
          interaction_type: "call_details",
          call: {
            call_id: "test-integration",
            agent_id: "test-agent",
          },
        })
      );
    });

    ws.on("message", (data: Buffer) => {
      const message = JSON.parse(data.toString());
      console.log("📥 Received:", message.response_type);

      if (message.response_type === "config") {
        console.log("✅ Config received\n");

        // Send first test message
        sendTestMessage(ws, messageIndex++);
      } else if (message.response_type === "response") {
        responseReceived = true;

        if (message.content) {
          process.stdout.write(message.content);
        }

        if (message.content_complete) {
          console.log("\n");
          console.log("✅ Response complete\n");

          // Send next message or finish
          if (messageIndex < TEST_MESSAGES.length) {
            setTimeout(() => {
              sendTestMessage(ws, messageIndex++);
            }, 1000);
          } else {
            console.log("✅ All test messages completed");
            ws.close();
            resolve();
          }
        }
      }
    });

    ws.on("close", (code: number, reason: Buffer) => {
      console.log("\n🔌 WebSocket closed", {
        code,
        reason: reason.toString(),
      });

      if (responseReceived) {
        resolve();
      } else {
        reject(new Error("No response received"));
      }
    });

    ws.on("error", (error: Error) => {
      console.error("\n❌ WebSocket error:", error.message);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.error("\n❌ Test timeout");
        ws.close();
        reject(new Error("Test timeout"));
      }
    }, 30000);
  });
}

function sendTestMessage(ws: WebSocket, index: number) {
  const message = TEST_MESSAGES[index];
  console.log(`📤 Sending test message ${index + 1}/${TEST_MESSAGES.length}:`);
  console.log(`   "${message}"\n`);

  ws.send(
    JSON.stringify({
      interaction_type: "response_required",
      response_id: Date.now(),
      transcript: [
        {
          role: "user",
          content: message,
        },
      ],
    })
  );

  console.log("⏳ Waiting for response...\n");
}

// Run the test
console.log("=".repeat(60));
console.log("Voice-to-Gemini Integration Test");
console.log("=".repeat(60));
console.log();

testVoiceGeminiIntegration()
  .then(() => {
    console.log("\n" + "=".repeat(60));
    console.log("✅ Integration test completed successfully!");
    console.log("=".repeat(60));
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n" + "=".repeat(60));
    console.error("❌ Integration test failed:", error.message);
    console.error("=".repeat(60));
    console.error("\nTroubleshooting:");
    console.error("1. Ensure backend server is running: npm run dev");
    console.error("2. Check GEMINI_API_KEY is set in backend/.env");
    console.error("3. Verify WebSocket endpoint is accessible");
    console.error("4. Review logs in backend/logs/app.log");
    process.exit(1);
  });
