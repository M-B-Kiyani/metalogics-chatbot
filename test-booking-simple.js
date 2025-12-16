/**
 * Simple test to check if booking is working via HTTP API
 */

const API_BASE = "http://localhost:3000";

async function testBooking() {
  console.log("🧪 Testing Booking via API...\n");

  try {
    // Test 1: Check if server is running
    console.log("1️⃣ Checking server health...");
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    if (!healthResponse.ok) {
      throw new Error("Server is not running!");
    }
    const health = await healthResponse.json();
    console.log("✅ Server is healthy:", health.status);
    console.log("");

    // Test 2: Start a conversation
    console.log("2️⃣ Starting conversation...");
    const sessionId = `test-${Date.now()}`;

    const step1 = await fetch(`${API_BASE}/api/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: "I want to book an appointment",
      }),
    });

    const result1 = await step1.json();
    console.log("Response:", result1.response);
    console.log("");

    // Test 3: Provide name
    console.log("3️⃣ Providing name...");
    const step2 = await fetch(`${API_BASE}/api/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: "My name is John Smith",
      }),
    });

    const result2 = await step2.json();
    console.log("Response:", result2.response);
    console.log("");

    // Test 4: Provide email
    console.log("4️⃣ Providing email...");
    const step3 = await fetch(`${API_BASE}/api/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: "john.smith@example.com",
      }),
    });

    const result3 = await step3.json();
    console.log("Response:", result3.response);
    console.log("");

    // Test 5: Provide date
    console.log("5️⃣ Providing date...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const step4 = await fetch(`${API_BASE}/api/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: `Tomorrow (${dateStr})`,
      }),
    });

    const result4 = await step4.json();
    console.log("Response:", result4.response);
    console.log("");

    // Test 6: Provide time
    console.log("6️⃣ Providing time...");
    const step5 = await fetch(`${API_BASE}/api/conversation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message: "2:00 PM",
      }),
    });

    const result5 = await step5.json();
    console.log("Response:", result5.response);
    console.log("");

    console.log("✅ Test completed!");
    console.log("\n📊 Check if booking was created in the responses above");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("\n💡 Make sure:");
    console.error(
      "   1. Backend server is running (npm run dev in backend folder)"
    );
    console.error("   2. Database is connected");
    console.error("   3. Gemini API key is configured");
  }
}

// Run the test
testBooking();
